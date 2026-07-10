#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  recoverArtifactPublishLocks,
  writeArtifactBundle,
} from "./artifacts.js";
import {
  cleanupCandidateSnapshot,
  loadCandidateSnapshot,
  type CandidateSnapshot,
} from "./candidate.js";
import { compareEvaluations } from "./compare.js";
import {
  V1_INPUT_LIMITS,
  V1_SANDBOX_POLICY,
  type ResolvedCandidate,
} from "./contracts.js";
import type { LabError, Result } from "./errors.js";
import { evaluateExecutions } from "./evaluator.js";
import { createRunManifest, resolveEvaluatorIdentity } from "./manifest.js";
import { createCandidateRequests, loadEvaluationCases } from "./runner.js";
import { DockerSandbox } from "./sandbox/docker.js";

interface CliOptions {
  readonly baseline: string;
  readonly candidate: string;
  readonly cases: string;
  readonly seed: number;
}

interface CompletedEvaluation {
  readonly directory: string;
  readonly published: boolean;
  readonly passedCaseCount: number;
  readonly caseCount: number;
  readonly failedCaseIds: readonly string[];
  readonly overallPassed: boolean;
}

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function withContext(error: LabError, context: string): LabError {
  return { ...error, message: `${context}: ${error.message}` };
}

