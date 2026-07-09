import { canonicalJson, sha256 } from "./canonical-json.js";
import {
  EvaluationCaseSchema,
  ExecutionResultSchema,
  type EvaluationCase,
  type EvaluationResult,
  type ExecutionResult,
  type TraceRecord,
} from "./contracts.js";
import type { Result } from "./errors.js";

export interface ProtocolCaseResult {
  readonly caseId: string;
  readonly protocolResult: TraceRecord["protocolResult"];
}

export interface EvaluatedCase extends ProtocolCaseResult {
  readonly passed: boolean;
}

export interface EvaluatedExecutions {
  readonly caseResults: readonly EvaluatedCase[];
  readonly evaluation: EvaluationResult;
}

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function evaluationFailed<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "EvaluationFailed", message } };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateCases(
  cases: readonly EvaluationCase[],
): Result<readonly EvaluationCase[]> {
  if (cases.length === 0) {
    return invalidInput("Evaluation case set cannot be empty");
  }

  const validated: EvaluationCase[] = [];
  const caseIds = new Set<string>();
  for (const [index, value] of cases.entries()) {
    const parsed = EvaluationCaseSchema.safeParse(value);
    if (!parsed.success) {
      return invalidInput(
        `Invalid evaluation case at index ${index}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    if (caseIds.has(parsed.data.id)) {
      return invalidInput(`Duplicate evaluation case ID: ${parsed.data.id}`);
    }

    try {
      canonicalJson(parsed.data.input);
      canonicalJson(parsed.data.expected);
    } catch (error) {
      return invalidInput(
        `Evaluation case ${parsed.data.id} is not JSON-shaped: ${errorMessage(error)}`,
      );
    }

    caseIds.add(parsed.data.id);
    validated.push({
      id: parsed.data.id,
      input: parsed.data.input,
      expected: parsed.data.expected,
    });
  }
  return { ok: true, value: validated };
}

function alignProtocolResults(
  cases: readonly EvaluationCase[],
  results: readonly ProtocolCaseResult[],
): Result<readonly ProtocolCaseResult[]> {
  const byCaseId = new Map<string, ProtocolCaseResult>();
  for (const [index, result] of results.entries()) {
    if (
      typeof result !== "object" ||
      result === null ||
      typeof result.caseId !== "string" ||
      result.caseId.length === 0
    ) {
      return evaluationFailed(`Invalid protocol result at index ${index}`);
    }
    if (byCaseId.has(result.caseId)) {
      return evaluationFailed(`Duplicate execution result for ${result.caseId}`);
    }
    byCaseId.set(result.caseId, result);
  }

  const expectedCaseIds = new Set(cases.map(({ id }) => id));
  const extraCaseIds = [...byCaseId.keys()].filter(
    (caseId) => !expectedCaseIds.has(caseId),
  );
  if (extraCaseIds.length > 0) {
    return evaluationFailed(
      `Unexpected execution result for ${extraCaseIds.join(", ")}`,
    );
  }

  const aligned: ProtocolCaseResult[] = [];
  for (const evaluationCase of cases) {
    const result = byCaseId.get(evaluationCase.id);
    if (result === undefined) {
      return evaluationFailed(
        `Missing execution result for ${evaluationCase.id}`,
      );
    }
    aligned.push(result);
  }
  return { ok: true, value: aligned };
}

function validateProtocolResult(
  value: ProtocolCaseResult["protocolResult"],
  caseId: string,
): Result<ProtocolCaseResult["protocolResult"]> {
  if (typeof value !== "object" || value === null || !("ok" in value)) {
    return evaluationFailed(`Invalid protocol result for ${caseId}`);
  }
  if (value.ok === true) {
    if (!Object.prototype.hasOwnProperty.call(value, "output")) {
      return evaluationFailed(`Protocol result lacks output for ${caseId}`);
    }
    try {
      canonicalJson(value.output);
    } catch (error) {
      return evaluationFailed(
        `Protocol output for ${caseId} is not JSON-shaped: ${errorMessage(error)}`,
      );
    }
    return { ok: true, value: { ok: true, output: value.output } };
  }
  if (
    value.ok === false &&
    (value.error === "malformed JSONL output" ||
      value.error === "invalid JSON output")
  ) {
    return { ok: true, value: { ok: false, error: value.error } };
  }
  return evaluationFailed(`Invalid protocol result for ${caseId}`);
}

export function evaluateProtocolResults(
  cases: readonly EvaluationCase[],
  protocolResults: readonly ProtocolCaseResult[],
): Result<EvaluatedExecutions> {
  const validatedCases = validateCases(cases);
  if (!validatedCases.ok) return validatedCases;
  const aligned = alignProtocolResults(validatedCases.value, protocolResults);
  if (!aligned.ok) return aligned;

  const caseResults: EvaluatedCase[] = [];
  for (const [index, evaluationCase] of validatedCases.value.entries()) {
    const result = aligned.value[index];
    if (result === undefined) {
      return evaluationFailed(
        `Missing execution result for ${evaluationCase.id}`,
      );
    }
    const protocolResult = validateProtocolResult(
      result.protocolResult,
      evaluationCase.id,
    );
    if (!protocolResult.ok) return protocolResult;
    const passed =
      protocolResult.value.ok &&
      canonicalJson(protocolResult.value.output) ===
        canonicalJson(evaluationCase.expected);
    caseResults.push({
      caseId: evaluationCase.id,
      protocolResult: protocolResult.value,
      passed,
    });
  }

  const failedCaseIds = caseResults
    .filter(({ passed }) => !passed)
    .map(({ caseId }) => caseId);
  const logicalResultDigest = sha256(canonicalJson(caseResults));
  return {
    ok: true,
    value: {
      caseResults,
      evaluation: {
        caseCount: caseResults.length,
        passedCaseCount: caseResults.length - failedCaseIds.length,
        failedCaseIds,
        logicalResultDigest,
      },
    },
  };
}

function parseJsonLine(
  execution: ExecutionResult,
): TraceRecord["protocolResult"] {
  if (!execution.stdout.endsWith("\n")) {
    return { ok: false, error: "malformed JSONL output" };
  }
  const line = execution.stdout.slice(0, -1);
  if (line.length === 0 || line.includes("\n")) {
    return { ok: false, error: "malformed JSONL output" };
  }
  try {
    const output: unknown = JSON.parse(line);
    canonicalJson(output);
    return { ok: true, output };
  } catch {
    return { ok: false, error: "invalid JSON output" };
  }
}

export function evaluateExecutions(
  cases: readonly EvaluationCase[],
  executions: readonly ExecutionResult[],
): Result<EvaluatedExecutions> {
  const validatedCases = validateCases(cases);
  if (!validatedCases.ok) return validatedCases;
  const protocolResults: ProtocolCaseResult[] = [];
  for (const [index, value] of executions.entries()) {
    const parsed = ExecutionResultSchema.safeParse(value);
    if (!parsed.success) {
      return evaluationFailed(
        `Invalid execution result at index ${index}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
      );
    }
    if (parsed.data.exitCode !== 0 || parsed.data.timedOut) {
      return evaluationFailed(
        `Execution failure reached evaluator for ${parsed.data.caseId}`,
      );
    }
    protocolResults.push({
      caseId: parsed.data.caseId,
      protocolResult: parseJsonLine(parsed.data),
    });
  }
  return evaluateProtocolResults(validatedCases.value, protocolResults);
}
