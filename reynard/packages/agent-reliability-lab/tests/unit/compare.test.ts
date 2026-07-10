import { describe, expect, test } from "vitest";

import type {
  EvaluationCase,
  EvaluationResult,
} from "../../src/contracts.js";
import { compareEvaluations } from "../../src/compare.js";

const DIGEST = `sha256:${"a".repeat(64)}` as const;
const cases = [
  { id: "case-2", input: 2, expected: 2 },
  { id: "case-1", input: 1, expected: 1 },
] as const satisfies readonly EvaluationCase[];

function evaluation(failedCaseIds: readonly string[]): EvaluationResult {
  return {
    caseCount: cases.length,
    passedCaseCount: cases.length - failedCaseIds.length,
    failedCaseIds,
    logicalResultDigest: DIGEST,
  };
}

describe("compareEvaluations", () => {
  test("reports newly failing required cases in original case order", () => {
    const result = compareEvaluations(
      cases,
      evaluation(["case-1"]),
      evaluation(["case-2", "case-1"]),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        comparison: {
          noNewRegressions: false,
          regressions: [
            {
              caseId: "case-2",
              reason: "candidate failed a required case that passed in baseline",
            },
          ],
        },
        overallPassed: false,
      },
    });
  });

  test("does not permit a candidate failure merely because baseline shares it", () => {
    const result = compareEvaluations(
      cases,
      evaluation(["case-1"]),
      evaluation(["case-1"]),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        comparison: { noNewRegressions: true, regressions: [] },
        overallPassed: false,
      },
    });
  });

  test("passes overall only when the candidate has zero failed cases", () => {
    const result = compareEvaluations(
      cases,
      evaluation(["case-2", "case-1"]),
      evaluation([]),
    );

    expect(result).toEqual({
      ok: true,
      value: {
        comparison: { noNewRegressions: true, regressions: [] },
        overallPassed: true,
      },
    });
  });

  test.each([
    [
      "wrong case count",
      { ...evaluation([]), caseCount: 1, passedCaseCount: 1 },
    ],
    [
      "unknown failed case",
      { ...evaluation(["case-1"]), failedCaseIds: ["case-unknown"] },
    ],
    [
      "duplicate failed case",
      {
        ...evaluation(["case-1"]),
        failedCaseIds: ["case-1", "case-1"],
        passedCaseCount: 0,
      },
    ],
    [
      "inconsistent passed count",
      { ...evaluation(["case-1"]), passedCaseCount: 2 },
    ],
  ])("rejects a malformed evaluation with %s", (_label, malformed) => {
    expect(compareEvaluations(cases, evaluation([]), malformed)).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });
  });
});
