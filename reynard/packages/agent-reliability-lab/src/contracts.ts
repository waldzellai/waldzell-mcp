import { z } from "zod";

import type { Result } from "./errors.js";

export type { LabError, Result } from "./errors.js";

export interface CandidateDefinition {
  readonly schemaVersion: 1;
  readonly name: string;
  readonly image: `${string}@sha256:${string}`;
  readonly platform: `${string}/${string}`;
  readonly entrypoint: readonly string[];
  readonly protocol: "jsonl-stdio";
  readonly source: {
    readonly relativePath: string;
    readonly digest: `sha256:${string}`;
  };
}

export interface ResolvedImage {
  readonly reference: CandidateDefinition["image"];
  readonly imageId: `sha256:${string}`;
  readonly os: string;
  readonly architecture: string;
  readonly variant?: string;
  readonly platform: CandidateDefinition["platform"];
}

export interface ResolvedCandidate {
  readonly definition: CandidateDefinition;
  readonly definitionPath: string;
  readonly sourcePath: string;
  readonly snapshotPath: string;
  readonly image: ResolvedImage;
}

export interface CandidateIdentity {
  readonly definition: CandidateDefinition;
  readonly image: ResolvedImage;
}

export interface SandboxPolicy {
  readonly schemaVersion: 1;
  readonly network: "none";
  readonly readOnlyRoot: true;
  readonly runAsNonRoot: true;
  readonly uid: number;
  readonly gid: number;
  readonly cpuCores: number;
  readonly memoryMiB: number;
  readonly pidsLimit: number;
  readonly timeoutMillis: number;
  readonly stdoutBytesLimit: number;
  readonly stderrBytesLimit: number;
  readonly tmpfsMiB: number;
}

export interface InputLimits {
  readonly schemaVersion: 1;
  readonly candidateDefinitionBytes: number;
  readonly sourceFileCount: number;
  readonly sourceFileBytes: number;
  readonly sourceTotalBytes: number;
  readonly caseFileBytes: number;
  readonly caseCount: number;
  readonly caseBytes: number;
}

export const V1_SANDBOX_POLICY = {
  schemaVersion: 1,
  network: "none",
  readOnlyRoot: true,
  runAsNonRoot: true,
  uid: 65_532,
  gid: 65_532,
  cpuCores: 1,
  memoryMiB: 256,
  pidsLimit: 64,
  timeoutMillis: 5_000,
  stdoutBytesLimit: 65_536,
  stderrBytesLimit: 65_536,
  tmpfsMiB: 16,
} as const satisfies SandboxPolicy;

export const V1_INPUT_LIMITS = {
  schemaVersion: 1,
  candidateDefinitionBytes: 16_384,
  sourceFileCount: 64,
  sourceFileBytes: 262_144,
  sourceTotalBytes: 1_048_576,
  caseFileBytes: 1_048_576,
  caseCount: 1_000,
  caseBytes: 65_536,
} as const satisfies InputLimits;

export interface EvaluationCase {
  readonly id: string;
  readonly input: unknown;
  readonly expected: unknown;
}

export interface CandidateRequest {
  readonly schemaVersion: 1;
  readonly caseId: string;
  readonly seed: number;
  readonly input: unknown;
}

export interface ExecutionResult {
  readonly caseId: string;
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly durationMillis: number;
}

export interface EvaluationResult {
  readonly caseCount: number;
  readonly passedCaseCount: number;
  readonly failedCaseIds: readonly string[];
  readonly logicalResultDigest: `sha256:${string}`;
}

export interface EvaluatorIdentity {
  readonly schemaVersion: 1;
  readonly implementationDigest: `sha256:${string}`;
  readonly dependencyLockDigest: `sha256:${string}`;
  readonly nodeVersion: string;
}

export interface RunManifestInput {
  readonly evaluator: EvaluatorIdentity;
  readonly seed: number;
  readonly baseline: CandidateIdentity;
  readonly candidate: CandidateIdentity;
  readonly casesDigest: `sha256:${string}`;
  readonly inputLimits: InputLimits;
  readonly sandbox: SandboxPolicy;
}

export interface RunManifest extends RunManifestInput {
  readonly schemaVersion: 1;
  readonly runId: `sha256:${string}`;
}

export interface DockerRunInput {
  readonly candidate: ResolvedCandidate;
  readonly request: CandidateRequest;
  readonly policy: SandboxPolicy;
}

export interface ArtifactWriteInput {
  readonly runsDirectory: string;
  readonly manifest: RunManifest;
  readonly cases: readonly EvaluationCase[];
  readonly baselineExecutions: readonly ExecutionResult[];
  readonly candidateExecutions: readonly ExecutionResult[];
  readonly baselineEvaluation: EvaluationResult;
  readonly candidateEvaluation: EvaluationResult;
  readonly comparison: ComparisonResult;
}

