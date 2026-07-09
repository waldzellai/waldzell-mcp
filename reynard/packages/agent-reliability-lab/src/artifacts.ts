import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  rename,
  rm,
  unlink,
  writeFile,
  type FileHandle,
} from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

import { canonicalJson, sha256 } from "./canonical-json.js";
import { compareEvaluations } from "./compare.js";
import {
  ArtifactWriteInputSchema,
  RunManifestSchema,
  RunResultArtifactSchema,
  TraceRecordSchema,
  type ArtifactWriteInput,
  type EvaluationCase,
  type ExecutionResult,
  type LoadedEvaluationCases,
  type RunManifest,
  type RunResultArtifact,
  type TraceRecord,
} from "./contracts.js";
import {
  evaluateExecutions,
  evaluateProtocolResults,
  type EvaluatedExecutions,
} from "./evaluator.js";
import type { Result } from "./errors.js";
import { createRunManifest } from "./manifest.js";
import { parseEvaluationCasesText } from "./runner.js";

const ARTIFACT_NAMES = [
  "baseline.trace.jsonl",
  "candidate.trace.jsonl",
  "manifest.json",
  "result.json",
] as const;

export interface ArtifactIo {
  readonly readFile: (path: string) => Promise<Uint8Array>;
  readonly writeFile: (path: string, contents: string) => Promise<void>;
  readonly rename: (source: string, target: string) => Promise<void>;
}

export interface ArtifactWriteOptions {
  readonly io?: Partial<ArtifactIo>;
  readonly lockTimeoutMillis?: number;
  readonly lockRetryMillis?: number;
}

export interface ArtifactRecoveryOptions {
  readonly staleMalformedLockMillis?: number;
  readonly isProcessAlive?: (pid: number) => boolean;
}

export interface ArtifactWriteResult {
  readonly directory: string;
  readonly published: boolean;
}

export interface ValidatedArtifactBundle {
  readonly manifest: RunManifest;
  readonly baselineTrace: readonly TraceRecord[];
  readonly candidateTrace: readonly TraceRecord[];
  readonly result: RunResultArtifact;
}

interface SerializedArtifactBundle extends ValidatedArtifactBundle {
  readonly files: Readonly<Record<(typeof ARTIFACT_NAMES)[number], string>>;
}

interface PublishLockRecord {
  readonly schemaVersion: 1;
  readonly pid: number;
  readonly token: string;
  readonly createdAtMillis: number;
}

interface PublishLock {
  readonly path: string;
  readonly handle: FileHandle;
  readonly record: PublishLockRecord;
}

const DEFAULT_LOCK_TIMEOUT_MILLIS = 5_000;
const DEFAULT_LOCK_RETRY_MILLIS = 10;
const DEFAULT_STALE_LOCK_MILLIS = 300_000;
const ACTIVE_LOCK_TOKENS = new Set<string>();

const defaultIo: ArtifactIo = {
  readFile: async (path) => readFile(path),
  writeFile: async (path, contents) => {
    await writeFile(path, contents, { flag: "wx", mode: 0o600 });
  },
  rename: async (source, target) => rename(source, target),
};

function artifactWriteFailed<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "ArtifactWriteFailed", message } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sameCanonicalJson(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function serializeJson(value: unknown): string {
  return `${canonicalJson(value)}\n`;
}

function serializeTrace(records: readonly TraceRecord[]): string {
  return `${records.map((record) => canonicalJson(record)).join("\n")}\n`;
}

function fileErrorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return fileErrorCode(error) === "EPERM";
  }
}

async function assertPrivateRunsDirectory(path: string): Promise<void> {
  const directory = await lstat(path);
  const currentUid = process.getuid?.();
  if (
    !directory.isDirectory() ||
    (directory.mode & 0o077) !== 0 ||
    (currentUid !== undefined && directory.uid !== currentUid)
  ) {
    throw new Error(
      "Artifact runs directory must be an owner-only real directory",
    );
  }
}

function parsePublishLockRecord(value: unknown): PublishLockRecord | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Partial<PublishLockRecord>;
  return record.schemaVersion === 1 &&
    typeof record.pid === "number" &&
    Number.isSafeInteger(record.pid) &&
    record.pid > 0 &&
    typeof record.token === "string" &&
    record.token.length > 0 &&
    typeof record.createdAtMillis === "number" &&
    Number.isSafeInteger(record.createdAtMillis) &&
      record.createdAtMillis >= 0 &&
    !Object.prototype.hasOwnProperty.call(record, "released")
    ? (record as PublishLockRecord)
    : undefined;
}

