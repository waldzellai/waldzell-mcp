import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import {
  readArtifactBundle,
  recoverArtifactPublishLocks,
  writeArtifactBundle,
} from "../../src/artifacts.js";
import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import { compareEvaluations } from "../../src/compare.js";
import {
  V1_INPUT_LIMITS,
  V1_SANDBOX_POLICY,
  type ArtifactWriteInput,
  type CandidateIdentity,
  type EvaluationCase,
  type ExecutionResult,
  type LoadedEvaluationCases,
  type TraceRecord,
} from "../../src/contracts.js";
import { evaluateExecutions } from "../../src/evaluator.js";
import { createRunManifest } from "../../src/manifest.js";
import { parseEvaluationCasesText } from "../../src/runner.js";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

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
    source: {
      relativePath: `candidates/${name}`,
      digest: imageDigest,
    },
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

const DEFAULT_CASES = [
  { id: "case-2", input: { value: 2 }, expected: { answer: 2 } },
  { id: "case-1", input: { value: 1 }, expected: { answer: 1 } },
] as const satisfies readonly EvaluationCase[];

function execution(
  caseId: string,
  output: unknown,
  overrides: Partial<ExecutionResult> = {},
): ExecutionResult {
  return {
    caseId,
    exitCode: 0,
    stdout: `${JSON.stringify(output)}\n`,
    stderr: "",
    timedOut: false,
    durationMillis: 1,
    ...overrides,
  };
}

function defaultExecutions(): readonly ExecutionResult[] {
  return [
    execution("case-1", { answer: 1 }),
    execution("case-2", { answer: 2 }),
  ];
}

function loadedCaseSnapshot(
  cases: readonly EvaluationCase[],
): LoadedEvaluationCases {
  const rawText = `${cases.map((value) => canonicalJson(value)).join("\n")}\n`;
  const loaded = parseEvaluationCasesText(rawText);
  if (!loaded.ok) throw new Error(loaded.error.message);
  return loaded.value;
}

function makeArtifactInput(options: {
  readonly cases?: readonly EvaluationCase[];
  readonly baselineExecutions?: readonly ExecutionResult[];
  readonly candidateExecutions?: readonly ExecutionResult[];
} = {}): ArtifactWriteInput {
  const loadedCases = loadedCaseSnapshot(options.cases ?? DEFAULT_CASES);
  const cases = loadedCases.cases;
  const baselineExecutions = options.baselineExecutions ?? defaultExecutions();
  const candidateExecutions = options.candidateExecutions ?? defaultExecutions();
  const baseline = evaluateExecutions(cases, baselineExecutions);
  const candidate = evaluateExecutions(cases, candidateExecutions);
  if (!baseline.ok) throw new Error(baseline.error.message);
  if (!candidate.ok) throw new Error(candidate.error.message);
  const compared = compareEvaluations(
    cases,
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
    seed: 73,
    baseline: candidateIdentity("baseline", "c"),
    candidate: candidateIdentity("candidate", "d"),
    casesDigest: loadedCases.digest,
    inputLimits: V1_INPUT_LIMITS,
    sandbox: V1_SANDBOX_POLICY,
  });
  if (!manifest.ok) throw new Error(manifest.error.message);

  return {
    runsDirectory: "replaced-by-test",
    manifest: manifest.value,
    loadedCases,
    baselineExecutions,
    candidateExecutions,
    baselineEvaluation: baseline.value.evaluation,
    candidateEvaluation: candidate.value.evaluation,
    comparison: compared.value.comparison,
  };
}

function withRunsDirectory(
  input: ArtifactWriteInput,
  runsDirectory: string,
): ArtifactWriteInput {
  return { ...input, runsDirectory };
}

async function snapshotBundle(
  directory: string,
): Promise<Readonly<Record<string, string>>> {
  const names = (await readdir(directory)).sort();
  return Object.fromEntries(
    await Promise.all(
      names.map(async (name) => [
        name,
        (await readFile(join(directory, name))).toString("base64"),
      ]),
    ),
  );
}

