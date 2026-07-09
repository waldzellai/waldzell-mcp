import { describe, expect, test } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import type {
  EvaluationCase,
  ExecutionResult,
} from "../../src/contracts.js";
import {
  evaluateExecutions,
  evaluateProtocolResults,
  type EvaluatedExecutions,
} from "../../src/evaluator.js";

function execution(
  caseId: string,
  stdout: string,
  overrides: Partial<ExecutionResult> = {},
): ExecutionResult {
  return {
    caseId,
    exitCode: 0,
    stdout,
    stderr: "",
    timedOut: false,
    durationMillis: 1,
    ...overrides,
  };
}

function unwrap(
  result: ReturnType<typeof evaluateExecutions>,
): EvaluatedExecutions {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

const passingCase = {
  id: "case-1",
  input: { prompt: "hello" },
  expected: { answer: 42 },
} as const satisfies EvaluationCase;

describe("evaluateExecutions", () => {
  test("rejects an empty case set", () => {
    expect(evaluateExecutions([], [])).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
  });

  test("validates case definitions before malformed execution output", () => {
    expect(
      evaluateExecutions([], [execution("case-extra", "not-json\n")]),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
  });

  test("rejects duplicate case IDs", () => {
    const cases = [
      passingCase,
      { ...passingCase, input: { prompt: "duplicate" } },
    ];

    expect(
      evaluateExecutions(cases, [
        execution("case-1", '{"answer":42}\n'),
        execution("case-1", '{"answer":42}\n'),
      ]),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
  });

  test.each([
    ["missing terminal newline", '{"answer":42}'],
    ["empty output", ""],
    ["multiple JSONL records", '{}\n{"answer":42}\n'],
    ["extra output after a record", '{"answer":42}\nextra'],
  ])("records malformed JSONL with %s as a failed case", (_label, stdout) => {
    const evaluated = unwrap(
      evaluateExecutions([passingCase], [execution("case-1", stdout)]),
    );

    expect(evaluated).toMatchObject({
      caseResults: [
        {
          caseId: "case-1",
          protocolResult: { ok: false, error: "malformed JSONL output" },
          passed: false,
        },
      ],
      evaluation: {
        caseCount: 1,
        passedCaseCount: 0,
        failedCaseIds: ["case-1"],
      },
    });
  });

  test("records invalid JSON output as a failed case", () => {
    const evaluated = unwrap(
      evaluateExecutions(
        [passingCase],
        [execution("case-1", "not-json\n")],
      ),
    );

    expect(evaluated.caseResults).toEqual([
      {
        caseId: "case-1",
        protocolResult: { ok: false, error: "invalid JSON output" },
        passed: false,
      },
    ]);
  });

  test("rejects a missing execution result", () => {
    expect(evaluateExecutions([passingCase], [])).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });
  });

  test("rejects extra and duplicate execution results", () => {
    expect(
      evaluateExecutions([passingCase], [
        execution("case-1", '{"answer":42}\n'),
        execution("case-extra", '{"answer":42}\n'),
      ]),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });

    expect(
      evaluateExecutions([passingCase], [
        execution("case-1", '{"answer":42}\n'),
        execution("case-1", '{"answer":42}\n'),
      ]),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });
  });

  test("rejects process failures that should have stopped at the execution boundary", () => {
    expect(
      evaluateExecutions(
        [passingCase],
        [
          execution("case-1", '{"answer":42}\n', {
            exitCode: 1,
            timedOut: true,
          }),
        ],
      ),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });
  });

  test("uses parsed structural JSON equality instead of textual equality", () => {
    const evaluated = unwrap(
      evaluateExecutions(
        [
          {
            id: "case-1",
            input: null,
            expected: { alpha: 1, nested: [true, null] },
          },
        ],
        [
          execution(
            "case-1",
            ' { "nested": [ true, null ], "alpha": 1 } \n',
          ),
        ],
      ),
    );

    expect(evaluated.evaluation).toMatchObject({
      caseCount: 1,
      passedCaseCount: 1,
      failedCaseIds: [],
    });
  });

  test("preserves original case order and records expected-output mismatches", () => {
    const cases = [
      { id: "case-b", input: 2, expected: { value: 2 } },
      { id: "case-a", input: 1, expected: { value: 1 } },
    ] as const;
    const evaluated = unwrap(
      evaluateExecutions(cases, [
        execution("case-a", '{"value":0}\n'),
        execution("case-b", '{"value":9}\n'),
      ]),
    );

    expect(evaluated.caseResults.map(({ caseId }) => caseId)).toEqual([
      "case-b",
      "case-a",
    ]);
    expect(evaluated.evaluation).toEqual({
      caseCount: 2,
      passedCaseCount: 0,
      failedCaseIds: ["case-b", "case-a"],
      logicalResultDigest: sha256(
        canonicalJson([
          {
            caseId: "case-b",
            protocolResult: { ok: true, output: { value: 9 } },
            passed: false,
          },
          {
            caseId: "case-a",
            protocolResult: { ok: true, output: { value: 0 } },
            passed: false,
          },
        ]),
      ),
    });
  });

  test("excludes stderr, duration, and JSON formatting from the logical digest", () => {
    const first = unwrap(
      evaluateExecutions(
        [passingCase],
        [
          execution("case-1", '{"answer":42}\n', {
            stderr: "/host/one warning",
            durationMillis: 10,
          }),
        ],
      ),
    );
    const second = unwrap(
      evaluateExecutions(
        [passingCase],
        [
          execution("case-1", '{ "answer" : 42 }\n', {
            stderr: "/different/host warning",
            durationMillis: 9_999,
          }),
        ],
      ),
    );

    expect(second.evaluation.logicalResultDigest).toBe(
      first.evaluation.logicalResultDigest,
    );
  });

  test("rejects non-normalized protocol errors before they enter a logical digest", () => {
    expect(
      evaluateProtocolResults(
        [passingCase],
        [
          {
            caseId: "case-1",
            protocolResult: {
              ok: false,
              error: "/private/host/path: parser exploded",
            },
          },
        ],
      ),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "EvaluationFailed" }),
    });
  });

  test("drops undeclared protocol metadata before computing the logical digest", () => {
    const clean = evaluateProtocolResults(
      [passingCase],
      [
        {
          caseId: "case-1",
          protocolResult: { ok: true, output: { answer: 42 } },
        },
      ],
    );
    const decorated = evaluateProtocolResults(
      [passingCase],
      [
        {
          caseId: "case-1",
          protocolResult: {
            ok: true,
            output: { answer: 42 },
            hostPath: "/private/host/path",
          } as never,
        },
      ],
    );
    expect(clean.ok).toBe(true);
    expect(decorated.ok).toBe(true);
    if (!clean.ok || !decorated.ok) return;

    expect(decorated.value).toEqual(clean.value);
  });
});
