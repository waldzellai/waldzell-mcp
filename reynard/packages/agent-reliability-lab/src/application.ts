import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  recoverArtifactPublishLocks,
  writeArtifactBundle,
} from "./artifacts.js";
import {
  cleanupCandidateSnapshot,
  loadCandidateSnapshot,
  resolveCandidateSnapshot,
  type CandidateSnapshot,
} from "./candidate.js";
import { compareEvaluations } from "./compare.js";
import { V1_INPUT_LIMITS, V1_SANDBOX_POLICY } from "./contracts.js";
import type { LabError, Result } from "./errors.js";
import { evaluateExecutions } from "./evaluator.js";
import {
  finalizeEvaluation,
  type CandidateSnapshotCleanup,
} from "./evaluation-lifecycle.js";
import { createRunManifest, resolveEvaluatorIdentity } from "./manifest.js";
import { createCandidateRequests, loadEvaluationCases } from "./runner.js";
import { createDockerSandbox } from "./sandbox/docker.js";

export interface EvaluationOptions {
  readonly baseline: string;
  readonly candidate: string;
  readonly cases: string;
  readonly seed: number;
}

export interface CompletedEvaluation {
  readonly directory: string;
  readonly published: boolean;
  readonly passedCaseCount: number;
  readonly caseCount: number;
  readonly failedCaseIds: readonly string[];
  readonly overallPassed: boolean;
}

export interface EvaluationApplicationDependencies {
  readonly loadCandidateSnapshot: typeof loadCandidateSnapshot;
  readonly recoverArtifactPublishLocks: typeof recoverArtifactPublishLocks;
  readonly createDockerSandbox: typeof createDockerSandbox;
  readonly snapshotCleanup: CandidateSnapshotCleanup;
}

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DEPENDENCIES: EvaluationApplicationDependencies = {
  loadCandidateSnapshot,
  recoverArtifactPublishLocks,
  createDockerSandbox,
  snapshotCleanup: cleanupCandidateSnapshot,
};

interface EvaluationSnapshots {
  baseline?: CandidateSnapshot;
  candidate?: CandidateSnapshot;
}

function withContext(error: LabError, context: string): LabError {
  return { ...error, message: `${context}: ${error.message}` };
}

async function evaluatePrimary(
  options: EvaluationOptions,
  snapshots: EvaluationSnapshots,
  dependencies: EvaluationApplicationDependencies,
): Promise<Result<CompletedEvaluation>> {
  const loadedCases = await loadEvaluationCases(options.cases);
  if (!loadedCases.ok) return loadedCases;
  const requests = createCandidateRequests(loadedCases.value.cases, options.seed);
  if (!requests.ok) return requests;

  const loadedBaseline = await dependencies.loadCandidateSnapshot(options.baseline);
  if (!loadedBaseline.ok) {
    return { ok: false, error: withContext(loadedBaseline.error, "baseline") };
  }
  snapshots.baseline = loadedBaseline.value;
  const loadedCandidate = await dependencies.loadCandidateSnapshot(
    options.candidate,
  );
  if (!loadedCandidate.ok) {
    return { ok: false, error: withContext(loadedCandidate.error, "candidate") };
  }
  snapshots.candidate = loadedCandidate.value;

  const runsDirectory = resolve(process.cwd(), "runs");
  const artifactRecovery = await dependencies.recoverArtifactPublishLocks(
    runsDirectory,
  );
  if (!artifactRecovery.ok) return artifactRecovery;

  const createdSandbox = dependencies.createDockerSandbox();
  if (!createdSandbox.ok) return createdSandbox;
  const sandbox = createdSandbox.value;
  const available = await sandbox.checkAvailability();
  if (!available.ok) return available;
  const recovered = await sandbox.recoverStaleState();
  if (!recovered.ok) return recovered;
  const baselineImage = await sandbox.resolveImage(snapshots.baseline.definition);
  if (!baselineImage.ok) {
    return { ok: false, error: withContext(baselineImage.error, "baseline") };
  }
  const candidateImage = await sandbox.resolveImage(
    snapshots.candidate.definition,
  );
  if (!candidateImage.ok) {
    return { ok: false, error: withContext(candidateImage.error, "candidate") };
  }
  const baselineCandidate = await resolveCandidateSnapshot(
    snapshots.baseline,
    baselineImage.value,
  );
  if (!baselineCandidate.ok) return baselineCandidate;
  const candidate = await resolveCandidateSnapshot(
    snapshots.candidate,
    candidateImage.value,
  );
  if (!candidate.ok) return candidate;
  const evaluator = await resolveEvaluatorIdentity(PACKAGE_ROOT);
  if (!evaluator.ok) return evaluator;
  const manifest = createRunManifest({
    evaluator: evaluator.value,
    seed: options.seed,
    baseline: {
      definition: snapshots.baseline.definition,
      image: baselineImage.value,
    },
    candidate: {
      definition: snapshots.candidate.definition,
      image: candidateImage.value,
    },
    casesDigest: loadedCases.value.digest,
    inputLimits: V1_INPUT_LIMITS,
    sandbox: V1_SANDBOX_POLICY,
  });
  if (!manifest.ok) return manifest;

  const baselineExecutions = await sandbox.run(
    baselineCandidate.value,
    requests.value,
    V1_SANDBOX_POLICY,
  );
  if (!baselineExecutions.ok) {
    return { ok: false, error: withContext(baselineExecutions.error, "baseline") };
  }
  const baselineEvaluation = evaluateExecutions(
    loadedCases.value.cases,
    baselineExecutions.value,
  );
  if (!baselineEvaluation.ok) {
    return { ok: false, error: withContext(baselineEvaluation.error, "baseline") };
  }

  const candidateExecutions = await sandbox.run(
    candidate.value,
    requests.value,
    V1_SANDBOX_POLICY,
  );
  if (!candidateExecutions.ok) {
    return { ok: false, error: withContext(candidateExecutions.error, "candidate") };
  }
  const candidateEvaluation = evaluateExecutions(
    loadedCases.value.cases,
    candidateExecutions.value,
  );
  if (!candidateEvaluation.ok) {
    return { ok: false, error: withContext(candidateEvaluation.error, "candidate") };
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
      passedCaseCount: candidateEvaluation.value.evaluation.passedCaseCount,
      caseCount: candidateEvaluation.value.evaluation.caseCount,
      failedCaseIds: candidateEvaluation.value.evaluation.failedCaseIds,
      overallPassed: compared.value.overallPassed,
    },
  };
}

export async function evaluateApplication(
  options: EvaluationOptions,
  overrides: Partial<EvaluationApplicationDependencies> = {},
): Promise<Result<CompletedEvaluation>> {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  const snapshots: EvaluationSnapshots = {};
  let primary: Result<CompletedEvaluation>;
  try {
    primary = await evaluatePrimary(options, snapshots, dependencies);
  } catch (error) {
    primary = {
      ok: false,
      error: {
        _tag: "SandboxUnavailable",
        message: `Evaluation orchestration failed: ${error instanceof Error ? error.message : String(error)}`,
      },
    };
  }
  return finalizeEvaluation(
    primary,
    [
      ...(snapshots.baseline === undefined
        ? []
        : [{ phase: "baseline", snapshot: snapshots.baseline }]),
      ...(snapshots.candidate === undefined
        ? []
        : [{ phase: "candidate", snapshot: snapshots.candidate }]),
    ],
    dependencies.snapshotCleanup,
  );
}