export interface ComparisonResult {
  readonly noNewRegressions: boolean;
  readonly regressions: readonly {
    readonly caseId: string;
    readonly reason: string;
  }[];
}

export interface TraceRecord {
  readonly schemaVersion: 1;
  readonly runId: RunManifest["runId"];
  readonly ordinal: number;
  readonly caseId: string;
  readonly requestDigest: `sha256:${string}`;
  readonly exitCode: 0;
  readonly timedOut: false;
  readonly protocolResult:
    | { readonly ok: true; readonly output: unknown }
    | { readonly ok: false; readonly error: string };
  readonly stderr: string;
  readonly durationMillis: number;
}

export interface RunResultArtifact {
  readonly schemaVersion: 1;
  readonly runId: RunManifest["runId"];
  readonly baselineEvaluation: EvaluationResult;
  readonly candidateEvaluation: EvaluationResult;
  readonly comparison: ComparisonResult;
  readonly overallPassed: boolean;
}

export interface CandidateRunner {
  run(
    candidate: ResolvedCandidate,
    requests: readonly CandidateRequest[],
    policy: SandboxPolicy,
  ): Promise<Result<readonly ExecutionResult[]>>;
}

const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;
const IMAGE_REFERENCE_PATTERN = /^\S+@sha256:[0-9a-f]{64}$/;
const PLATFORM_PATTERN = /^[^/\s]+\/[^/\s]+$/;

export const Sha256DigestSchema = z.custom<`sha256:${string}`>(
  (value) => typeof value === "string" && SHA256_PATTERN.test(value),
  "Expected a lowercase SHA-256 digest",
);

export const ImageReferenceSchema = z.custom<
  CandidateDefinition["image"]
>(
  (value) => typeof value === "string" && IMAGE_REFERENCE_PATTERN.test(value),
  "Expected an immutable image reference",
);

export const PlatformSchema = z.custom<CandidateDefinition["platform"]>(
  (value) => typeof value === "string" && PLATFORM_PATTERN.test(value),
  "Expected an OS/architecture platform",
);

const nonEmptyStringSchema = z.string().min(1);
const nonNegativeIntegerSchema = z.number().int().nonnegative();
const positiveIntegerSchema = z.number().int().positive();
const safeIntegerSchema = z
  .number()
  .int()
  .min(Number.MIN_SAFE_INTEGER)
  .max(Number.MAX_SAFE_INTEGER);

export const CandidateDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: nonEmptyStringSchema,
    image: ImageReferenceSchema,
    platform: PlatformSchema,
    entrypoint: z.array(nonEmptyStringSchema).min(1),
    protocol: z.literal("jsonl-stdio"),
    source: z
      .object({
        relativePath: nonEmptyStringSchema,
        digest: Sha256DigestSchema,
      })
      .strict(),
  })
  .strict();

export const ResolvedImageSchema = z
  .object({
    reference: ImageReferenceSchema,
    imageId: Sha256DigestSchema,
    os: nonEmptyStringSchema,
    architecture: nonEmptyStringSchema,
    variant: nonEmptyStringSchema.optional(),
    platform: PlatformSchema,
  })
  .strict();

export const ResolvedCandidateSchema = z
  .object({
    definition: CandidateDefinitionSchema,
    definitionPath: nonEmptyStringSchema,
    sourcePath: nonEmptyStringSchema,
    snapshotPath: nonEmptyStringSchema,
    image: ResolvedImageSchema,
  })
  .strict();

export const CandidateIdentitySchema = z
  .object({
    definition: CandidateDefinitionSchema,
    image: ResolvedImageSchema,
  })
  .strict();

export const SandboxPolicySchema = z
  .object({
    schemaVersion: z.literal(1),
    network: z.literal("none"),
    readOnlyRoot: z.literal(true),
    runAsNonRoot: z.literal(true),
    uid: nonNegativeIntegerSchema,
    gid: nonNegativeIntegerSchema,
    cpuCores: z.number().positive(),
    memoryMiB: positiveIntegerSchema,
    pidsLimit: positiveIntegerSchema,
    timeoutMillis: positiveIntegerSchema,
    stdoutBytesLimit: positiveIntegerSchema,
    stderrBytesLimit: positiveIntegerSchema,
    tmpfsMiB: positiveIntegerSchema,
  })
  .strict();

