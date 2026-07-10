import {
  chmod,
  constants,
  lstat,
  mkdir,
  mkdtemp,
  open,
  opendir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
  win32,
} from "node:path";

import { canonicalJson, sha256 } from "./canonical-json.js";
import {
  CandidateDefinitionSchema,
  ResolvedImageSchema,
  V1_INPUT_LIMITS,
  type CandidateDefinition,
  type ResolvedCandidate,
  type ResolvedImage,
} from "./contracts.js";
import type { Result } from "./errors.js";
import {
  directoryIdentity,
  matchesDirectoryIdentity,
  normalizePrivateDirectory,
  removeOwnedDirectory,
  type DirectoryIdentity,
  type QuarantineRemovalOptions,
} from "./filesystem.js";

export const LAB_NAMESPACE = "reynard-lab-v1";

export function defaultLabStateRoot(): string {
  return join(tmpdir(), LAB_NAMESPACE);
}

export interface CandidateSnapshot {
  readonly definition: CandidateDefinition;
  readonly definitionPath: string;
  readonly sourcePath: string;
  readonly snapshotPath: string;
  readonly sourceDigest: `sha256:${string}`;
}

export interface CandidateSnapshotOptions {
  readonly stagingRoot?: string;
  readonly directoryOperations?: QuarantineRemovalOptions;
}

interface SnapshotOwnership {
  readonly stagingRoot: string;
  readonly stagingIdentity: DirectoryIdentity;
  readonly snapshotPath: string;
  readonly snapshotIdentity: DirectoryIdentity;
  readonly definitionPath: string;
  readonly sourcePath: string;
  readonly definitionIdentity: string;
  readonly sourceDigest: `sha256:${string}`;
  active: boolean;
}

type OwnedSnapshot = CandidateSnapshot | ResolvedCandidate;

const SNAPSHOT_OWNERSHIP = new WeakMap<object, SnapshotOwnership>();

interface SourceEntry {
  readonly relativePath: string;
  readonly bytes: Uint8Array;
  readonly digest: `sha256:${string}`;
  readonly executableBits: number;
}

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function compareLexicographically(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

async function collectSource(
  sourceRoot: string,
  limits = V1_INPUT_LIMITS,
  directory = sourceRoot,
  budget = { fileCount: 0, totalBytes: 0, directoryCount: 0 },
): Promise<SourceEntry[]> {
  const entries: SourceEntry[] = [];
  const names: string[] = [];
  const directoryHandle = await opendir(directory);
  for await (const entry of directoryHandle) {
    names.push(entry.name);
    if (names.length > limits.sourceFileCount + 1) {
      throw new Error(
        `Candidate source directory entry count exceeds ${limits.sourceFileCount}`,
      );
    }
  }
  for (const name of names.sort(compareLexicographically)) {
    const absolutePath = join(directory, name);
    const metadata = await lstat(absolutePath);
    if (metadata.isDirectory()) {
      budget.directoryCount += 1;
      if (budget.directoryCount > limits.sourceFileCount) {
        throw new Error(
          `Candidate source directory count exceeds ${limits.sourceFileCount}`,
        );
      }
      entries.push(
        ...(await collectSource(
          sourceRoot,
          limits,
          absolutePath,
          budget,
        )),
      );
      continue;
    }
    if (!metadata.isFile()) {
      throw new Error(`Source entry is not a regular file: ${absolutePath}`);
    }
    budget.fileCount += 1;
    if (budget.fileCount > limits.sourceFileCount) {
      throw new Error(
        `Candidate source file count exceeds ${limits.sourceFileCount}`,
      );
    }
    if (metadata.size > limits.sourceFileBytes) {
      throw new Error(
        `Candidate source file exceeds ${limits.sourceFileBytes} bytes: ${absolutePath}`,
      );
    }
    const bytes = await readBoundedFile(absolutePath, limits.sourceFileBytes);
    budget.totalBytes += bytes.byteLength;
    if (budget.totalBytes > limits.sourceTotalBytes) {
      throw new Error(
        `Candidate source exceeds ${limits.sourceTotalBytes} aggregate bytes`,
      );
    }
    entries.push({
      relativePath: relative(sourceRoot, absolutePath).split(sep).join("/"),
      bytes,
      digest: sha256(bytes),
      executableBits: metadata.mode & 0o111,
    });
  }
  return entries;
}

async function readBoundedFile(
  path: string,
  byteLimit: number,
): Promise<Buffer> {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat({ bigint: true });
    if (!before.isFile()) {
      throw new Error(`Expected a regular file: ${path}`);
    }
    if (before.size > BigInt(byteLimit)) {
      throw new Error(`File exceeds ${byteLimit} bytes: ${path}`);
    }
    const chunks: Buffer[] = [];
    let byteLength = 0;
    for (;;) {
      const chunk = Buffer.allocUnsafe(Math.min(65_536, byteLimit + 1 - byteLength));
      const { bytesRead } = await handle.read(chunk, 0, chunk.byteLength, null);
      if (bytesRead === 0) break;
      byteLength += bytesRead;
      if (byteLength > byteLimit) {
        throw new Error(`File exceeds ${byteLimit} bytes: ${path}`);
      }
      chunks.push(chunk.subarray(0, bytesRead));
    }
    const after = await handle.stat({ bigint: true });
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mode !== after.mode ||
      before.mtimeNs !== after.mtimeNs ||
      before.ctimeNs !== after.ctimeNs
    ) {
      throw new Error(`File changed while it was being read: ${path}`);
    }
    return Buffer.concat(chunks, byteLength);
  } finally {
    await handle.close();
  }
}