function parseCliOptions(args: readonly string[]): Result<CliOptions> {
  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        baseline: { type: "string" },
        candidate: { type: "string" },
        cases: { type: "string" },
        seed: { type: "string" },
      },
    });
    if (
      parsed.positionals.length !== 1 ||
      parsed.positionals[0] !== "evaluate"
    ) {
      return invalidInput("Expected the command: evaluate");
    }
    const baseline = parsed.values.baseline;
    const candidate = parsed.values.candidate;
    const cases = parsed.values.cases;
    if (baseline === undefined) return invalidInput("Missing required --baseline");
    if (candidate === undefined) return invalidInput("Missing required --candidate");
    if (cases === undefined) return invalidInput("Missing required --cases");
    const seedText = parsed.values.seed;
    if (seedText === undefined) return invalidInput("Missing required --seed");
    if (!/^-?(?:0|[1-9][0-9]*)$/.test(seedText)) {
      return invalidInput("--seed must be a safe integer");
    }
    const seed = Number(seedText);
    if (!Number.isSafeInteger(seed)) {
      return invalidInput("--seed must be a safe integer");
    }
    return {
      ok: true,
      value: {
        baseline,
        candidate,
        cases,
        seed,
      },
    };
  } catch (error) {
    return invalidInput(
      `Invalid CLI arguments: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function cleanupSnapshots(
  snapshots: readonly (CandidateSnapshot | undefined)[],
): Promise<void> {
  await Promise.all(
    snapshots.map((snapshot) =>
      snapshot === undefined
        ? Promise.resolve()
        : cleanupCandidateSnapshot(snapshot).catch(() => undefined),
    ),
  );
}

function resolvedCandidate(
  snapshot: CandidateSnapshot,
  image: ResolvedCandidate["image"],
): ResolvedCandidate {
  return {
    definition: snapshot.definition,
    definitionPath: snapshot.definitionPath,
    sourcePath: snapshot.sourcePath,
    snapshotPath: snapshot.snapshotPath,
    image,
  };
}

async function evaluate(options: CliOptions): Promise<Result<CompletedEvaluation>> {
  const loadedCases = await loadEvaluationCases(options.cases);
  if (!loadedCases.ok) return loadedCases;
  const requests = createCandidateRequests(loadedCases.value.cases, options.seed);
  if (!requests.ok) return requests;

  let baselineSnapshot: CandidateSnapshot | undefined;
  let candidateSnapshot: CandidateSnapshot | undefined;
  try {
    const loadedBaseline = await loadCandidateSnapshot(options.baseline);
    if (!loadedBaseline.ok) {
      return {
        ok: false,
        error: withContext(loadedBaseline.error, "baseline"),
      };
    }
    baselineSnapshot = loadedBaseline.value;
    const loadedCandidate = await loadCandidateSnapshot(options.candidate);
    if (!loadedCandidate.ok) {
      return {
        ok: false,
        error: withContext(loadedCandidate.error, "candidate"),
      };
    }
    candidateSnapshot = loadedCandidate.value;

    const runsDirectory = resolve(process.cwd(), "runs");
    const artifactRecovery = await recoverArtifactPublishLocks(runsDirectory);
    if (!artifactRecovery.ok) return artifactRecovery;

    const sandbox = new DockerSandbox();
    const available = await sandbox.checkAvailability();
    if (!available.ok) return available;
    const recovered = await sandbox.recoverStaleState();
    if (!recovered.ok) return recovered;
    const baselineImage = await sandbox.resolveImage(
      baselineSnapshot.definition,
    );
    if (!baselineImage.ok) {
      return {
        ok: false,
        error: withContext(baselineImage.error, "baseline"),
      };
    }
    const candidateImage = await sandbox.resolveImage(
      candidateSnapshot.definition,
    );
    if (!candidateImage.ok) {
      return {
        ok: false,
        error: withContext(candidateImage.error, "candidate"),
      };
    }
    const evaluator = await resolveEvaluatorIdentity(PACKAGE_ROOT);
    if (!evaluator.ok) return evaluator;
    const manifest = createRunManifest({
      evaluator: evaluator.value,
      seed: options.seed,
      baseline: {
        definition: baselineSnapshot.definition,
        image: baselineImage.value,
      },
      candidate: {
        definition: candidateSnapshot.definition,
        image: candidateImage.value,
      },
      casesDigest: loadedCases.value.digest,
      inputLimits: V1_INPUT_LIMITS,
      sandbox: V1_SANDBOX_POLICY,
    });
    if (!manifest.ok) return manifest;

    const baselineExecutions = await sandbox.run(
      resolvedCandidate(baselineSnapshot, baselineImage.value),
      requests.value,
      V1_SANDBOX_POLICY,
    );
    baselineSnapshot = undefined;
    if (!baselineExecutions.ok) {
      return {
        ok: false,
        error: withContext(baselineExecutions.error, "baseline"),
      };
    }
    const baselineEvaluation = evaluateExecutions(
      loadedCases.value.cases,
      baselineExecutions.value,
    );
    if (!baselineEvaluation.ok) {
      return {
        ok: false,
        error: withContext(baselineEvaluation.error, "baseline"),
      };
    }

    const candidateExecutions = await sandbox.run(
      resolvedCandidate(candidateSnapshot, candidateImage.value),
      requests.value,
      V1_SANDBOX_POLICY,
    );
    candidateSnapshot = undefined;
    if (!candidateExecutions.ok) {
      return {
        ok: false,
        error: withContext(candidateExecutions.error, "candidate"),
      };
    }
    const candidateEvaluation = evaluateExecutions(
      loadedCases.value.cases,
      candidateExecutions.value,
    );
    if (!candidateEvaluation.ok) {
      return {
        ok: false,
        error: withContext(candidateEvaluation.error, "candidate"),
      };
    }
    const compared = compareEvaluations(
      loadedCases.value.cases,
      baselineEvaluation.value.evaluation,
      candidateEvaluation.value.evaluation,
    );
    if (!compared.ok) return compared;
    const written = await writeArtifactBundle({
      runsDirectory,
      manifest: manifest.value,
      loadedCases: loadedCases.value,
      baselineExecutions: baselineExecutions.value,
      candidateExecutions: candidateExecutions.value,
      baselineEvaluation: baselineEvaluation.value.evaluation,
      candidateEvaluation: candidateEvaluation.value.evaluation,
      comparison: compared.value.comparison,
    });
    if (!written.ok) return written;
    return {
      ok: true,
      value: {
        directory: written.value.directory,
        published: written.value.published,
        passedCaseCount:
          candidateEvaluation.value.evaluation.passedCaseCount,
        caseCount: candidateEvaluation.value.evaluation.caseCount,
        failedCaseIds: candidateEvaluation.value.evaluation.failedCaseIds,
        overallPassed: compared.value.overallPassed,
      },
    };
  } finally {
    await cleanupSnapshots([baselineSnapshot, candidateSnapshot]);
  }
}

function exitCode(error: LabError): number {
  switch (error._tag) {
    case "InvalidInput":
      return 2;
    case "SandboxUnavailable":
      return 3;
    case "ExecutionFailed":
      return 4;
    case "EvaluationFailed":
      return 5;
    case "ArtifactWriteFailed":
      return 6;
  }
}

async function main(args: readonly string[]): Promise<number> {
  const options = parseCliOptions(args);
  if (!options.ok) {
    process.stderr.write(`${options.error.message}\n`);
    return exitCode(options.error);
  }
  const completed = await evaluate(options.value);
  if (!completed.ok) {
    process.stderr.write(`${completed.error.message}\n`);
    return exitCode(completed.error);
  }
  process.stdout.write(`Run directory: ${completed.value.directory}\n`);
  process.stdout.write(
    `Candidate passed ${completed.value.passedCaseCount}/${completed.value.caseCount} cases${
      completed.value.published ? "" : " (existing bundle validated)"
    }.\n`,
  );
  if (completed.value.failedCaseIds.length > 0) {
    process.stdout.write(
      `Failed cases: ${completed.value.failedCaseIds.join(", ")}\n`,
    );
  }
  return completed.value.overallPassed ? 0 : 5;
}

process.exitCode = await main(process.argv.slice(2));