async function writeLockRecord(
  handle: FileHandle,
  record: PublishLockRecord,
): Promise<void> {
  const bytes = Buffer.from(serializeJson(record));
  let offset = 0;
  while (offset < bytes.byteLength) {
    const { bytesWritten } = await handle.write(
      bytes,
      offset,
      bytes.byteLength - offset,
      offset,
    );
    if (bytesWritten === 0) {
      throw new Error("Publish lock write made no progress");
    }
    offset += bytesWritten;
  }
  await handle.truncate(bytes.byteLength);
  await handle.sync();
}

async function acquirePublishLock(
  lockPath: string,
  options: ArtifactWriteOptions,
): Promise<Result<PublishLock>> {
  const timeoutMillis =
    options.lockTimeoutMillis ?? DEFAULT_LOCK_TIMEOUT_MILLIS;
  const retryMillis = options.lockRetryMillis ?? DEFAULT_LOCK_RETRY_MILLIS;
  if (
    !Number.isFinite(timeoutMillis) ||
    timeoutMillis < 0 ||
    !Number.isFinite(retryMillis) ||
    retryMillis <= 0
  ) {
    return artifactWriteFailed("Invalid artifact publish lock timing");
  }
  const deadline = Date.now() + timeoutMillis;

  for (;;) {
    try {
      const handle = await open(lockPath, "wx", 0o600);
      const record: PublishLockRecord = {
        schemaVersion: 1,
        pid: process.pid,
        token: randomUUID(),
        createdAtMillis: Date.now(),
      };
      try {
        await writeLockRecord(handle, record);
        ACTIVE_LOCK_TOKENS.add(record.token);
        return { ok: true, value: { path: lockPath, handle, record } };
      } catch (error) {
        await handle.close().catch(() => undefined);
        await unlink(lockPath).catch(() => undefined);
        return artifactWriteFailed(
          `Could not initialize publish lock: ${errorMessage(error)}`,
        );
      }
    } catch (error) {
      if (fileErrorCode(error) !== "EEXIST") {
        return artifactWriteFailed(
          `Could not acquire publish lock: ${errorMessage(error)}`,
        );
      }
      if (Date.now() >= deadline) {
        return artifactWriteFailed("Timed out waiting for artifact publish lock");
      }
      await delay(Math.min(retryMillis, Math.max(1, deadline - Date.now())));
    }
  }
}

async function releasePublishLock(lock: PublishLock): Promise<Result<void>> {
  try {
    await lock.handle.close();
    await unlink(lock.path);
    return { ok: true, value: undefined };
  } catch (error) {
    await lock.handle.close().catch(() => undefined);
    return artifactWriteFailed(
      `Could not release publish lock: ${errorMessage(error)}`,
    );
  } finally {
    ACTIVE_LOCK_TOKENS.delete(lock.record.token);
  }
}

/**
 * Removes dead-owner publish locks during the single-owner startup preflight.
 * Ordinary concurrent publishers never steal or unlink another writer's lock.
 */
export async function recoverArtifactPublishLocks(
  runsDirectory: string,
  options: ArtifactRecoveryOptions = {},
): Promise<Result<number>> {
  const absoluteRunsDirectory = resolve(runsDirectory);
  const isProcessAlive = options.isProcessAlive ?? processIsAlive;
  const malformedLockMillis =
    options.staleMalformedLockMillis ?? DEFAULT_STALE_LOCK_MILLIS;
  if (!Number.isFinite(malformedLockMillis) || malformedLockMillis <= 0) {
    return artifactWriteFailed("Invalid stale publish lock age");
  }
  try {
    await assertPrivateRunsDirectory(absoluteRunsDirectory);
    const entries = await readdir(absoluteRunsDirectory, {
      withFileTypes: true,
    });
    let removed = 0;
    for (const entry of entries) {
      if (!/^\.sha256:[0-9a-f]{64}\.publish-lock$/.test(entry.name)) {
        continue;
      }
      const lockPath = join(absoluteRunsDirectory, entry.name);
      const lockStat = await lstat(lockPath);
      if (!lockStat.isFile()) {
        return artifactWriteFailed(`Publish lock is not regular: ${entry.name}`);
      }
      let record: PublishLockRecord | undefined;
      try {
        const decoded: unknown = JSON.parse(await readFile(lockPath, "utf8"));
        record = parsePublishLockRecord(decoded);
      } catch {
        record = undefined;
      }
      const stale =
        (record !== undefined &&
          record.pid === process.pid &&
          !ACTIVE_LOCK_TOKENS.has(record.token)) ||
        (record !== undefined && !isProcessAlive(record.pid)) ||
        (record === undefined &&
          Date.now() - lockStat.mtimeMs >= malformedLockMillis);
      if (stale) {
        await unlink(lockPath);
        removed += 1;
      }
    }
    return { ok: true, value: removed };
  } catch (error) {
    if (fileErrorCode(error) === "ENOENT") {
      return { ok: true, value: 0 };
    }
    return artifactWriteFailed(
      `Could not recover artifact publish locks: ${errorMessage(error)}`,
    );
  }
}

