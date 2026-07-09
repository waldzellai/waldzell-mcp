import { describe, expect, it } from "vitest";

import {
  CandidateDefinitionSchema,
  EvaluationCaseSchema,
  RunManifestSchema,
  RunResultArtifactSchema,
  SandboxPolicySchema,
  TraceRecordSchema,
  V1_INPUT_LIMITS,
  V1_SANDBOX_POLICY,
} from "../../src/contracts.js";
import { LabErrorSchema } from "../../src/errors.js";

const DIGEST_A = `sha256:${"a".repeat(64)}`;
const DIGEST_B = `sha256:${"b".repeat(64)}`;

const candidateDefinition = {
  schemaVersion: 1,
  name: "baseline",
  image: `example/baseline@${DIGEST_A}`,
  platform: "linux/amd64",
  entrypoint: ["node", "candidate.js"],
  protocol: "jsonl-stdio",
  source: {
    relativePath: "candidates/baseline",
    digest: DIGEST_B,
  },
} as const;

const candidateIdentity = {
  definition: candidateDefinition,
  image: {
    reference: candidateDefinition.image,
    imageId: DIGEST_A,
    os: "linux",
    architecture: "amd64",
    platform: candidateDefinition.platform,
  },
} as const;

const evaluationResult = {
  caseCount: 1,
  passedCaseCount: 1,
  failedCaseIds: [],
  logicalResultDigest: DIGEST_A,
} as const;

const comparison = {
  noNewRegressions: true,
  regressions: [],
} as const;

const runManifest = {
  schemaVersion: 1,
  runId: DIGEST_A,
  evaluator: {
    schemaVersion: 1,
    implementationDigest: DIGEST_A,
    dependencyLockDigest: DIGEST_B,
    nodeVersion: "v22.17.0",
  },
  seed: 0,
  baseline: candidateIdentity,
  candidate: candidateIdentity,
  casesDigest: DIGEST_B,
  inputLimits: V1_INPUT_LIMITS,
  sandbox: V1_SANDBOX_POLICY,
} as const;

describe("CandidateDefinitionSchema", () => {
  it("accepts a valid V1 candidate definition", () => {
    expect(CandidateDefinitionSchema.parse(candidateDefinition)).toEqual(
      candidateDefinition,
    );
  });

  it.each([
    ["schema version", { ...candidateDefinition, schemaVersion: 2 }],
    ["mutable image tag", { ...candidateDefinition, image: "example:latest" }],
    ["platform", { ...candidateDefinition, platform: "linux" }],
    ["entrypoint", { ...candidateDefinition, entrypoint: [] }],
    ["protocol", { ...candidateDefinition, protocol: "http" }],
    [
      "source digest",
      {
        ...candidateDefinition,
        source: { ...candidateDefinition.source, digest: "sha256:short" },
      },
    ],
  ])("rejects an invalid %s", (_name, value) => {
    expect(CandidateDefinitionSchema.safeParse(value).success).toBe(false);
  });
});

describe("SandboxPolicySchema", () => {
  it("accepts the exact V1 sandbox policy", () => {
    expect(SandboxPolicySchema.parse(V1_SANDBOX_POLICY)).toEqual(
      V1_SANDBOX_POLICY,
    );
  });

  it.each([
    ["network access", { ...V1_SANDBOX_POLICY, network: "bridge" }],
    ["writable root", { ...V1_SANDBOX_POLICY, readOnlyRoot: false }],
    ["root user", { ...V1_SANDBOX_POLICY, runAsNonRoot: false }],
    ["non-positive timeout", { ...V1_SANDBOX_POLICY, timeoutMillis: 0 }],
  ])("rejects %s", (_name, value) => {
    expect(SandboxPolicySchema.safeParse(value).success).toBe(false);
  });
});

describe("EvaluationCaseSchema", () => {
  it("accepts JSON-shaped and opaque unknown values", () => {
    const record = {
      id: "case-1",
      input: { prompt: "hello" },
      expected: ["hello", 1, true, null],
    };

    expect(EvaluationCaseSchema.parse(record)).toEqual(record);
  });

  it("rejects a case without a stable non-empty ID", () => {
    expect(
      EvaluationCaseSchema.safeParse({ id: "", input: null, expected: null })
        .success,
    ).toBe(false);
  });
});

describe("artifact schemas", () => {
  it("accepts a valid run manifest", () => {
    expect(RunManifestSchema.parse(runManifest)).toEqual(runManifest);
  });

  it("rejects a malformed run manifest digest", () => {
    expect(
      RunManifestSchema.safeParse({ ...runManifest, runId: "sha256:nope" })
        .success,
    ).toBe(false);
  });

  it("accepts a successful trace record", () => {
    const trace = {
      schemaVersion: 1,
      runId: DIGEST_A,
      ordinal: 0,
      caseId: "case-1",
      requestDigest: DIGEST_B,
      exitCode: 0,
      timedOut: false,
      protocolResult: { ok: true, output: { answer: 42 } },
      stderr: "",
      durationMillis: 12,
    } as const;

    expect(TraceRecordSchema.parse(trace)).toEqual(trace);
  });

  it("rejects a trace that records a failed process exit", () => {
    expect(
      TraceRecordSchema.safeParse({
        schemaVersion: 1,
        runId: DIGEST_A,
        ordinal: 0,
        caseId: "case-1",
        requestDigest: DIGEST_B,
        exitCode: 1,
        timedOut: false,
        protocolResult: { ok: false, error: "candidate failed" },
        stderr: "boom",
        durationMillis: 12,
      }).success,
    ).toBe(false);
  });

  it("accepts a valid result artifact", () => {
    const artifact = {
      schemaVersion: 1,
      runId: DIGEST_A,
      baselineEvaluation: evaluationResult,
      candidateEvaluation: evaluationResult,
      comparison,
      overallPassed: true,
    } as const;

    expect(RunResultArtifactSchema.parse(artifact)).toEqual(artifact);
  });

  it("rejects an invalid result artifact", () => {
    expect(
      RunResultArtifactSchema.safeParse({
        schemaVersion: 1,
        runId: DIGEST_A,
        baselineEvaluation: evaluationResult,
        candidateEvaluation: evaluationResult,
        comparison,
        overallPassed: "yes",
      }).success,
    ).toBe(false);
  });
});

describe("LabErrorSchema", () => {
  it("accepts a declared error and rejects an unknown tag", () => {
    expect(
      LabErrorSchema.parse({ _tag: "InvalidInput", message: "invalid" }),
    ).toEqual({ _tag: "InvalidInput", message: "invalid" });
    expect(
      LabErrorSchema.safeParse({ _tag: "Unknown", message: "invalid" })
        .success,
    ).toBe(false);
  });
});
