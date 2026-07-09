import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import { canonicalJson, sha256 } from "./canonical-json.js";
import {
  EvaluatorIdentitySchema,
  RunManifestInputSchema,
  RunManifestSchema,
  type EvaluatorIdentity,
  type RunManifest,
  type RunManifestInput,
} from "./contracts.js";
import type { Result } from "./errors.js";

function invalidInput<T>(message: string): Result<T> {
  return {
    ok: false,
    error: { _tag: "InvalidInput", message },
  };
}

function validationMessage(prefix: string, issues: readonly { message: string }[]) {
  return `${prefix}: ${issues.map((issue) => issue.message).join("; ")}`;
}

export function createRunManifest(
  input: RunManifestInput,
): Result<RunManifest> {
  const parsed = RunManifestInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(
      validationMessage("Invalid run manifest input", parsed.error.issues),
    );
  }

  const identity = {
    schemaVersion: 1 as const,
    ...parsed.data,
  };
  const manifest = {
    ...identity,
    runId: sha256(canonicalJson(identity)),
  };
  const validated = RunManifestSchema.safeParse(manifest);
  if (!validated.success) {
    return invalidInput(
      validationMessage("Invalid generated run manifest", validated.error.issues),
    );
  }

  return { ok: true, value: validated.data };
}

interface ImplementationFile {
  readonly relativePath: string;
  readonly bytes: Uint8Array;
}

function compareLexicographically(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

async function collectJavaScriptFiles(
  distDirectory: string,
  directory = distDirectory,
): Promise<ImplementationFile[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: ImplementationFile[] = [];

  for (const entry of entries.sort((left, right) =>
    compareLexicographically(left.name, right.name),
  )) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(distDirectory, absolutePath)));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".js")) {
      continue;
    }

    files.push({
      relativePath: relative(distDirectory, absolutePath).split(sep).join("/"),
      bytes: await readFile(absolutePath),
    });
  }

  return files;
}

async function findNearestLockfile(packageRoot: string): Promise<string> {
  let directory = resolve(packageRoot);

  for (;;) {
    const candidate = join(directory, "pnpm-lock.yaml");
    try {
      if ((await stat(candidate)).isFile()) {
        return candidate;
      }
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? error.code
          : undefined;
      if (code !== "ENOENT") {
        throw error;
      }
    }

    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(`No pnpm-lock.yaml found above ${packageRoot}`);
    }
    directory = parent;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function resolveEvaluatorIdentity(
  packageRoot: string,
): Promise<Result<EvaluatorIdentity>> {
  if (typeof packageRoot !== "string" || packageRoot.length === 0) {
    return invalidInput("Evaluator package root must be a non-empty string");
  }

  try {
    const distDirectory = join(resolve(packageRoot), "dist");
    const implementationFiles = (
      await collectJavaScriptFiles(distDirectory)
    ).sort((left, right) =>
      compareLexicographically(left.relativePath, right.relativePath),
    );
    if (implementationFiles.length === 0) {
      return invalidInput(
        `Evaluator implementation set is empty under ${distDirectory}`,
      );
    }

    const implementationMaterial = implementationFiles.map((file) => ({
      path: file.relativePath,
      bytes: Buffer.from(file.bytes).toString("base64"),
    }));
    const lockfilePath = await findNearestLockfile(packageRoot);
    const identity = {
      schemaVersion: 1 as const,
      implementationDigest: sha256(canonicalJson(implementationMaterial)),
      dependencyLockDigest: sha256(await readFile(lockfilePath)),
      nodeVersion: process.version,
    };
    const validated = EvaluatorIdentitySchema.safeParse(identity);
    if (!validated.success) {
      return invalidInput(
        validationMessage(
          "Invalid generated evaluator identity",
          validated.error.issues,
        ),
      );
    }

    return { ok: true, value: validated.data };
  } catch (error) {
    return invalidInput(
      `Could not resolve evaluator identity: ${errorMessage(error)}`,
    );
  }
}