function executionByCaseId(
  executions: readonly ExecutionResult[],
): ReadonlyMap<string, ExecutionResult> {
  return new Map(executions.map((execution) => [execution.caseId, execution]));
}

function validateLoadedCases(
  loadedCases: LoadedEvaluationCases,
): Result<LoadedEvaluationCases> {
  const reparsed = parseEvaluationCasesText(loadedCases.rawText);
  if (!reparsed.ok) {
    return artifactWriteFailed(
      `Could not reparse host case snapshot: ${reparsed.error.message}`,
    );
  }
  if (
    reparsed.value.digest !== loadedCases.digest ||
    !sameCanonicalJson(reparsed.value.cases, loadedCases.cases)
  ) {
    return artifactWriteFailed(
      "Host case snapshot text, digest, and parsed cases disagree",
    );
  }
  return { ok: true, value: reparsed.value };
}

function makeTrace(
  manifest: RunManifest,
  cases: readonly EvaluationCase[],
  executions: readonly ExecutionResult[],
  evaluated: EvaluatedExecutions,
): readonly TraceRecord[] {
  const executionsById = executionByCaseId(executions);
  return cases.map((evaluationCase, ordinal) => {
    const execution = executionsById.get(evaluationCase.id);
    const caseResult = evaluated.caseResults[ordinal];
    if (execution === undefined || caseResult === undefined) {
      throw new Error(`Missing evaluated execution for ${evaluationCase.id}`);
    }
    return {
      schemaVersion: 1,
      runId: manifest.runId,
      ordinal,
      caseId: evaluationCase.id,
      requestDigest: sha256(
        canonicalJson({
          schemaVersion: 1,
          caseId: evaluationCase.id,
          seed: manifest.seed,
          input: evaluationCase.input,
        }),
      ),
      exitCode: 0,
      timedOut: false,
      protocolResult: caseResult.protocolResult,
      stderr: execution.stderr,
      durationMillis: execution.durationMillis,
    };
  });
}

function buildSerializedBundle(
  input: ArtifactWriteInput,
): Result<SerializedArtifactBundle> {
  const parsedInput = ArtifactWriteInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return artifactWriteFailed(
      `Invalid artifact input: ${parsedInput.error.issues.map((issue) => issue.message).join("; ")}`,
    );
  }

  try {
    const loadedCases = validateLoadedCases(input.loadedCases);
    if (!loadedCases.ok) return loadedCases;
    if (loadedCases.value.digest !== input.manifest.casesDigest) {
      return artifactWriteFailed(
        "Manifest cases digest does not match the host case snapshot",
      );
    }
    const cases = loadedCases.value.cases;
    const baseline = evaluateExecutions(cases, input.baselineExecutions);
    if (!baseline.ok) {
      return artifactWriteFailed(
        `Could not recompute baseline evaluation: ${baseline.error.message}`,
      );
    }
    const candidate = evaluateExecutions(cases, input.candidateExecutions);
    if (!candidate.ok) {
      return artifactWriteFailed(
        `Could not recompute candidate evaluation: ${candidate.error.message}`,
      );
    }
    const compared = compareEvaluations(
      cases,
      baseline.value.evaluation,
      candidate.value.evaluation,
    );
    if (!compared.ok) {
      return artifactWriteFailed(
        `Could not recompute comparison: ${compared.error.message}`,
      );
    }
    if (
      !sameCanonicalJson(
        input.baselineEvaluation,
        baseline.value.evaluation,
      ) ||
      !sameCanonicalJson(
        input.candidateEvaluation,
        candidate.value.evaluation,
      ) ||
      !sameCanonicalJson(
        input.comparison,
        compared.value.comparison,
      )
    ) {
      return artifactWriteFailed(
        "Supplied evaluations or comparison do not match recomputed results",
      );
    }

    const baselineTrace = makeTrace(
      input.manifest,
      cases,
      input.baselineExecutions,
      baseline.value,
    );
    const candidateTrace = makeTrace(
      input.manifest,
      cases,
      input.candidateExecutions,
      candidate.value,
    );
    const result: RunResultArtifact = {
      schemaVersion: 1,
      runId: input.manifest.runId,
      baselineEvaluation: baseline.value.evaluation,
      candidateEvaluation: candidate.value.evaluation,
      comparison: compared.value.comparison,
      overallPassed: compared.value.overallPassed,
    };
    return {
      ok: true,
      value: {
        manifest: input.manifest,
        baselineTrace,
        candidateTrace,
        result,
        files: {
          "manifest.json": serializeJson(input.manifest),
          "baseline.trace.jsonl": serializeTrace(baselineTrace),
          "candidate.trace.jsonl": serializeTrace(candidateTrace),
          "result.json": serializeJson(result),
        },
      },
    };
  } catch (error) {
    return artifactWriteFailed(
      `Could not build artifact bundle: ${errorMessage(error)}`,
    );
  }
}

