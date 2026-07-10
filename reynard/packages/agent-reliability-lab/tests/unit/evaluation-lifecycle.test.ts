import { describe, expect, test } from "vitest";

import type { CandidateSnapshot } from "../../src/candidate.js";
import { finalizeEvaluation } from "../../src/evaluation-lifecycle.js";

const baselineSnapshot = {} as CandidateSnapshot;
const candidateSnapshot = {} as CandidateSnapshot;

describe("evaluation lifecycle", () => {
  test("turns primary success into SandboxUnavailable when cleanup fails", async () => {
    const cleaned: CandidateSnapshot[] = [];

    const result = await finalizeEvaluation(
      { ok: true, value: "complete" },
      [
        { phase: "baseline", snapshot: baselineSnapshot },
        { phase: "candidate", snapshot: candidateSnapshot },
      ],
      async (snapshot) => {
        cleaned.push(snapshot);
        if (snapshot === baselineSnapshot) throw new Error("injected failure");
      },
    );

    expect(cleaned).toEqual([baselineSnapshot, candidateSnapshot]);
    expect(result).toEqual({
      ok: false,
      error: {
        _tag: "SandboxUnavailable",
        message: expect.stringMatching(/baseline.*injected failure/i),
      },
    });
  });

  test("preserves primary error precedence and appends cleanup phase context", async () => {
    const result = await finalizeEvaluation(
      {
        ok: false,
        error: { _tag: "ArtifactWriteFailed", message: "primary write failure" },
      },
      [{ phase: "candidate", snapshot: candidateSnapshot }],
      async () => {
        throw new Error("injected cleanup failure");
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        _tag: "ArtifactWriteFailed",
        message: expect.stringMatching(
          /primary write failure.*candidate.*injected cleanup failure.*ArtifactWriteFailed/i,
        ),
      },
    });
  });
});