function sourceDigest(entries: readonly SourceEntry[]): `sha256:${string}` {
  return sha256(
    canonicalJson(
      [...entries]
        .sort((left, right) =>
          compareLexicographically(left.relativePath, right.relativePath),
        )
        .map(({ relativePath, digest, executableBits }) => ({
          relativePath,
          digest,
          executableBits,
        })),
    ),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validSourceRelativePath(value: string): boolean {
  if (isAbsolute(value) || win32.isAbsolute(value) || value.includes("\0")) {
    return false;
  }
  const segments = value.split(/[\\/]/);
  return segments.every((segment) => segment !== "" && segment !== "..");
}

async function resolveSourceDirectory(
  definitionDirectory: string,
  relativePath: string,
): Promise<string> {
  let currentPath = definitionDirectory;
  for (const segment of relativePath.split(/[\\/]/)) {
    currentPath = join(currentPath, segment);
    const metadata = await lstat(currentPath);
    if (metadata.isSymbolicLink()) {
      throw new Error(
        `Candidate source path contains a symlink component: ${currentPath}`,
      );
    }
    if (!metadata.isDirectory()) {
      throw new Error(
        `Candidate source path component is not a directory: ${currentPath}`,
      );
    }
  }
  return currentPath;
}

function snapshotMatchesOwnership(
  snapshot: OwnedSnapshot,
  ownership: SnapshotOwnership,
): boolean {
  return (
    snapshot.snapshotPath === ownership.snapshotPath &&
    snapshot.definitionPath === ownership.definitionPath &&
    snapshot.sourcePath === ownership.sourcePath &&
    snapshot.definition.source.digest === ownership.sourceDigest &&
    canonicalJson(snapshot.definition) === ownership.definitionIdentity
  );
}

export async function verifyCandidateSnapshotOwnership(
  snapshot: OwnedSnapshot,
  expectedStagingRoot?: string,
): Promise<Result<void>> {
  const ownership = SNAPSHOT_OWNERSHIP.get(snapshot);
  if (ownership === undefined || !ownership.active) {
    return invalidInput("Candidate snapshot is not owned by this process");
  }
  try {
    const resolvedStagingRoot = resolve(ownership.stagingRoot);
    if (
      (expectedStagingRoot !== undefined &&
        resolvedStagingRoot !== resolve(expectedStagingRoot)) ||
      dirname(ownership.snapshotPath) !== resolvedStagingRoot ||
      !snapshotMatchesOwnership(snapshot, ownership)
    ) {
      return invalidInput("Candidate snapshot ownership does not match its staging root");
    }
    const staging = await lstat(resolvedStagingRoot);
    if (
      !matchesDirectoryIdentity(staging, ownership.stagingIdentity) ||
      (staging.mode & 0o077) !== 0
    ) {
      return invalidInput("Candidate staging root is no longer owner-controlled");
    }
    const candidate = await lstat(ownership.snapshotPath);
    if (
      !matchesDirectoryIdentity(candidate, ownership.snapshotIdentity) ||
      (candidate.mode & 0o022) !== 0
    ) {
      return invalidInput("Candidate snapshot is no longer an owned directory");
    }
    return { ok: true, value: undefined };
  } catch (error) {
    return invalidInput(
      `Could not verify candidate snapshot ownership: ${errorMessage(error)}`,
    );
  }
}

export async function cleanupCandidateSnapshot(
  snapshot: OwnedSnapshot,
  operations: QuarantineRemovalOptions = {},
): Promise<void> {
  const registered = SNAPSHOT_OWNERSHIP.get(snapshot);
  if (registered === undefined) {
    throw new Error("Candidate snapshot is not owned by this process");
  }
  if (!registered.active) return;
  const owned = await verifyCandidateSnapshotOwnership(snapshot);
  if (!owned.ok) throw new Error(owned.error.message);
  const ownership = SNAPSHOT_OWNERSHIP.get(snapshot);
  if (ownership === undefined) {
    throw new Error("Candidate snapshot is not owned by this process");
  }
  await removeOwnedDirectory(
    ownership.snapshotPath,
    ownership.stagingRoot,
    ownership.snapshotIdentity,
    {
      ...operations,
      recoverableName: (token) =>
        `${LAB_NAMESPACE}-p${process.pid}-quarantine-${token}`,
    },
  );
  ownership.active = false;
}

export async function verifyCandidateSnapshot(
  snapshot: OwnedSnapshot,
): Promise<Result<void>> {
  try {
    const owned = await verifyCandidateSnapshotOwnership(snapshot);
    if (!owned.ok) return owned;
    const metadata = await lstat(snapshot.snapshotPath);
    if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
      return invalidInput("Candidate snapshot is not a non-symlink directory");
    }
    const digest = sourceDigest(await collectSource(snapshot.snapshotPath));
    if (digest !== snapshot.definition.source.digest) {
      return invalidInput("Candidate snapshot changed after validation");
    }
    return { ok: true, value: undefined };
  } catch (error) {
    return invalidInput(
      `Could not verify candidate snapshot: ${errorMessage(error)}`,
    );
  }
}

export async function resolveCandidateSnapshot(
  snapshot: CandidateSnapshot,
  image: ResolvedImage,
): Promise<Result<ResolvedCandidate>> {
  const owned = await verifyCandidateSnapshotOwnership(snapshot);
  if (!owned.ok) return owned;
  const parsedImage = ResolvedImageSchema.safeParse(image);
  if (!parsedImage.success) {
    return invalidInput(
      `Invalid resolved image: ${parsedImage.error.issues.map((issue) => issue.message).join("; ")}`,
    );
  }
  if (
    parsedImage.data.reference !== snapshot.definition.image ||
    parsedImage.data.platform !== snapshot.definition.platform
  ) {
    return invalidInput("Resolved image does not match the candidate definition");
  }
  const ownership = SNAPSHOT_OWNERSHIP.get(snapshot);
  if (ownership === undefined) {
    return invalidInput("Candidate snapshot is not owned by this process");
  }
  const candidate: ResolvedCandidate = Object.freeze({
    definition: snapshot.definition,
    definitionPath: snapshot.definitionPath,
    sourcePath: snapshot.sourcePath,
    snapshotPath: snapshot.snapshotPath,
    image: parsedImage.data,
  });
  SNAPSHOT_OWNERSHIP.set(candidate, ownership);
  return { ok: true, value: candidate };
}

export async function loadCandidateSnapshot(
  definitionPath: string,
  options: CandidateSnapshotOptions = {},
): Promise<Result<CandidateSnapshot>> {
  let snapshotPath: string | undefined;
  let snapshotIdentity: DirectoryIdentity | undefined;
  let stagingRoot: string | undefined;
  try {
    const absoluteDefinitionPath = resolve(definitionPath);
    const definitionMetadata = await lstat(absoluteDefinitionPath);
    if (!definitionMetadata.isFile() || definitionMetadata.isSymbolicLink()) {
      return invalidInput("Candidate definition must be a regular, non-symlink file");
    }
    const definitionBytes = await readBoundedFile(
      absoluteDefinitionPath,
      V1_INPUT_LIMITS.candidateDefinitionBytes,
    );
    const parsed = CandidateDefinitionSchema.safeParse(
      JSON.parse(definitionBytes.toString("utf8")),
    );
    if (!parsed.success) {
      return invalidInput(
        `Invalid candidate definition: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    if (!validSourceRelativePath(parsed.data.source.relativePath)) {
      return invalidInput(
        "Candidate source.relativePath must be relative and cannot traverse parents",
      );
    }

    const sourcePath = await resolveSourceDirectory(
      dirname(absoluteDefinitionPath),
      parsed.data.source.relativePath,
    );
    const entries = await collectSource(sourcePath);
    const digest = sourceDigest(entries);
    if (digest !== parsed.data.source.digest) {
      return invalidInput("Candidate source digest does not match its declaration");
    }

    stagingRoot = resolve(
      options.stagingRoot ?? join(defaultLabStateRoot(), "staging"),
    );
    await mkdir(stagingRoot, { recursive: true, mode: 0o700 });
    const stagingIdentity = await normalizePrivateDirectory(stagingRoot, {
      rejectWritable: false,
    });
    snapshotPath = await mkdtemp(
      join(stagingRoot, `${LAB_NAMESPACE}-p${process.pid}-`),
    );
    snapshotIdentity = directoryIdentity(await lstat(snapshotPath));
    for (const entry of entries) {
      const destination = join(snapshotPath, ...entry.relativePath.split("/"));
      await mkdir(dirname(destination), { recursive: true, mode: 0o755 });
      await chmod(dirname(destination), 0o755);
      await writeFile(destination, entry.bytes, { mode: 0o644 });
      await chmod(destination, 0o644 | entry.executableBits);
    }
    await chmod(snapshotPath, 0o755);
    const finalizedSnapshotIdentity = directoryIdentity(
      await lstat(snapshotPath),
    );
    if (
      finalizedSnapshotIdentity.dev !== snapshotIdentity.dev ||
      finalizedSnapshotIdentity.ino !== snapshotIdentity.ino ||
      finalizedSnapshotIdentity.uid !== snapshotIdentity.uid
    ) {
      throw new Error("Candidate snapshot identity changed while it was finalized");
    }
    snapshotIdentity = finalizedSnapshotIdentity;

    const snapshotEntries = await collectSource(snapshotPath);
    if (sourceDigest(snapshotEntries) !== digest) {
      throw new Error("Staged candidate snapshot failed verification");
    }
    const sourceAfterSnapshot = await collectSource(sourcePath);
    if (sourceDigest(sourceAfterSnapshot) !== digest) {
      throw new Error("Candidate source changed while the snapshot was created");
    }

    const snapshot: CandidateSnapshot = Object.freeze({
      definition: parsed.data,
      definitionPath: absoluteDefinitionPath,
      sourcePath,
      snapshotPath,
      sourceDigest: digest,
    });
    SNAPSHOT_OWNERSHIP.set(snapshot, {
      stagingRoot: resolve(stagingRoot),
      stagingIdentity,
      snapshotPath,
      snapshotIdentity,
      definitionPath: absoluteDefinitionPath,
      sourcePath,
      definitionIdentity: canonicalJson(parsed.data),
      sourceDigest: digest,
      active: true,
    });
    return {
      ok: true,
      value: snapshot,
    };
  } catch (error) {
    if (snapshotPath !== undefined) {
      try {
        if (snapshotIdentity === undefined || stagingRoot === undefined) {
          throw new Error(
            "candidate snapshot identity was not established; preserving staging path",
          );
        }
        await removeOwnedDirectory(
          snapshotPath,
          stagingRoot,
          snapshotIdentity,
          {
            ...options.directoryOperations,
            recoverableName: (token) =>
              `${LAB_NAMESPACE}-p${process.pid}-quarantine-${token}`,
          },
        );
      } catch (cleanupError) {
        return invalidInput(
          `Could not load candidate: ${errorMessage(error)}; staging cleanup failed: ${errorMessage(cleanupError)}`,
        );
      }
    }
    return invalidInput(`Could not load candidate: ${errorMessage(error)}`);
  }
}