function parseJsonArtifact<T>(
  name: string,
  bytes: Uint8Array,
  parse: (value: unknown) => { success: true; data: T } | { success: false },
): Result<T> {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"));
    const parsed = parse(decoded);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : artifactWriteFailed(`Invalid ${name}`);
  } catch (error) {
    return artifactWriteFailed(
      `Could not parse ${name}: ${errorMessage(error)}`,
    );
  }
}

function parseTraceArtifact(
  name: string,
  bytes: Uint8Array,
): Result<readonly TraceRecord[]> {
  const contents = Buffer.from(bytes).toString("utf8");
  if (!contents.endsWith("\n")) {
    return artifactWriteFailed(`${name} is not terminated JSONL`);
  }
  const body = contents.slice(0, -1);
  if (body.length === 0) {
    return artifactWriteFailed(`${name} is empty`);
  }
  const records: TraceRecord[] = [];
  for (const [index, line] of body.split("\n").entries()) {
    if (line.length === 0) {
      return artifactWriteFailed(`${name} has an empty record at ${index}`);
    }
    try {
      const decoded: unknown = JSON.parse(line);
      const parsed = TraceRecordSchema.safeParse(decoded);
      if (!parsed.success) {
        return artifactWriteFailed(`${name} has an invalid record at ${index}`);
      }
      records.push({
        ...parsed.data,
        protocolResult: parsed.data.protocolResult.ok
          ? { ok: true, output: parsed.data.protocolResult.output }
          : { ok: false, error: parsed.data.protocolResult.error },
      });
    } catch (error) {
      return artifactWriteFailed(
        `${name} has malformed JSON at ${index}: ${errorMessage(error)}`,
      );
    }
  }
  return { ok: true, value: records };
}

function recomputeManifest(manifest: RunManifest): Result<RunManifest> {
  const recomputed = createRunManifest({
    evaluator: manifest.evaluator,
    seed: manifest.seed,
    baseline: manifest.baseline,
    candidate: manifest.candidate,
    casesDigest: manifest.casesDigest,
    inputLimits: manifest.inputLimits,
    sandbox: manifest.sandbox,
  });
  if (!recomputed.ok || recomputed.value.runId !== manifest.runId) {
    return artifactWriteFailed("Manifest run ID does not match its identity");
  }
  return { ok: true, value: recomputed.value };
}

function validateTrace(
  name: string,
  trace: readonly TraceRecord[],
  manifest: RunManifest,
  cases: readonly EvaluationCase[],
): Result<EvaluatedExecutions> {
  if (trace.length !== cases.length) {
    return artifactWriteFailed(`${name} record count does not match cases`);
  }
  const protocolResults = [];
  for (const [ordinal, evaluationCase] of cases.entries()) {
    const record = trace[ordinal];
    if (record === undefined) {
      return artifactWriteFailed(`${name} is missing ordinal ${ordinal}`);
    }
    const requestDigest = sha256(
      canonicalJson({
        schemaVersion: 1,
        caseId: evaluationCase.id,
        seed: manifest.seed,
        input: evaluationCase.input,
      }),
    );
    if (
      record.ordinal !== ordinal ||
      record.caseId !== evaluationCase.id ||
      record.runId !== manifest.runId ||
      record.requestDigest !== requestDigest
    ) {
      return artifactWriteFailed(
        `${name} identity or ordering mismatch at ordinal ${ordinal}`,
      );
    }
    protocolResults.push({
      caseId: record.caseId,
      protocolResult: record.protocolResult,
    });
  }
  const evaluated = evaluateProtocolResults(cases, protocolResults);
  return evaluated.ok
    ? evaluated
    : artifactWriteFailed(
        `Could not recompute ${name}: ${evaluated.error.message}`,
      );
}