async function expectNoStagingSibling(
  runsDirectory: string,
  finalRunId?: string,
): Promise<void> {
  const names = await readdir(runsDirectory);
  expect(names.filter((name) => name !== finalRunId)).toEqual([]);
}

function parseTrace(contents: string): TraceRecord[] {
  return contents
    .slice(0, -1)
    .split("\n")
    .map((line) => JSON.parse(line) as TraceRecord);
}

function concurrentWriteBarrier(): (
  path: string,
  contents: string,
) => Promise<void> {
  let arrivals = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolveGate) => {
    release = resolveGate;
  });
  return async (path, contents) => {
    await writeFile(path, contents, { flag: "wx", mode: 0o600 });
    if (path.endsWith("result.json")) {
      arrivals += 1;
      if (arrivals === 2) release();
      await gate;
    }
  };
}

describe("artifact bundles", () => {
  test("publishes four reader-validated artifacts with recomputable invariants", async () => {
    const root = await temporaryDirectory("reynard-artifacts-");
    const runsDirectory = join(root, "runs");
    const expectedSentinel = "EXPECTED-HOST-ONLY-9b0f";
    const cases = [
      DEFAULT_CASES[0],
      {
        id: "case-1",
        input: { value: 1 },
        expected: { answer: 1, expectedSentinel },
      },
    ];
    const input = withRunsDirectory(
      makeArtifactInput({ cases }),
      runsDirectory,
    );

    const written = await writeArtifactBundle(input);

    expect(written).toEqual({
      ok: true,
      value: {
        directory: join(runsDirectory, input.manifest.runId),
        published: true,
      },
    });
    const target = join(runsDirectory, input.manifest.runId);
    expect((await readdir(target)).sort()).toEqual([
      "baseline.trace.jsonl",
      "candidate.trace.jsonl",
      "manifest.json",
      "result.json",
    ]);

    const baselineBytes = await readFile(
      join(target, "baseline.trace.jsonl"),
      "utf8",
    );
    const candidateBytes = await readFile(
      join(target, "candidate.trace.jsonl"),
      "utf8",
    );
    const resultBytes = await readFile(join(target, "result.json"), "utf8");
    const records = parseTrace(candidateBytes);
    expect(records.map(({ caseId }) => caseId)).toEqual(["case-2", "case-1"]);
    expect(records.map(({ ordinal }) => ordinal)).toEqual([0, 1]);
    expect(records.map(({ runId }) => runId)).toEqual([
      input.manifest.runId,
      input.manifest.runId,
    ]);
    expect(records.map(({ requestDigest }) => requestDigest)).toEqual(
      cases.map((evaluationCase) =>
        sha256(
          canonicalJson({
            schemaVersion: 1,
            caseId: evaluationCase.id,
            seed: input.manifest.seed,
            input: evaluationCase.input,
          }),
        ),
      ),
    );

    const independentlyRecomputedDigest = sha256(
      canonicalJson(
        records.map((record, index) => ({
          caseId: record.caseId,
          protocolResult: record.protocolResult,
          passed:
            record.protocolResult.ok &&
            canonicalJson(record.protocolResult.output) ===
              canonicalJson(cases[index]?.expected),
        })),
      ),
    );
    const result = JSON.parse(resultBytes) as {
      candidateEvaluation: { logicalResultDigest: string };
      comparison: { noNewRegressions: boolean };
      overallPassed: boolean;
    };
    expect(result.candidateEvaluation.logicalResultDigest).toBe(
      independentlyRecomputedDigest,
    );
    expect(result.comparison.noNewRegressions).toBe(true);
    expect(result.overallPassed).toBe(false);
    expect(`${baselineBytes}${candidateBytes}${resultBytes}`).not.toContain(
      expectedSentinel,
    );

    const reread = await readArtifactBundle(target, input.loadedCases);
    expect(reread.ok).toBe(true);
    await expectNoStagingSibling(runsDirectory, input.manifest.runId);
  });

  test("publishes a deterministic failed trace for malformed candidate output", async () => {
    const root = await temporaryDirectory("reynard-artifact-protocol-failure-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(
      makeArtifactInput({
        candidateExecutions: [
          execution("case-1", null, { stdout: "not-json\n" }),
          execution("case-2", { answer: 2 }),
        ],
      }),
      runsDirectory,
    );

    const written = await writeArtifactBundle(input);

    expect(written.ok).toBe(true);
    if (!written.ok) throw new Error(written.error.message);
    const trace = parseTrace(
      await readFile(join(written.value.directory, "candidate.trace.jsonl"), "utf8"),
    );
    expect(trace.map(({ protocolResult }) => protocolResult)).toEqual([
      { ok: true, output: { answer: 2 } },
      { ok: false, error: "invalid JSON output" },
    ]);
    const bundle = await readArtifactBundle(
      written.value.directory,
      input.loadedCases,
    );
    expect(bundle.ok).toBe(true);
    if (!bundle.ok) throw new Error(bundle.error.message);
    expect(bundle.value.result).toMatchObject({
      candidateEvaluation: {
        failedCaseIds: ["case-1"],
        passedCaseCount: 1,
      },
      comparison: {
        noNewRegressions: false,
        regressions: [{ caseId: "case-1" }],
      },
      overallPassed: false,
    });
  });

  test("rejects reader cases from a different golden snapshot even when failures are unchanged", async () => {
    const root = await temporaryDirectory("reynard-artifact-wrong-golden-");
    const runsDirectory = join(root, "runs");
    const originalCases = DEFAULT_CASES.map((evaluationCase) => ({
      ...evaluationCase,
      expected: { answer: 999 },
    }));
    const input = withRunsDirectory(
      makeArtifactInput({ cases: originalCases }),
      runsDirectory,
    );
    const written = await writeArtifactBundle(input);
    if (!written.ok) throw new Error(written.error.message);
    const differentGolden = originalCases.map((evaluationCase) => ({
      ...evaluationCase,
      expected: { answer: 998 },
    }));

    expect(
      await readArtifactBundle(
        written.value.directory,
        loadedCaseSnapshot(differentGolden),
      ),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
  });

  test("rejects a self-consistent manifest bound to a different case digest", async () => {
    const root = await temporaryDirectory("reynard-artifact-wrong-digest-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);
    const mismatchedManifest = createRunManifest({
      evaluator: input.manifest.evaluator,
      seed: input.manifest.seed,
      baseline: input.manifest.baseline,
      candidate: input.manifest.candidate,
      casesDigest: digest("e"),
      inputLimits: input.manifest.inputLimits,
      sandbox: input.manifest.sandbox,
    });
    if (!mismatchedManifest.ok) {
      throw new Error(mismatchedManifest.error.message);
    }

    expect(
      await writeArtifactBundle({ ...input, manifest: mismatchedManifest.value }),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    await expect(
      stat(join(runsDirectory, mismatchedManifest.value.runId)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  test.each([
    [
      "manifest identity",
      async (target: string) => {
        const path = join(target, "manifest.json");
        const manifest = JSON.parse(await readFile(path, "utf8")) as Record<
          string,
          unknown
        >;
        await writeFile(path, `${canonicalJson({ ...manifest, runId: digest("f") })}\n`);
      },
    ],
    [
      "trace ordering",
      async (target: string) => {
        const path = join(target, "baseline.trace.jsonl");
        const records = parseTrace(await readFile(path, "utf8")).reverse();
        await writeFile(
          path,
          `${records.map((record) => canonicalJson(record)).join("\n")}\n`,
        );
      },
    ],
    [
      "trace evaluation",
      async (target: string) => {
        const path = join(target, "candidate.trace.jsonl");
        const records = parseTrace(await readFile(path, "utf8"));
        const first = records[0];
        if (first === undefined) throw new Error("missing trace record");
        records[0] = {
          ...first,
          protocolResult: { ok: true, output: { answer: 999 } },
        };
        await writeFile(
          path,
          `${records.map((record) => canonicalJson(record)).join("\n")}\n`,
        );
      },
    ],
    [
      "overall result",
      async (target: string) => {
        const path = join(target, "result.json");
        const result = JSON.parse(await readFile(path, "utf8")) as Record<
          string,
          unknown
        >;
        await writeFile(
          path,
          `${canonicalJson({ ...result, overallPassed: false })}\n`,
        );
      },
    ],
  ])("reader rejects tampered %s", async (_label, tamper) => {
    const root = await temporaryDirectory("reynard-artifact-tamper-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);
    const written = await writeArtifactBundle(input);
    if (!written.ok) throw new Error(written.error.message);
    await tamper(written.value.directory);

    expect(
      await readArtifactBundle(written.value.directory, input.loadedCases),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
  });

  test("accepts a matching repeat without replacing the existing bytes", async () => {
    const root = await temporaryDirectory("reynard-artifact-repeat-");
    const runsDirectory = join(root, "runs");
    const firstInput = withRunsDirectory(makeArtifactInput(), runsDirectory);
    const first = await writeArtifactBundle(firstInput);
    if (!first.ok) throw new Error(first.error.message);
    const before = await snapshotBundle(first.value.directory);
    const repeatedExecutions = [
      execution("case-1", { answer: 1 }, {
        stdout: '{ "answer" : 1 }\n',
        stderr: "different warning",
        durationMillis: 9_001,
      }),
      execution("case-2", { answer: 2 }, {
        stdout: '{ "answer" : 2 }\n',
        stderr: "ignored",
        durationMillis: 123,
      }),
    ];
    const repeatInput = withRunsDirectory(
      makeArtifactInput({
        baselineExecutions: repeatedExecutions,
        candidateExecutions: repeatedExecutions,
      }),
      runsDirectory,
    );

    const repeated = await writeArtifactBundle(repeatInput);

    expect(repeated).toEqual({
      ok: true,
      value: { directory: first.value.directory, published: false },
    });
    expect(await snapshotBundle(first.value.directory)).toEqual(before);
    await expectNoStagingSibling(runsDirectory, firstInput.manifest.runId);
  });

  test("rejects a logical mismatch without changing the target", async () => {
    const root = await temporaryDirectory("reynard-artifact-mismatch-");
    const runsDirectory = join(root, "runs");
    const firstInput = withRunsDirectory(makeArtifactInput(), runsDirectory);
    const first = await writeArtifactBundle(firstInput);
    if (!first.ok) throw new Error(first.error.message);
    const before = await snapshotBundle(first.value.directory);
    const mismatch = withRunsDirectory(
      makeArtifactInput({
        candidateExecutions: [
          execution("case-1", { answer: 999 }),
          execution("case-2", { answer: 2 }),
        ],
      }),
      runsDirectory,
    );

    expect(await writeArtifactBundle(mismatch)).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    expect(await snapshotBundle(first.value.directory)).toEqual(before);
    await expectNoStagingSibling(runsDirectory, firstInput.manifest.runId);
  });

  test.each([
    [
      "validation",
      {
        io: {
          readFile: async (_path: string) => {
            throw new Error("injected validation failure");
          },
        },
      },
    ],
    [
      "write",
      {
        io: {
          writeFile: async (_path: string, _contents: string) => {
            throw new Error("injected write failure");
          },
        },
      },
    ],
    [
      "rename",
      {
        io: {
          rename: async (_source: string, _target: string) => {
            throw new Error("injected rename failure");
          },
        },
      },
    ],
  ])("cleans a new run after an injected %s failure", async (_label, options) => {
    const root = await temporaryDirectory("reynard-artifact-fault-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);

    expect(await writeArtifactBundle(input, options)).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    await expect(
      stat(join(runsDirectory, input.manifest.runId)),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expectNoStagingSibling(runsDirectory);
  });

  test.each([
    [
      "validation",
      {
        io: {
          readFile: async (_path: string) => {
            throw new Error("injected validation failure");
          },
        },
      },
    ],
    [
      "write",
      {
        io: {
          writeFile: async (_path: string, _contents: string) => {
            throw new Error("injected write failure");
          },
        },
      },
    ],
  ])(
    "preserves a mismatched target after an injected %s failure",
    async (_label, options) => {
      const root = await temporaryDirectory("reynard-artifact-existing-fault-");
      const runsDirectory = join(root, "runs");
      const firstInput = withRunsDirectory(makeArtifactInput(), runsDirectory);
      const first = await writeArtifactBundle(firstInput);
      if (!first.ok) throw new Error(first.error.message);
      const before = await snapshotBundle(first.value.directory);
      const mismatch = withRunsDirectory(
        makeArtifactInput({
          candidateExecutions: [
            execution("case-1", { answer: 999 }),
            execution("case-2", { answer: 2 }),
          ],
        }),
        runsDirectory,
      );

      expect(await writeArtifactBundle(mismatch, options)).toEqual({
        ok: false,
        error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
      });
      expect(await snapshotBundle(first.value.directory)).toEqual(before);
      await expectNoStagingSibling(runsDirectory, firstInput.manifest.runId);
    },
  );

  test("concurrent matching writers publish once and accept the same logical bundle", async () => {
    const root = await temporaryDirectory("reynard-artifact-concurrent-match-");
    const runsDirectory = join(root, "runs");
    const completedExecution = (
      label: string,
      durationMillis: number,
    ): ArtifactWriteInput => {
      const executions = defaultExecutions().map((result) => ({
        ...result,
        stderr: label,
        durationMillis,
      }));
      return withRunsDirectory(
        makeArtifactInput({
          baselineExecutions: executions,
          candidateExecutions: executions,
        }),
        runsDirectory,
      );
    };
    const inputs = [
      completedExecution("first execution", 10),
      completedExecution("second execution", 20),
    ] as const;
    const racingWrite = concurrentWriteBarrier();

    const results = await Promise.all(
      inputs.map((input) =>
        writeArtifactBundle(input, { io: { writeFile: racingWrite } }),
      ),
    );

    expect(results.every(({ ok }) => ok)).toBe(true);
    expect(
      results
        .filter((result) => result.ok)
        .map((result) => result.value.published)
        .sort(),
    ).toEqual([false, true]);
    const target = join(runsDirectory, inputs[0].manifest.runId);
    expect(
      (await readArtifactBundle(target, inputs[0].loadedCases)).ok,
    ).toBe(true);
    await expectNoStagingSibling(runsDirectory, inputs[0].manifest.runId);
  });

  test("a concurrent logical mismatch leaves the winner byte-for-byte unchanged", async () => {
    const root = await temporaryDirectory("reynard-artifact-concurrent-mismatch-");
    const runsDirectory = join(root, "runs");
    const passing = withRunsDirectory(makeArtifactInput(), runsDirectory);
    const failing = withRunsDirectory(
      makeArtifactInput({
        candidateExecutions: [
          execution("case-1", { answer: 999 }),
          execution("case-2", { answer: 2 }),
        ],
      }),
      runsDirectory,
    );
    const target = join(runsDirectory, passing.manifest.runId);
    let markPublished!: () => void;
    const published = new Promise<void>((resolvePublished) => {
      markPublished = resolvePublished;
    });
    let releaseWinner!: () => void;
    const winnerGate = new Promise<void>((resolveWinner) => {
      releaseWinner = resolveWinner;
    });
    const gatedWinnerRename = async (
      source: string,
      destination: string,
    ): Promise<void> => {
      await rename(source, destination);
      markPublished();
      await winnerGate;
    };
    const winnerPromise = writeArtifactBundle(passing, {
      io: { rename: gatedWinnerRename },
    });
    await published;
    const winnerBytes = await snapshotBundle(target);

    let markLoserStaged!: () => void;
    const loserStaged = new Promise<void>((resolveStaged) => {
      markLoserStaged = resolveStaged;
    });
    const loserWrite = async (path: string, contents: string): Promise<void> => {
      await writeFile(path, contents, { flag: "wx", mode: 0o600 });
      if (path.endsWith("result.json")) markLoserStaged();
    };
    const loserPromise = writeArtifactBundle(failing, {
      io: { writeFile: loserWrite },
    });
    await loserStaged;
    expect(await snapshotBundle(target)).toEqual(winnerBytes);
    releaseWinner();
    const [winner, loser] = await Promise.all([winnerPromise, loserPromise]);

    expect(winner.ok).toBe(true);
    expect(loser).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    expect((await readArtifactBundle(target, passing.loadedCases)).ok).toBe(true);
    expect(await snapshotBundle(target)).toEqual(winnerBytes);
    await expectNoStagingSibling(runsDirectory, passing.manifest.runId);
  });

  test("bounds lock contention and cleans the losing writer staging directory", async () => {
    const root = await temporaryDirectory("reynard-artifact-lock-contention-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);
    let enteredRename!: () => void;
    const renameEntered = new Promise<void>((resolveEntered) => {
      enteredRename = resolveEntered;
    });
    let releaseRename!: () => void;
    const renameGate = new Promise<void>((resolveGate) => {
      releaseRename = resolveGate;
    });
    const blockedRename = async (source: string, target: string): Promise<void> => {
      enteredRename();
      await renameGate;
      await rename(source, target);
    };
    const firstPromise = writeArtifactBundle(input, {
      io: { rename: blockedRename },
    });
    await renameEntered;

    const contended = await writeArtifactBundle(input, {
      lockTimeoutMillis: 20,
      lockRetryMillis: 1,
    });
    releaseRename();
    const first = await firstPromise;

    expect(first.ok).toBe(true);
    expect(contended).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    await expectNoStagingSibling(runsDirectory, input.manifest.runId);
  });

  test("recovers a stale publish lock before atomically publishing", async () => {
    const root = await temporaryDirectory("reynard-artifact-stale-lock-");
    const runsDirectory = join(root, "runs");
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);
    await mkdir(runsDirectory, { recursive: true, mode: 0o700 });
    const lockPath = join(
      runsDirectory,
      `.${input.manifest.runId}.publish-lock`,
    );
    await writeFile(
      lockPath,
      canonicalJson({
        schemaVersion: 1,
        pid: 2_147_483_647,
        token: "stale-owner",
        createdAtMillis: 0,
      }),
    );

    const recovered = await recoverArtifactPublishLocks(runsDirectory, {
      isProcessAlive: () => false,
    });
    const written = await writeArtifactBundle(input);

    expect(recovered).toEqual({ ok: true, value: 1 });
    expect(written.ok).toBe(true);
    await expect(stat(lockPath)).rejects.toMatchObject({ code: "ENOENT" });
    await expectNoStagingSibling(runsDirectory, input.manifest.runId);
  });

  test("refuses artifact publication outside a private trusted runs directory", async () => {
    const root = await temporaryDirectory("reynard-artifact-untrusted-runs-");
    const runsDirectory = join(root, "runs");
    await mkdir(runsDirectory, { mode: 0o700 });
    await chmod(runsDirectory, 0o777);
    const input = withRunsDirectory(makeArtifactInput(), runsDirectory);

    expect(await writeArtifactBundle(input)).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ArtifactWriteFailed" }),
    });
    expect(await readdir(runsDirectory)).toEqual([]);
  });
});