export const InputLimitsSchema = z
  .object({
    schemaVersion: z.literal(1),
    candidateDefinitionBytes: positiveIntegerSchema,
    sourceFileCount: positiveIntegerSchema,
    sourceFileBytes: positiveIntegerSchema,
    sourceTotalBytes: positiveIntegerSchema,
    caseFileBytes: positiveIntegerSchema,
    caseCount: positiveIntegerSchema,
    caseBytes: positiveIntegerSchema,
  })
  .strict();

export const EvaluationCaseSchema = z
  .object({
    id: nonEmptyStringSchema,
    input: z.unknown(),
    expected: z.unknown(),
  })
  .strict()
  .superRefine((value, context) => {
    for (const key of ["input", "expected"] as const) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required`,
          path: [key],
        });
      }
    }
  });

export const CandidateRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    caseId: nonEmptyStringSchema,
    seed: safeIntegerSchema,
    input: z.unknown(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!Object.prototype.hasOwnProperty.call(value, "input")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "input is required",
        path: ["input"],
      });
    }
  });

export const ExecutionResultSchema = z
  .object({
    caseId: nonEmptyStringSchema,
    exitCode: z.number().int(),
    stdout: z.string(),
    stderr: z.string(),
    timedOut: z.boolean(),
    durationMillis: nonNegativeIntegerSchema,
  })
  .strict();

export const EvaluationResultSchema = z
  .object({
    caseCount: nonNegativeIntegerSchema,
    passedCaseCount: nonNegativeIntegerSchema,
    failedCaseIds: z.array(nonEmptyStringSchema),
    logicalResultDigest: Sha256DigestSchema,
  })
  .strict()
  .refine((value) => value.passedCaseCount <= value.caseCount, {
    message: "passedCaseCount cannot exceed caseCount",
    path: ["passedCaseCount"],
  });

export const EvaluatorIdentitySchema = z
  .object({
    schemaVersion: z.literal(1),
    implementationDigest: Sha256DigestSchema,
    dependencyLockDigest: Sha256DigestSchema,
    nodeVersion: nonEmptyStringSchema,
  })
  .strict();

export const RunManifestInputSchema = z.object({
  evaluator: EvaluatorIdentitySchema,
  seed: safeIntegerSchema,
  baseline: CandidateIdentitySchema,
  candidate: CandidateIdentitySchema,
  casesDigest: Sha256DigestSchema,
  inputLimits: InputLimitsSchema,
  sandbox: SandboxPolicySchema,
});

export const RunManifestSchema = RunManifestInputSchema.extend({
  schemaVersion: z.literal(1),
  runId: Sha256DigestSchema,
}).strict();

export const DockerRunInputSchema = z
  .object({
    candidate: ResolvedCandidateSchema,
    request: CandidateRequestSchema,
    policy: SandboxPolicySchema,
  })
  .strict();

export const ComparisonResultSchema = z
  .object({
    noNewRegressions: z.boolean(),
    regressions: z.array(
      z
        .object({
          caseId: nonEmptyStringSchema,
          reason: nonEmptyStringSchema,
        })
        .strict(),
    ),
  })
  .strict();

const successfulProtocolResultSchema = z
  .object({
    ok: z.literal(true),
    output: z.unknown(),
  })
  .strict()
  .superRefine((value, context) => {
    if (!Object.prototype.hasOwnProperty.call(value, "output")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "output is required",
        path: ["output"],
      });
    }
  });

export const TraceRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    runId: Sha256DigestSchema,
    ordinal: nonNegativeIntegerSchema,
    caseId: nonEmptyStringSchema,
    requestDigest: Sha256DigestSchema,
    exitCode: z.literal(0),
    timedOut: z.literal(false),
    protocolResult: z.union([
      successfulProtocolResultSchema,
      z
        .object({
          ok: z.literal(false),
          error: nonEmptyStringSchema,
        })
        .strict(),
    ]),
    stderr: z.string(),
    durationMillis: nonNegativeIntegerSchema,
  })
  .strict();

export const RunResultArtifactSchema = z
  .object({
    schemaVersion: z.literal(1),
    runId: Sha256DigestSchema,
    baselineEvaluation: EvaluationResultSchema,
    candidateEvaluation: EvaluationResultSchema,
    comparison: ComparisonResultSchema,
    overallPassed: z.boolean(),
  })
  .strict();

export const ArtifactWriteInputSchema = z
  .object({
    runsDirectory: nonEmptyStringSchema,
    manifest: RunManifestSchema,
    cases: z.array(EvaluationCaseSchema),
    baselineExecutions: z.array(ExecutionResultSchema),
    candidateExecutions: z.array(ExecutionResultSchema),
    baselineEvaluation: EvaluationResultSchema,
    candidateEvaluation: EvaluationResultSchema,
    comparison: ComparisonResultSchema,
  })
  .strict();