function logicalBundleIdentity(bundle: ValidatedArtifactBundle): string {
  return canonicalJson({
    manifest: bundle.manifest,
    baselineEvaluation: bundle.result.baselineEvaluation,
    candidateEvaluation: bundle.result.candidateEvaluation,
    comparison: bundle.result.comparison,
    overallPassed: bundle.result.overallPassed,
  });
}

async function readValidatedBundle(
  directory: string,
  expectedRunId: string,
  loadedCases: LoadedEvaluationCases,
  io: ArtifactIo,
): Promise<Result<ValidatedArtifactBundle>> {
  try {
    const validatedCases = validateLoadedCases(loadedCases);
    if (!validatedCases.ok) return validatedCases;
    const cases = validatedCases.value.cases;
    const entries = await readdir(directory, { withFileTypes: true });
    const names = entries.map(({ name }) => name).sort();
    if (
      names.length !== ARTIFACT_NAMES.length ||
      names.some((name, index) => name !== ARTIFACT_NAMES[index]) ||
      entries.some((entry) => !entry.isFile())
    ) {
      return artifactWriteFailed(
        "Artifact directory must contain exactly four regular artifact files",
      );
    }

    const [manifestBytes, baselineBytes, candidateBytes, resultBytes] =
      await Promise.all([
        io.readFile(join(directory, "manifest.json")),
        io.readFile(join(directory, "baseline.trace.jsonl")),
        io.readFile(join(directory, "candidate.trace.jsonl")),
        io.readFile(join(directory, "result.json")),
      ]);
    const manifest = parseJsonArtifact(
      "manifest.json",
      manifestBytes,
      (value) => RunManifestSchema.safeParse(value),
    );
    if (!manifest.ok) return manifest;
    if (manifest.value.runId !== expectedRunId) {
      return artifactWriteFailed(
        "Artifact directory name and manifest run ID disagree",
      );
    }
    if (manifest.value.casesDigest !== validatedCases.value.digest) {
      return artifactWriteFailed(
        "Manifest cases digest does not match the host case snapshot",
      );
    }
    const manifestIdentity = recomputeManifest(manifest.value);
    if (!manifestIdentity.ok) return manifestIdentity;

    const baselineTrace = parseTraceArtifact(
      "baseline.trace.jsonl",
      baselineBytes,
    );
    if (!baselineTrace.ok) return baselineTrace;
    const candidateTrace = parseTraceArtifact(
      "candidate.trace.jsonl",
      candidateBytes,
    );
    if (!candidateTrace.ok) return candidateTrace;
    const result = parseJsonArtifact(
      "result.json",
      resultBytes,
      (value) => RunResultArtifactSchema.safeParse(value),
    );
    if (!result.ok) return result;
    if (result.value.runId !== manifest.value.runId) {
      return artifactWriteFailed("Result and manifest run IDs disagree");
    }

    const recomputedBaseline = validateTrace(
      "baseline.trace.jsonl",
      baselineTrace.value,
      manifest.value,
      cases,
    );
    if (!recomputedBaseline.ok) return recomputedBaseline;
    const recomputedCandidate = validateTrace(
      "candidate.trace.jsonl",
      candidateTrace.value,
      manifest.value,
      cases,
    );
    if (!recomputedCandidate.ok) return recomputedCandidate;
    const recomputedComparison = compareEvaluations(
      cases,
      recomputedBaseline.value.evaluation,
      recomputedCandidate.value.evaluation,
    );
    if (!recomputedComparison.ok) {
      return artifactWriteFailed(
        `Could not recompute comparison: ${recomputedComparison.error.message}`,
      );
    }
    if (
      !sameCanonicalJson(
        result.value.baselineEvaluation,
        recomputedBaseline.value.evaluation,
      ) ||
      !sameCanonicalJson(
        result.value.candidateEvaluation,
        recomputedCandidate.value.evaluation,
      ) ||
      !sameCanonicalJson(
        result.value.comparison,
        recomputedComparison.value.comparison,
      ) ||
      result.value.overallPassed !== recomputedComparison.value.overallPassed
    ) {
      return artifactWriteFailed(
        "Stored result does not match reader-side recomputation",
      );
    }

    return {
      ok: true,
      value: {
        manifest: manifest.value,
        baselineTrace: baselineTrace.value,
        candidateTrace: candidateTrace.value,
        result: result.value,
      },
    };
  } catch (error) {
    return artifactWriteFailed(
      `Could not validate artifact bundle: ${errorMessage(error)}`,
    );
  }
}

