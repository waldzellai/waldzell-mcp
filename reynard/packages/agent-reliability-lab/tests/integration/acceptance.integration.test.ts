import {
  spawn,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";

import {
  RunManifestSchema,
  RunResultArtifactSchema,
  TraceRecordSchema,
  loadEvaluationCases,
  readArtifactBundle,
  type CandidateDefinition,
} from "../../src/index.js";
import { dockerExecutableForPlatform } from "../../src/sandbox/docker.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");
const CLI = join(PACKAGE_ROOT, "dist", "cli.js");
const FIXTURES = join(WORKSPACE_ROOT, "fixtures", "echo");
const CASES = join(FIXTURES, "goldens.jsonl");
const DOCKER = dockerExecutableForPlatform(process.platform);
const IMAGE =
  "node@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293";
const IMAGE_ID =
  "sha256:11cedc39e663e7c5d5cb9cc77a461a0d2adc25537b94e6831a6108f09cb2001b";
const temporaryDirectories: string[] = [];
const cleanupContainers = new Set<string>();

interface CommandResult {
  readonly pid: number;
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

interface RunningCommand {
  readonly child: ChildProcessWithoutNullStreams;
  readonly pid: number;
  readonly result: Promise<CommandResult>;
}

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function startCommand(
  executable: string,
  args: readonly string[],
  options: {
    readonly cwd: string;
    readonly stdin?: string;
  },
): RunningCommand {
  const child = spawn(executable, [...args], {
    cwd: options.cwd,
    env: { ...process.env },
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (child.pid === undefined) {
    throw new Error(`Command did not start: ${executable}`);
  }
  const pid = child.pid;
  const result = new Promise<CommandResult>((resolveResult, reject) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolveResult({
        pid,
        exitCode,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
    child.stdin.end(options.stdin ?? "");
  });
  return { child, pid, result };
}

function execute(
  executable: string,
  args: readonly string[],
  options: {
    readonly cwd: string;
    readonly stdin?: string;
  },
): Promise<CommandResult> {
  return startCommand(executable, args, options).result;
}

function definition(name: string): string {
  return join(FIXTURES, name, "candidate.json");
}

function cliArguments(
  baseline = definition("baseline"),
  candidate = definition("candidate"),
  cases = CASES,
): readonly string[] {
  return [
    CLI,
    "evaluate",
    "--baseline",
    baseline,
    "--candidate",
    candidate,
    "--cases",
    cases,
    "--seed",
    "0",
  ];
}

async function runCli(
  cwd: string,
  options: {
    readonly baseline?: string;
    readonly candidate?: string;
    readonly cases?: string;
    readonly rawArguments?: readonly string[];
  } = {},
): Promise<CommandResult> {
  return execute(
    process.execPath,
    options.rawArguments ??
      cliArguments(options.baseline, options.candidate, options.cases),
    { cwd },
  );
}

function startCli(
  cwd: string,
  options: {
    readonly baseline?: string;
    readonly candidate?: string;
    readonly cases?: string;
  } = {},
): RunningCommand {
  return startCommand(
    process.execPath,
    cliArguments(options.baseline, options.candidate, options.cases),
    { cwd },
  );
}

async function waitForLabContainer(cliPid: number): Promise<string> {
  const prefix = `reynard-lab-v1-p${cliPid}-`;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const listed = await docker([
      "ps",
      "--all",
      "--filter",
      `name=^/${prefix}`,
      "--format",
      "{{.Names}}",
    ]);
    expect(listed.exitCode).toBe(0);
    const name = listed.stdout
      .split("\n")
      .find((candidate) => candidate.startsWith(prefix));
    if (name !== undefined) {
      cleanupContainers.add(name);
      return name;
    }
    await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 25));
  }
  throw new Error(`Timed out waiting for a lab container owned by PID ${cliPid}`);
}

async function directoryNames(path: string): Promise<readonly string[]> {
  try {
    return await readdir(path);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

async function assertInterruptedStateClean(
  cwd: string,
  cliPid: number,
  containerName: string,
): Promise<void> {
  const remainingContainer = await docker([
    "ps",
    "--all",
    "--quiet",
    "--filter",
    `name=^/${containerName}$`,
  ]);
  expect(remainingContainer.exitCode).toBe(0);
  expect(remainingContainer.stdout.trim()).toBe("");
  cleanupContainers.delete(containerName);
  const prefix = `reynard-lab-v1-p${cliPid}-`;
  const stateRoot = join(tmpdir(), "reynard-lab-v1");
  expect(
    (await directoryNames(join(stateRoot, "staging"))).filter((name) =>
      name.startsWith(prefix),
    ),
  ).toEqual([]);
  expect(
    (await directoryNames(join(stateRoot, "cidfiles"))).filter((name) =>
      name.startsWith(prefix),
    ),
  ).toEqual([]);
  const runNames = await directoryNames(join(cwd, "runs"));
  expect(runNames.filter((name) => name !== ".gitkeep")).toEqual([]);
}

async function runDirectory(cwd: string): Promise<string> {
  const runs = join(cwd, "runs");
  const entries = await readdir(runs, { withFileTypes: true });
  expect(entries).toHaveLength(1);
  const entry = entries[0];
  expect(entry?.isDirectory()).toBe(true);
  expect(entry?.name).toMatch(/^sha256:[0-9a-f]{64}$/);
  if (entry === undefined) throw new Error("Expected one run directory");
  return join(runs, entry.name);
}

async function parseJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function parseJsonl(path: string): Promise<readonly unknown[]> {
  const text = await readFile(path, "utf8");
  expect(text.endsWith("\n")).toBe(true);
  return text.slice(0, -1).split("\n").map((line) => JSON.parse(line) as unknown);
}

async function assertBundle(
  directory: string,
  expectedPassed: boolean,
): Promise<Awaited<ReturnType<typeof readArtifactBundle>> & { ok: true }> {
  const names = (await readdir(directory)).sort();
  expect(names).toEqual([
    "baseline.trace.jsonl",
    "candidate.trace.jsonl",
    "manifest.json",
    "result.json",
  ]);
  expect(RunManifestSchema.safeParse(await parseJson(join(directory, "manifest.json"))).success).toBe(true);
  expect(RunResultArtifactSchema.safeParse(await parseJson(join(directory, "result.json"))).success).toBe(true);
  for (const name of ["baseline.trace.jsonl", "candidate.trace.jsonl"] as const) {
    for (const record of await parseJsonl(join(directory, name))) {
      expect(TraceRecordSchema.safeParse(record).success).toBe(true);
    }
  }
  const loadedCases = await loadEvaluationCases(CASES);
  if (!loadedCases.ok) throw new Error(loadedCases.error.message);
  const bundle = await readArtifactBundle(directory, loadedCases.value);
  expect(bundle.ok).toBe(true);
  if (!bundle.ok) throw new Error(bundle.error.message);
  expect(bundle.value.result.overallPassed).toBe(expectedPassed);
  return bundle;
}

async function copyDefinition(
  fixture: string,
  root: string,
  mutate: (value: CandidateDefinition) => CandidateDefinition,
): Promise<string> {
  const target = join(root, fixture);
  await cp(join(FIXTURES, fixture), target, { recursive: true });
  const path = join(target, "candidate.json");
  const original = JSON.parse(await readFile(path, "utf8")) as CandidateDefinition;
  await writeFile(path, `${JSON.stringify(mutate(original), null, 2)}\n`);
  return path;
}

async function docker(
  args: readonly string[],
  stdin?: string,
): Promise<CommandResult> {
  return execute(DOCKER, args, { cwd: WORKSPACE_ROOT, stdin });
}

function containerFixturePath(name: string): string {
  return `/reynard/fixtures/echo/${name}/candidate.json`;
}

function containerCliArguments(
  baseline = containerFixturePath("baseline"),
  candidate = containerFixturePath("candidate"),
  cases = "/reynard/fixtures/echo/goldens.jsonl",
): readonly string[] {
  return [
    "/reynard/packages/agent-reliability-lab/dist/cli.js",
    "evaluate",
    "--baseline",
    baseline,
    "--candidate",
    candidate,
    "--cases",
    cases,
    "--seed",
    "0",
  ];
}

async function runCliInPinnedContainer(
  cwd: string,
  options: {
    readonly baseline?: string;
    readonly candidate?: string;
    readonly cases?: string;
    readonly dockerShim?: string;
  } = {},
): Promise<CommandResult> {
  const mounts = [
    "--mount",
    `type=bind,src=${WORKSPACE_ROOT},dst=/reynard,readonly`,
    "--mount",
    `type=bind,src=${cwd},dst=/work`,
  ];
  if (options.dockerShim !== undefined) {
    mounts.push(
      "--mount",
      `type=bind,src=${options.dockerShim},dst=/usr/bin/docker,readonly`,
    );
  }
  return docker([
    "run",
    "--rm",
    "--pull=never",
    "--platform",
    "linux/amd64",
    "--network=none",
    ...mounts,
    "--workdir",
    "/work",
    "--entrypoint",
    "/usr/local/bin/node",
    IMAGE,
    ...containerCliArguments(
      options.baseline,
      options.candidate,
      options.cases,
    ),
  ]);
}

async function labContainerCreateEvents(
  cliPid: number,
  sinceSeconds: number,
): Promise<readonly string[]> {
  const events = await docker([
    "events",
    "--since",
    String(sinceSeconds),
    "--until",
    String(Math.floor(Date.now() / 1_000) + 2),
    "--filter",
    "type=container",
    "--filter",
    "event=create",
    "--format",
    "{{json .}}",
  ]);
  expect(events.exitCode).toBe(0);
  const prefix = `reynard-lab-v1-p${cliPid}-`;
  return events.stdout
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as {
      Actor?: { Attributes?: { name?: unknown } };
    })
    .map((event) => event.Actor?.Attributes?.name)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.startsWith(prefix),
    );
}

afterEach(async () => {
  for (const container of cleanupContainers) {
    await docker(["rm", "--force", container]).catch(() => undefined);
  }
  cleanupContainers.clear();
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("public CLI acceptance", () => {
  test("two fresh successful runs execute every case with stable logical identity and validated artifacts", async () => {
    const firstWorkingDirectory = await temporaryDirectory("reynard-accept-first-");
    const secondWorkingDirectory = await temporaryDirectory("reynard-accept-second-");

    const first = await runCli(firstWorkingDirectory);
    const second = await runCli(secondWorkingDirectory);

    expect(first).toMatchObject({ exitCode: 0, stderr: "" });
    expect(second).toMatchObject({ exitCode: 0, stderr: "" });
    const firstDirectory = await runDirectory(firstWorkingDirectory);
    const secondDirectory = await runDirectory(secondWorkingDirectory);
    expect(first.stdout).toContain(firstDirectory);
    expect(second.stdout).toContain(secondDirectory);
    const firstBundle = await assertBundle(firstDirectory, true);
    const secondBundle = await assertBundle(secondDirectory, true);
    expect(firstBundle.value.manifest.runId).toBe(secondBundle.value.manifest.runId);
    expect(firstBundle.value.result.candidateEvaluation.logicalResultDigest).toBe(
      secondBundle.value.result.candidateEvaluation.logicalResultDigest,
    );
    expect(firstBundle.value.baselineTrace).toHaveLength(6);
    expect(firstBundle.value.candidateTrace).toHaveLength(6);
    expect(firstBundle.value.result.candidateEvaluation).toMatchObject({
      caseCount: 6,
      passedCaseCount: 6,
      failedCaseIds: [],
    });
    expect(
      firstBundle.value.candidateTrace.find(
        ({ caseId }) => caseId === "derived-expected",
      )?.protocolResult,
    ).toEqual({ ok: true, output: { sum: 5 } });
    expect(firstBundle.value.manifest.baseline.image).toMatchObject({
      reference: IMAGE,
      imageId: IMAGE_ID,
      os: "linux",
      architecture: "amd64",
      platform: "linux/amd64",
    });
  }, 30_000);

  test("a regressed candidate exits 5, names its failed case, and writes a validated failure bundle", async () => {
    const cwd = await temporaryDirectory("reynard-accept-regression-");

    const result = await runCli(cwd, { candidate: definition("regressed") });

    expect(result.exitCode).toBe(5);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("unicode-text");
    const bundle = await assertBundle(await runDirectory(cwd), false);
    expect(bundle.value.result.candidateEvaluation.failedCaseIds).toEqual(["unicode-text"]);
    expect(bundle.value.result.comparison).toMatchObject({
      noNewRegressions: false,
      regressions: [{ caseId: "unicode-text" }],
    });
  }, 20_000);

  test("the same regressed baseline and candidate still fail without a new regression", async () => {
    const cwd = await temporaryDirectory("reynard-accept-shared-failure-");
    const regressed = definition("regressed");

    const result = await runCli(cwd, { baseline: regressed, candidate: regressed });

    expect(result.exitCode).toBe(5);
    expect(result.stdout).toContain("unicode-text");
    const bundle = await assertBundle(await runDirectory(cwd), false);
    expect(bundle.value.result.baselineEvaluation.failedCaseIds).toEqual(["unicode-text"]);
    expect(bundle.value.result.candidateEvaluation.failedCaseIds).toEqual(["unicode-text"]);
    expect(bundle.value.result.comparison).toEqual({
      noNewRegressions: true,
      regressions: [],
    });
  }, 20_000);

  test("protocol-invalid stdout is normalized only by the evaluator and still writes four artifacts", async () => {
    const cwd = await temporaryDirectory("reynard-accept-protocol-");

    const result = await runCli(cwd, { candidate: definition("protocol-invalid") });

    expect(result.exitCode).toBe(5);
    const bundle = await assertBundle(await runDirectory(cwd), false);
    expect(bundle.value.result.candidateEvaluation.failedCaseIds).toEqual([
      "object-values",
      "array-values",
      "unicode-text",
      "boolean-values",
      "nested-values",
      "derived-expected",
    ]);
    expect(bundle.value.candidateTrace.every((record) =>
      !record.protocolResult.ok && record.protocolResult.error === "invalid JSON output",
    )).toBe(true);
  }, 20_000);

  test("the echo fixture rejects any request that owns expected", async () => {
    const cwd = await temporaryDirectory("reynard-accept-expected-leak-");
    const source = join(FIXTURES, "baseline", "src", "index.mjs");
    const request = `${JSON.stringify({
      schemaVersion: 1,
      caseId: "derived-expected",
      seed: 0,
      input: { left: 2, right: 3 },
      expected: { sum: 5 },
    })}\n`;

    const result = await execute(process.execPath, [source], {
      cwd,
      stdin: request,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toMatch(/expected.*must not/i);
  });

  test.each([
    [
      "missing --candidate",
      async (_cwd: string) => ({
        rawArguments: [CLI, "evaluate", "--baseline", definition("baseline"), "--cases", CASES],
        expected: /candidate/i,
      }),
    ],
    [
      "missing --seed",
      async (_cwd: string) => ({
        rawArguments: [
          CLI,
          "evaluate",
          "--baseline",
          definition("baseline"),
          "--candidate",
          definition("candidate"),
          "--cases",
          CASES,
        ],
        expected: /seed/i,
      }),
    ],
    [
      "mutable candidate.image",
      async (cwd: string) => ({
        candidate: await copyDefinition("candidate", cwd, (value) => ({
          ...value,
          image: "node:latest" as CandidateDefinition["image"],
        })),
        expected: /candidate.*image|candidate.*immutable/i,
      }),
    ],
    [
      "empty cases",
      async (cwd: string) => {
        const cases = join(cwd, "empty.jsonl");
        await writeFile(cases, "");
        return { cases, expected: /case.*empty/i };
      },
    ],
    [
      "malformed JSONL",
      async (cwd: string) => {
        const cases = join(cwd, "malformed.jsonl");
        await writeFile(cases, '{"id":"valid","input":null,"expected":null}\nnot-json\n');
        return { cases, expected: /line 2/i };
      },
    ],
    [
      "duplicate case ID",
      async (cwd: string) => {
        const cases = join(cwd, "duplicate.jsonl");
        const line = '{"id":"duplicate","input":null,"expected":null}\n';
        await writeFile(cases, `${line}${line}`);
        return { cases, expected: /duplicate case id.*line 2/i };
      },
    ],
    [
      "source traversal",
      async (cwd: string) => ({
        candidate: await copyDefinition("candidate", cwd, (value) => ({
          ...value,
          source: { ...value.source, relativePath: "../escape" },
        })),
        expected: /candidate.*source\.relativePath/i,
      }),
    ],
    [
      "source digest mismatch",
      async (cwd: string) => ({
        candidate: await copyDefinition("candidate", cwd, (value) => ({
          ...value,
          source: { ...value.source, digest: `sha256:${"0".repeat(64)}` },
        })),
        expected: /candidate.*source digest/i,
      }),
    ],
  ] as const)("maps invalid input: %s", async (_label, prepare) => {
    const cwd = await temporaryDirectory("reynard-accept-invalid-");
    const prepared = await prepare(cwd);

    const result = await runCli(cwd, prepared);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(prepared.expected);
    await expect(stat(join(cwd, "runs"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("without Docker the public CLI never falls back to the host candidate", async () => {
    const cwd = await temporaryDirectory("reynard-accept-no-docker-");
    const sentinel = join(cwd, "host-fallback-sentinel");
    const containerSentinel = "/work/host-fallback-sentinel";
    const request = `${JSON.stringify({
      schemaVersion: 1,
      caseId: "host-probe",
      seed: 0,
      input: { sentinel: containerSentinel },
    })}\n`;
    const positiveControl = await docker(
      [
        "run",
        "--rm",
        "--interactive",
        "--pull=never",
        "--platform",
        "linux/amd64",
        "--network=none",
        "--mount",
        `type=bind,src=${WORKSPACE_ROOT},dst=/reynard,readonly`,
        "--mount",
        `type=bind,src=${cwd},dst=/work`,
        "--workdir",
        "/work",
        "--entrypoint",
        "/usr/local/bin/node",
        IMAGE,
        "/reynard/fixtures/echo/host-probe/src/index.mjs",
      ],
      request,
    );
    expect(positiveControl.exitCode).toBe(0);
    expect((await stat(sentinel)).isFile()).toBe(true);
    await rm(sentinel);
    const cases = join(cwd, "probe.jsonl");
    await writeFile(
      cases,
      `${JSON.stringify({
        id: "host-probe",
        input: { sentinel: containerSentinel },
        expected: { sentinel: containerSentinel },
      })}\n`,
    );

    const result = await runCliInPinnedContainer(cwd, {
      baseline: containerFixturePath("host-probe"),
      candidate: containerFixturePath("host-probe"),
      cases: "/work/probe.jsonl",
    });

    expect(result.exitCode).toBe(3);
    expect(result.stderr).toMatch(
      /spawn \/usr\/bin\/docker ENOENT/i,
    );
    await expect(stat(sentinel)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(join(cwd, "runs"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 15_000);

  test("an absent pinned image exits 3 without a pull, run, or artifact directory", async () => {
    const cwd = await temporaryDirectory("reynard-accept-missing-image-");
    const missingReference = `node@sha256:${"0".repeat(64)}` as CandidateDefinition["image"];
    await copyDefinition("baseline", cwd, (value) => ({
      ...value,
      image: missingReference,
    }));
    const shim = join(cwd, "docker-shim");
    const log = join(cwd, "docker-argv.log");
    await writeFile(
      shim,
      [
        "#!/bin/sh",
        'printf \'%s\\n\' "$*" >> /work/docker-argv.log',
        'case "$1" in',
        '  version) printf \'27.0.0\\n\'; exit 0 ;;',
        "  ps) exit 0 ;;",
        "  image)",
        '    case "$2" in',
        '      inspect) printf \'No such image\\n\' >&2; exit 1 ;;',
        '      *) printf \'unexpected docker command: %s\\n\' "$*" >&2; exit 97 ;;',
        "    esac",
        "    ;;",
        '  *) printf \'unexpected docker command: %s\\n\' "$*" >&2; exit 97 ;;',
        "esac",
      ].join("\n"),
    );
    await chmod(shim, 0o755);

    const pullProbe = await docker([
      "run",
      "--rm",
      "--pull=never",
      "--platform",
      "linux/amd64",
      "--network=none",
      "--mount",
      `type=bind,src=${cwd},dst=/work`,
      "--mount",
      `type=bind,src=${shim},dst=/usr/bin/docker,readonly`,
      "--workdir",
      "/work",
      "--entrypoint",
      "/usr/bin/docker",
      IMAGE,
      "image",
      "pull",
      missingReference,
    ]);
    expect(pullProbe.exitCode).toBe(97);
    expect(pullProbe.stderr).toMatch(/unexpected docker command/i);
    await rm(log, { force: true });

    const result = await runCliInPinnedContainer(cwd, {
      baseline: "/work/baseline/candidate.json",
      dockerShim: shim,
    });

    expect(result.exitCode).toBe(3);
    expect(result.stderr).toMatch(/pinned image.*not available locally/i);
    const invocations = (await readFile(log, "utf8")).trim().split("\n");
    const tokenizedInvocations = invocations.map((line) => line.split(" "));
    expect(tokenizedInvocations.map((tokens) => tokens.slice(0, 2))).toEqual([
      ["version", "--format"],
      ["ps", "--all"],
      ["image", "inspect"],
    ]);
    expect(
      tokenizedInvocations.some((tokens) => tokens.includes("pull")),
    ).toBe(false);
    expect(
      tokenizedInvocations.some(([command]) => command === "run"),
    ).toBe(false);
    await expect(stat(join(cwd, "runs"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 15_000);

  test("baseline execution failure stops before a deliberately slow candidate", async () => {
    const cwd = await temporaryDirectory("reynard-accept-baseline-stop-");
    const sinceSeconds = Math.floor(Date.now() / 1_000) - 1;

    const result = await runCli(cwd, {
      baseline: definition("nonzero"),
      candidate: definition("slow"),
    });
    const createdNames = await labContainerCreateEvents(
      result.pid,
      sinceSeconds,
    );

    expect(result.exitCode).toBe(4);
    expect(result.stderr).toMatch(/baseline.*execution failed/i);
    expect(createdNames).toHaveLength(1);
    await expect(stat(join(cwd, "runs"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 15_000);

  test.each(["SIGINT", "SIGTERM"] as const)(
    "a real %s interrupts the built CLI with exit 4 and complete cleanup",
    async (signal) => {
      const cwd = await temporaryDirectory(
        `reynard-accept-${signal.toLowerCase()}-`,
      );
      const running = startCli(cwd, {
        baseline: definition("slow"),
        candidate: definition("candidate"),
      });
      const containerName = await waitForLabContainer(running.pid);

      expect(running.child.kill(signal)).toBe(true);
      const result = await running.result;

      expect(result.exitCode).toBe(4);
      expect(result.stderr).toMatch(/baseline.*execution failed/i);
      await assertInterruptedStateClean(cwd, running.pid, containerName);
    },
    15_000,
  );

  test("a fresh-checkout 0755 runs directory is tightened before a valid run", async () => {
    const cwd = await temporaryDirectory("reynard-accept-checkout-runs-");
    const runs = join(cwd, "runs");
    await mkdir(runs, { mode: 0o755 });
    await writeFile(join(runs, ".gitkeep"), "");
    await chmod(runs, 0o755);

    const result = await runCli(cwd);

    expect(result.exitCode).toBe(0);
    expect((await stat(runs)).mode & 0o777).toBe(0o700);
    const names = (await readdir(runs)).sort();
    expect(names[0]).toBe(".gitkeep");
    expect(names[1]).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(names).toHaveLength(2);
    await assertBundle(join(runs, names[1] ?? "missing"), true);
  }, 20_000);

  test("artifact preflight rejects a writable runs directory before Docker", async () => {
    const cwd = await temporaryDirectory("reynard-accept-artifact-failure-");
    const runs = join(cwd, "runs");
    await mkdir(runs, { mode: 0o777 });
    await chmod(runs, 0o777);
    const sinceSeconds = Math.floor(Date.now() / 1_000) - 1;

    const result = await runCli(cwd);
    const createdNames = await labContainerCreateEvents(
      result.pid,
      sinceSeconds,
    );

    expect(result.exitCode).toBe(6);
    expect(result.stderr).toMatch(/artifact runs directory.*owner-only/i);
    expect(createdNames).toEqual([]);
    expect(await readdir(runs)).toEqual([]);
  }, 15_000);

  test("startup recovers stale Docker and artifact state before a valid run", async () => {
    const cwd = await temporaryDirectory("reynard-accept-recovery-");
    const runs = join(cwd, "runs");
    await mkdir(runs, { mode: 0o700 });
    await chmod(runs, 0o700);
    const staleLock = join(runs, `.sha256:${"a".repeat(64)}.publish-lock`);
    await writeFile(staleLock, JSON.stringify({
      schemaVersion: 1,
      pid: 999_999_999,
      token: "acceptance-stale",
      createdAtMillis: 0,
    }));
    const staleStaging = join(
      runs,
      `.${`sha256:${"b".repeat(64)}`}.staging-p999999999-00000000-0000-4000-8000-000000000006`,
    );
    await mkdir(staleStaging, { mode: 0o700 });
    await writeFile(join(staleStaging, "partial.tmp"), "interrupted");
    const containerName = `reynard-lab-v1-p999999999-acceptance-${process.pid}`;
    cleanupContainers.add(containerName);
    const created = await docker([
      "run",
      "--detach",
      "--name",
      containerName,
      "--pull=never",
      "--platform",
      "linux/amd64",
      "--entrypoint",
      "/usr/local/bin/node",
      IMAGE,
      "-e",
      "setInterval(() => {}, 1000)",
    ]);
    expect(created.exitCode).toBe(0);

    const result = await runCli(cwd);

    expect(result.exitCode).toBe(0);
    await expect(stat(staleLock)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(staleStaging)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await docker(["ps", "--all", "--quiet", "--filter", `name=^/${containerName}$`])).stdout.trim()).toBe("");
    cleanupContainers.delete(containerName);
    await assertBundle(await runDirectory(cwd), true);
  }, 25_000);

  test("an existing bundle never short-circuits a subsequent valid invocation", async () => {
    const cwd = await temporaryDirectory("reynard-accept-existing-");
    expect((await runCli(cwd)).exitCode).toBe(0);
    const directory = await runDirectory(cwd);
    const sinceSeconds = Math.floor(Date.now() / 1_000) - 1;

    const second = await runCli(cwd);
    const createdNames = await labContainerCreateEvents(
      second.pid,
      sinceSeconds,
    );
    const loadedCases = await loadEvaluationCases(CASES);
    if (!loadedCases.ok) throw new Error(loadedCases.error.message);

    expect(second.exitCode).toBe(0);
    expect(second.stdout).toContain("existing bundle validated");
    expect(createdNames).toHaveLength(loadedCases.value.cases.length * 2);
    expect(new Set(createdNames)).toHaveLength(createdNames.length);
    await assertBundle(directory, true);
  }, 30_000);
});
