import {
  EvaluationCaseSchema,
  EvaluationResultSchema,
  type ComparisonResult,
  type EvaluationCase,
  type EvaluationResult,
} from "./contracts.js";
import type { Result } from "./errors.js";

export interface EvaluationsComparison {
  readonly comparison: ComparisonResult;
  readonly overallPassed: boolean;
}

const REGRESSION_REASON =
  "candidate failed a required case that passed in baseline";

function evaluationFailed<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "EvaluationFailed", message } };
}

function validateCaseOrder(
  cases: readonly EvaluationCase[],
): Result<readonly string[]> {
  if (cases.length === 0) {
    return evaluationFailed("Cannot compare an empty evaluation case set");
  }
  const caseIds: string[] = [];
  const seen = new Set<string>();
  for (const [index, value] of cases.entries()) {
    const parsed = EvaluationCaseSchema.safeParse(value);
    if (!parsed.success) {
      return evaluationFailed(`Invalid evaluation case at index ${index}`);
    }
    if (seen.has(parsed.data.id)) {
      return evaluationFailed(`Duplicate evaluation case ID: ${parsed.data.id}`);
    }
    seen.add(parsed.data.id);
    caseIds.push(parsed.data.id);
  }
  return { ok: true, value: caseIds };
}

function validateEvaluation(
  label: string,
  caseIds: readonly string[],
  value: EvaluationResult,
): Result<EvaluationResult> {
  const parsed = EvaluationResultSchema.safeParse(value);
  if (!parsed.success) {
    return evaluationFailed(`Invalid ${label} evaluation`);
  }
  if (parsed.data.caseCount !== caseIds.length) {
    return evaluationFailed(
      `${label} evaluation case count does not match the required cases`,
    );
  }
  const failed = new Set(parsed.data.failedCaseIds);
  if (failed.size !== parsed.data.failedCaseIds.length) {
    return evaluationFailed(`${label} evaluation has duplicate failed case IDs`);
  }
  const orderedFailedCaseIds = caseIds.filter((caseId) => failed.has(caseId));
  if (
    orderedFailedCaseIds.length !== failed.size ||
    orderedFailedCaseIds.some(
      (caseId, index) => caseId !== parsed.data.failedCaseIds[index],
    )
  ) {
    return evaluationFailed(
      `${label} evaluation failed case IDs do not match required case order`,
    );
  }
  if (
    parsed.data.passedCaseCount !==
    parsed.data.caseCount - parsed.data.failedCaseIds.length
  ) {
    return evaluationFailed(`${label} evaluation counts are inconsistent`);
  }
  return { ok: true, value: parsed.data };
}

export function compareEvaluations(
  cases: readonly EvaluationCase[],
  baseline: EvaluationResult,
  candidate: EvaluationResult,
): Result<EvaluationsComparison> {
  const caseOrder = validateCaseOrder(cases);
  if (!caseOrder.ok) return caseOrder;
  const validatedBaseline = validateEvaluation(
    "baseline",
    caseOrder.value,
    baseline,
  );
  if (!validatedBaseline.ok) return validatedBaseline;
  const validatedCandidate = validateEvaluation(
    "candidate",
    caseOrder.value,
    candidate,
  );
  if (!validatedCandidate.ok) return validatedCandidate;

  const baselineFailures = new Set(validatedBaseline.value.failedCaseIds);
  const candidateFailures = new Set(validatedCandidate.value.failedCaseIds);
  const regressions = caseOrder.value
    .filter(
      (caseId) =>
        candidateFailures.has(caseId) && !baselineFailures.has(caseId),
    )
    .map((caseId) => ({ caseId, reason: REGRESSION_REASON }));
  const comparison: ComparisonResult = {
    noNewRegressions: regressions.length === 0,
    regressions,
  };
  return {
    ok: true,
    value: {
      comparison,
      overallPassed:
        comparison.noNewRegressions && candidateFailures.size === 0,
    },
  };
}