export async function readArtifactBundle(
  directory: string,
  loadedCases: LoadedEvaluationCases,
): Promise<Result<ValidatedArtifactBundle>> {
  const absoluteDirectory = resolve(directory);
  return readValidatedBundle(
    absoluteDirectory,
    basename(absoluteDirectory),
    loadedCases,
    defaultIo,
  );
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }
    throw error;
  }
}

async function compareExistingTarget(
  target: string,
  staged: ValidatedArtifactBundle,
  loadedCases: LoadedEvaluationCases,
  io: ArtifactIo,
): Promise<Result<ArtifactWriteResult>> {
  const existing = await readValidatedBundle(
    target,
    staged.manifest.runId,
    loadedCases,
    io,
  );
  if (!existing.ok) {
    return artifactWriteFailed(
      `Existing artifact target is invalid: ${existing.error.message}`,
    );
  }
  if (logicalBundleIdentity(existing.value) !== logicalBundleIdentity(staged)) {
    return artifactWriteFailed(
      "Existing artifact target has different logical content",
    );
  }
  return {
    ok: true,
    value: { directory: target, published: false },
  };
}

export async function writeArtifactBundle(
  input: ArtifactWriteInput,
  options: ArtifactWriteOptions = {},
): Promise<Result<ArtifactWriteResult>> {
  const built = buildSerializedBundle(input);
  if (!built.ok) return built;
  const io: ArtifactIo = { ...defaultIo, ...options.io };
  const runsDirectory = resolve(input.runsDirectory);
  const target = join(runsDirectory, built.value.manifest.runId);
  const lockPath = join(
    runsDirectory,
    `.${built.value.manifest.runId}.publish-lock`,
  );
  let stagingDirectory: string | undefined;
  let publishLock: PublishLock | undefined;
  let outcome: Result<ArtifactWriteResult>;

  try {
    await mkdir(runsDirectory, { recursive: true, mode: 0o700 });
    await assertPrivateRunsDirectory(runsDirectory);
    stagingDirectory = await mkdtemp(
      join(runsDirectory, `.${built.value.manifest.runId}.staging-`),
    );
    for (const name of ARTIFACT_NAMES) {
      await io.writeFile(join(stagingDirectory, name), built.value.files[name]);
    }
    const staged = await readValidatedBundle(
      stagingDirectory,
      built.value.manifest.runId,
      input.loadedCases,
      io,
    );
    if (!staged.ok) {
      outcome = staged;
    } else {
      const acquired = await acquirePublishLock(lockPath, options);
      if (!acquired.ok) {
        outcome = acquired;
      } else {
        publishLock = acquired.value;
        if (await pathExists(target)) {
          outcome = await compareExistingTarget(
            target,
            staged.value,
            input.loadedCases,
            io,
          );
        } else {
          try {
            await io.rename(stagingDirectory, target);
            stagingDirectory = undefined;
            outcome = {
              ok: true,
              value: { directory: target, published: true },
            };
          } catch (error) {
            outcome = (await pathExists(target))
              ? await compareExistingTarget(
                  target,
                  staged.value,
                  input.loadedCases,
                  io,
                )
              : artifactWriteFailed(
                  `Could not atomically publish artifact bundle: ${errorMessage(error)}`,
                );
          }
        }
      }
    }
  } catch (error) {
    outcome = artifactWriteFailed(
      `Could not write artifact bundle: ${errorMessage(error)}`,
    );
  }

  if (publishLock !== undefined) {
    const released = await releasePublishLock(publishLock);
    if (!released.ok) outcome = released;
  }
  if (stagingDirectory !== undefined) {
    try {
      await rm(stagingDirectory, { recursive: true, force: true });
    } catch (error) {
      return artifactWriteFailed(
        `Could not clean artifact staging directory: ${errorMessage(error)}`,
      );
    }
  }
  return outcome;
}

export const writeArtifacts = writeArtifactBundle;
