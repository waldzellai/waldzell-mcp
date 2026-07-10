import { canonicalJson } from "../../src/canonical-json.js";
import { compareEvaluations } from "../../src/compare.js";
import {
  V1_INPUT_LIMITS,
  V1_SANDBOX_POLICY,
  type ArtifactWriteInput,
  type CandidateIdentity,
  type EvaluationCase,
  type ExecutionResult,
} from "../../src/contracts.js";
import { evaluateExecutions } from "../../src/evaluator.js";
import { createRunManifest } from "../../src/manifest.js";
import { parseEvaluationCasesText } from "../../src/runner.js";

function digest(character: string): `sha256:${string}` {
  return `sha256:${character.repeat(64)}`;
}

function candidateIdentity(
  name: string,
  character: string,
): CandidateIdentity {
  const imageDigest = digest(character);
  const definition = {
    schemaVersion: 1 as const,
    name,
    image: `example/${name}@${imageDigest}` as const,
    platform: "linux/amd64" as const,
    entrypoint: ["node", "candidate.js"],
    protocol: "jsonl-stdio" as const,
    source: { relativePath: "src", digest: imageDigest },
  };
  return {
    definition,
    image: {
      reference: definition.image,
      imageId: imageDigest,
      os: "linux",
      architecture: "amd64",
      platform: definition.platform,
    },
  };
}

export function publicArtifactInput(runsDirectory: string): ArtifactWriteInput {
  const cases = [
    { id: "case-1", input: { value: 1 }, expected: { answer: 1 } },
  ] as const satisfies readonly EvaluationCase[];
  const loadedCases = parseEvaluationCasesText(
    `${cases.map((value) => canonicalJson(value)).join("\n")}\n`,
  );
  if (!loadedCases.ok) throw new Error(loadedCases.error.message);
  const executions = [
    {
      caseId: "case-1",
      exitCode: 0,
      stdout: '{"answer":1}\n',
      stderr: "",
      timedOut: false,
      durationMillis: 1,
    },
  ] as const satisfies readonly ExecutionResult[];
  const baseline = evaluateExecutions(loadedCases.value.cases, executions);
  const candidate = evaluateExecutions(loadedCases.value.cases, executions);
  if (!baseline.ok) throw new Error(baseline.error.message);
  if (!candidate.ok) throw new Error(candidate.error.message);
  const compared = compareEvaluations(
    loadedCases.value.cases,
    baseline.value.evaluation,
    candidate.value.evaluation,
  );
  if (!compared.ok) throw new Error(compared.error.message);
  const manifest = createRunManifest({
    evaluator: {
      schemaVersion: 1,
      implementationDigest: digest("a"),
      dependencyLockDigest: digest("b"),
      nodeVersion: process.version,
    },
    seed: 19,
    baseline: candidateIdentity("baseline", "c"),
    candidate: candidateIdentity("candidate", "d"),
    casesDigest: loadedCases.value.digest,
    inputLimits: V1_INPUT_LIMITS,
    sandbox: V1_SANDBOX_POLICY,
  });
  if (!manifest.ok) throw new Error(manifest.error.message);
  return {
    runsDirectory,
    manifest: manifest.value,
    loadedCases: loadedCases.value,
    baselineExecutions: executions,
    candidateExecutions: executions,
    baselineEvaluation: baseline.value.evaluation,
    candidateEvaluation: candidate.value.evaluation,
    comparison: compared.value.comparison,
  };
}
