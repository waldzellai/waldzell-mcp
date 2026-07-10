import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import {
  defaultLabStateRoot,
  loadCandidateSnapshot,
} from "../../src/candidate.js";
import {
  V1_SANDBOX_POLICY,
  type CandidateDefinition,
  type ResolvedCandidate,
} from "../../src/contracts.js";
import { createCandidateRequests } from "../../src/runner.js";
import {
  DockerSandbox,
  type ProcessExecutor,
  type ProcessInvocation,
  type ProcessOutcome,
} from "../../src/sandbox/docker.js";

const IMAGE_REFERENCE =
  `busybox@sha256:${"a".repeat(64)}` as CandidateDefinition["image"];
const IMAGE_ID = `sha256:${"b".repeat(64)}` as const;
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

function successfulOutcome(
  overrides: Partial<ProcessOutcome> = {},
): ProcessOutcome {
  return {
    exitCode: 0,
    signal: null,
    stdout: "",
    stderr: "",
    timedOut: false,
    stdoutOverflow: false,
    stderrOverflow: false,
    durationMillis: 1,
    ...overrides,
  };
}

class RecordingExecutor implements ProcessExecutor {
  readonly invocations: ProcessInvocation[] = [];

  constructor(
    private readonly respond: (
      invocation: ProcessInvocation,
    ) => Promise<ProcessOutcome> | ProcessOutcome = defaultResponse,
  ) {}

  async execute(invocation: ProcessInvocation): Promise<ProcessOutcome> {
    this.invocations.push(invocation);
    return this.respond(invocation);
  }
}

function defaultResponse(invocation: ProcessInvocation): ProcessOutcome {
  if (invocation.args[0] === "version") {
    return successfulOutcome({ stdout: "27.0.0\n" });
  }
  if (invocation.args[0] === "image") {
    return successfulOutcome({
      stdout: JSON.stringify([
        {
          Id: IMAGE_ID,
          Os: "linux",
          Architecture: "arm64",
          RepoDigests: [IMAGE_REFERENCE],
        },
      ]),
    });
  }
  if (invocation.args[0] === "ps") {
    return successfulOutcome();
  }
  if (invocation.args[0] === "run") {
    return successfulOutcome({ stdout: '{"ok":true}\n' });
  }
  return successfulOutcome();
}

function candidateDefinition(
  overrides: Partial<CandidateDefinition> = {},
): CandidateDefinition {
  return {
    schemaVersion: 1,
    name: "fixture",
    image: IMAGE_REFERENCE,
    platform: "linux/arm64",
    entrypoint: ["/candidate/main.sh"],
    protocol: "jsonl-stdio",
    source: {
      relativePath: "src",
      digest: `sha256:${"c".repeat(64)}`,
    },
    ...overrides,
  };
}

async function makeCandidate(
  root: string,
  entrypoint: readonly string[] = ["/candidate/main.sh", "--literal"],
): Promise<ResolvedCandidate> {
  const sourceDirectory = join(root, "candidate", "src");
  await mkdir(sourceDirectory, { recursive: true });
  const bytes = Buffer.from("#!/bin/sh\nexit 0\n");
  const sourceFile = join(sourceDirectory, "main.sh");
  await writeFile(sourceFile, bytes);
  await chmod(sourceFile, 0o700);
  const digest = sha256(
    canonicalJson([
      {
        relativePath: "main.sh",
        digest: sha256(bytes),
        executableBits: 0o100,
      },
    ]),
  );
  const definitionPath = join(root, "candidate", "candidate.json");
  await writeFile(
    definitionPath,
    JSON.stringify({
      schemaVersion: 1,
      name: "fixture",
      image: IMAGE_REFERENCE,
      platform: "linux/arm64",
      entrypoint,
      protocol: "jsonl-stdio",
      source: { relativePath: "src", digest },
    }),
  );
  const snapshot = await loadCandidateSnapshot(definitionPath, {
    stagingRoot: join(root, "state", "staging"),
  });
  if (!snapshot.ok) throw new Error(snapshot.error.message);
  return {
    definition: snapshot.value.definition,
    definitionPath: snapshot.value.definitionPath,
    sourcePath: snapshot.value.sourcePath,
    snapshotPath: snapshot.value.snapshotPath,
    image: {
      reference: IMAGE_REFERENCE,
      imageId: IMAGE_ID,
      os: "linux",
      architecture: "arm64",
      platform: "linux/arm64",
    },
  };
}

describe("locked-down Docker runner", () => {
  test("passes the complete immutable policy as one exact Docker argument vector", async () => {
    const root = await temporaryDirectory("reynard-docker-args-");
    const stateRoot = join(root, "state");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executable: "/usr/local/bin/docker",
      executor,
      stateRoot,
      ownerPid: 42_424,
      uniqueId: () => "unit-1",
      isProcessAlive: () => true,
    });
    const request = {
      schemaVersion: 1 as const,
      caseId: "case-1",
      seed: 7,
      input: { prompt: "hello" },
    };

    const result = await sandbox.run(candidate, [request], V1_SANDBOX_POLICY);

    expect(result.ok).toBe(true);
    const invocation = executor.invocations.find(({ args }) => args[0] === "run");
    expect(invocation).toBeDefined();
    const containerName = "reynard-lab-v1-p42424-unit-1";
    const cidfile = join(stateRoot, "cidfiles", `${containerName}.cid`);
    expect(invocation?.args).toEqual([
      "run",
      "--name",
      containerName,
      "--cidfile",
      cidfile,
      "--pull=never",
      "--rm",
      "--interactive",
      "--platform",
      "linux/arm64",
      "--network=none",
      "--read-only",
      "--user",
      "65532:65532",
      "--cpus",
      "1",
      "--memory",
      "256m",
      "--pids-limit",
      "64",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--workdir",
      "/candidate",
      "--mount",
      `type=bind,src=${candidate.snapshotPath},dst=/candidate,readonly`,
      "--tmpfs",
      "/tmp:rw,nosuid,nodev,noexec,size=16m,uid=65532,gid=65532",
      "--entrypoint",
      "/candidate/main.sh",
      IMAGE_REFERENCE,
      "--literal",
    ]);
    expect(invocation).toMatchObject({
      executable: "/usr/local/bin/docker",
      env: { DOCKER_HOST: "unix:///var/run/docker.sock" },
      shell: false,
      stdin: `${JSON.stringify(request)}\n`,
      timeoutMillis: V1_SANDBOX_POLICY.timeoutMillis,
      stdoutBytesLimit: V1_SANDBOX_POLICY.stdoutBytesLimit,
      stderrBytesLimit: V1_SANDBOX_POLICY.stderrBytesLimit,
      handleSignals: true,
    });
    expect(invocation?.args.join("\n")).not.toContain(candidate.sourcePath);
    await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("recovers stale state once across an explicit preflight and two runs", async () => {
    const root = await temporaryDirectory("reynard-single-recovery-");
    const baseline = await makeCandidate(join(root, "baseline"));
    const candidate = await makeCandidate(join(root, "candidate"));
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      isProcessAlive: () => true,
    });
    const request = {
      schemaVersion: 1 as const,
      caseId: "case-1",
      seed: 0,
      input: null,
    };

    const recovered = await sandbox.recoverStaleState();
    const baselineResult = await sandbox.run(
      baseline,
      [request],
      V1_SANDBOX_POLICY,
    );
    const candidateResult = await sandbox.run(
      candidate,
      [request],
      V1_SANDBOX_POLICY,
    );

    expect(recovered.ok).toBe(true);
    expect(baselineResult.ok).toBe(true);
    expect(candidateResult.ok).toBe(true);
    expect(
      executor.invocations.filter(
        ({ args }) =>
          args[0] === "ps" &&
          args[1] === "--all" &&
          args.includes("name=^/reynard-lab-v1-p"),
      ),
    ).toHaveLength(1);
  });

  test("passes hostile candidate strings as literal arguments without a shell", async () => {
    const root = await temporaryDirectory("reynard-docker-literal-");
    const sentinelPath = join(root, "host-command-ran");
    const hostileEntrypoint = [
      `/candidate/main.sh;touch ${sentinelPath}`,
      "argument with spaces",
      `$(touch ${sentinelPath})`,
      "*",
    ] as const;
    const candidate = await makeCandidate(root, hostileEntrypoint);
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      uniqueId: () => "literal",
      isProcessAlive: () => true,
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 1, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result.ok).toBe(true);
    const invocation = executor.invocations.find(({ args }) => args[0] === "run");
    expect(invocation?.shell).toBe(false);
    expect(invocation?.args.slice(-5)).toEqual([
      hostileEntrypoint[0],
      IMAGE_REFERENCE,
      ...hostileEntrypoint.slice(1),
    ]);
    await expect(readFile(sentinelPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("never crosses expected values through any Docker process boundary", async () => {
    const root = await temporaryDirectory("reynard-docker-expected-");
    const candidate = await makeCandidate(root);
    const sentinel = "EXPECTED-MUST-STAY-HOST-8a7b6c";
    const requests = createCandidateRequests(
      [
        {
          id: "case-1",
          input: { prompt: "visible" },
          expected: { sentinel },
        },
      ],
      9,
    );
    expect(requests.ok).toBe(true);
    if (!requests.ok) return;
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      uniqueId: () => "boundary",
      isProcessAlive: () => true,
    });

    const result = await sandbox.run(candidate, requests.value, V1_SANDBOX_POLICY);

    expect(result.ok).toBe(true);
    expect(JSON.stringify(executor.invocations)).not.toContain(sentinel);
    expect(JSON.stringify(result)).not.toContain(sentinel);
  });

  test("rejects mutable image tags before invoking Docker", async () => {
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({ executor });
    const mutable = {
      ...candidateDefinition(),
      image: "busybox:latest",
    } as unknown as CandidateDefinition;

    const result = await sandbox.resolveImage(mutable);

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
    expect(executor.invocations).toEqual([]);
  });

  test("maps an absent local image to SandboxUnavailable without pulling", async () => {
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "image"
        ? successfulOutcome({ exitCode: 1, stderr: "No such image" })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({ executor });

    const result = await sandbox.resolveImage(candidateDefinition());

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
    expect(executor.invocations).toHaveLength(1);
    expect(executor.invocations[0]?.args).toEqual([
      "image",
      "inspect",
      "--platform",
      "linux/arm64",
      IMAGE_REFERENCE,
    ]);
    expect(JSON.stringify(executor.invocations)).not.toContain("pull");
  });

  test("rejects a local image whose platform does not match the declaration", async () => {
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "image"
        ? successfulOutcome({
            stdout: JSON.stringify([
              {
                Id: IMAGE_ID,
                Os: "linux",
                Architecture: "amd64",
                RepoDigests: [IMAGE_REFERENCE],
              },
            ]),
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({ executor });

    const result = await sandbox.resolveImage(candidateDefinition());

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
  });

  test("rejects a multi-architecture image index instead of selecting implicitly", async () => {
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "image"
        ? successfulOutcome({
            stdout: JSON.stringify([
              {
                Id: IMAGE_ID,
                Os: "linux",
                Architecture: "arm64",
                Manifests: [
                  { Platform: { os: "linux", architecture: "arm64" } },
                  { Platform: { os: "linux", architecture: "amd64" } },
                ],
              },
            ]),
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({ executor });

    const result = await sandbox.resolveImage(candidateDefinition());

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
  });

  test("records the exact inspected platform-specific image identity", async () => {
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({ executor });

    const result = await sandbox.resolveImage(candidateDefinition());

    expect(result).toEqual({
      ok: true,
      value: {
        reference: IMAGE_REFERENCE,
        imageId: IMAGE_ID,
        os: "linux",
        architecture: "arm64",
        platform: "linux/arm64",
      },
    });
  });

  test("rejects Docker inspection that does not retain the declared repo digest", async () => {
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "image"
        ? successfulOutcome({
            stdout: JSON.stringify([
              {
                Id: IMAGE_ID,
                Os: "linux",
                Architecture: "arm64",
                RepoDigests: [`busybox@sha256:${"d".repeat(64)}`],
              },
            ]),
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({ executor });

    const result = await sandbox.resolveImage(candidateDefinition());

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
  });

  test("rejects a resolved image ID changed between loading and execution", async () => {
    const root = await temporaryDirectory("reynard-image-change-");
    const candidate = await makeCandidate(root);
    const changedImageId = `sha256:${"d".repeat(64)}`;
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "image"
        ? successfulOutcome({
            stdout: JSON.stringify([
              {
                Id: changedImageId,
                Os: "linux",
                Architecture: "arm64",
                RepoDigests: [IMAGE_REFERENCE],
              },
            ]),
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      isProcessAlive: () => true,
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
    expect(executor.invocations.some(({ args }) => args[0] === "run")).toBe(false);
    await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("preserves the cidfile when force-removal fails and recovers it on the next same-process run", async () => {
    const root = await temporaryDirectory("reynard-removal-recovery-");
    const candidate = await makeCandidate(root);
    const ownerPid = process.pid;
    const containerName = `reynard-lab-v1-p${ownerPid}-removal-failure`;
    const containerId = "9".repeat(64);
    let removalAllowed = false;
    let containerPresent = false;
    const executor = new RecordingExecutor(async (invocation) => {
      if (invocation.args[0] === "run") {
        const cidfile = invocation.args[invocation.args.indexOf("--cidfile") + 1];
        if (cidfile === undefined) throw new Error("missing cidfile argument");
        await writeFile(cidfile, `${containerId}\n`);
        containerPresent = true;
        return successfulOutcome({ exitCode: null, timedOut: true });
      }
      if (invocation.args[0] === "rm") {
        if (!removalAllowed) {
          return successfulOutcome({ exitCode: 1, stderr: "daemon busy" });
        }
        containerPresent = false;
        return successfulOutcome();
      }
      if (invocation.args[0] === "ps") {
        return successfulOutcome({
          stdout: containerPresent ? `${containerId}\t${containerName}\n` : "",
        });
      }
      return defaultResponse(invocation);
    });
    const stateRoot = join(root, "state");
    const sandbox = new DockerSandbox({
      executor,
      stateRoot,
      ownerPid,
      uniqueId: () => "removal-failure",
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ExecutionFailed" }),
    });
    const cidfile = join(stateRoot, "cidfiles", `${containerName}.cid`);
    expect((await stat(cidfile)).isFile()).toBe(true);
    removalAllowed = true;

    const recoverySandbox = new DockerSandbox({
      executor,
      stateRoot,
      ownerPid,
    });
    const recovered = await recoverySandbox.recoverStaleState();

    expect(recovered.ok).toBe(true);
    expect(containerPresent).toBe(false);
    await expect(stat(cidfile)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("maps a pre-start cidfile-directory failure to SandboxUnavailable", async () => {
    const root = await temporaryDirectory("reynard-prestart-state-");
    const candidate = await makeCandidate(root);
    const stateRoot = join(root, "not-a-directory");
    await writeFile(stateRoot, "occupied");
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({ executor, stateRoot });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
    expect(executor.invocations.some(({ args }) => args[0] === "run")).toBe(false);
    await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test.each([
    ["timeout", { exitCode: null, timedOut: true }],
    ["nonzero exit", { exitCode: 17 }],
    ["stdout overflow", { exitCode: null, stdoutOverflow: true }],
    ["stderr overflow", { exitCode: null, stderrOverflow: true }],
    ["SIGINT", { exitCode: null, signal: "SIGINT" as const }],
    ["SIGTERM", { exitCode: null, signal: "SIGTERM" as const }],
  ])(
    "force-removes by cid and cleans all state after %s",
    async (label, outcomeOverrides) => {
      const root = await temporaryDirectory("reynard-execution-failure-");
      const candidate = await makeCandidate(root);
      const containerId = "d".repeat(64);
      const executor = new RecordingExecutor(async (invocation) => {
        if (invocation.args[0] !== "run") return defaultResponse(invocation);
        const cidfileIndex = invocation.args.indexOf("--cidfile") + 1;
        const cidfile = invocation.args[cidfileIndex];
        if (cidfile === undefined) throw new Error("missing cidfile argument");
        await writeFile(cidfile, `${containerId}\n`);
        return successfulOutcome(outcomeOverrides);
      });
      const sandbox = new DockerSandbox({
        executor,
        stateRoot: join(root, "state"),
        uniqueId: () => "failure",
        isProcessAlive: () => true,
      });

      const result = await sandbox.run(
        candidate,
        [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
        V1_SANDBOX_POLICY,
      );

      expect(result).toEqual({
        ok: false,
        error: expect.objectContaining({ _tag: "ExecutionFailed" }),
      });
      expect(
        executor.invocations.some(
          ({ args }) =>
            args[0] === "rm" &&
            args[1] === "--force" &&
            args[2] === containerId,
        ),
      ).toBe(true);
      await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
        code: "ENOENT",
      });
      const cidfile = join(
        root,
        "state",
        "cidfiles",
        `reynard-lab-v1-p${process.pid}-failure.cid`,
      );
      await expect(stat(cidfile)).rejects.toMatchObject({ code: "ENOENT" });
    },
  );

  test.each([
    ["missing output", ""],
    ["invalid JSON", "not-json\n"],
    ["multiple values", "{}\n{}\n"],
    ["extra stdout", "{}\nextra"],
  ])(
    "captures %s for evaluator-owned protocol normalization",
    async (_label, stdout) => {
      const root = await temporaryDirectory("reynard-protocol-failure-");
      const candidate = await makeCandidate(root);
      const executor = new RecordingExecutor(async (invocation) => {
        if (invocation.args[0] !== "run") return defaultResponse(invocation);
        const cidfile = invocation.args[invocation.args.indexOf("--cidfile") + 1];
        if (cidfile === undefined) throw new Error("missing cidfile argument");
        await writeFile(cidfile, `${"e".repeat(64)}\n`);
        return successfulOutcome({ stdout });
      });
      const sandbox = new DockerSandbox({
        executor,
        stateRoot: join(root, "state"),
        uniqueId: () => "protocol",
        isProcessAlive: () => true,
      });

      const result = await sandbox.run(
        candidate,
        [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
        V1_SANDBOX_POLICY,
      );

      expect(result).toEqual({
        ok: true,
        value: [
          {
            caseId: "case-1",
            exitCode: 0,
            stdout,
            stderr: "",
            timedOut: false,
            durationMillis: 1,
          },
        ],
      });
      expect(
        executor.invocations.some(
          ({ args }) => args.join(" ") === `rm --force ${"e".repeat(64)}`,
        ),
      ).toBe(false);
      await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
        code: "ENOENT",
      });
    },
  );

  test("does not probe an already-removed container for protocol-invalid stdout", async () => {
    const root = await temporaryDirectory("reynard-protocol-absent-");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor(async (invocation) => {
      if (invocation.args[0] === "run") {
        const cidfile = invocation.args[invocation.args.indexOf("--cidfile") + 1];
        if (cidfile === undefined) throw new Error("missing cidfile argument");
        await writeFile(cidfile, `${"8".repeat(64)}\n`);
        return successfulOutcome({ stdout: "not-json\n" });
      }
      if (invocation.args[0] === "rm") {
        return successfulOutcome({
          exitCode: 1,
          stderr: "No such container",
        });
      }
      if (invocation.args[0] === "ps" && invocation.args.includes("--quiet")) {
        return successfulOutcome({ stdout: "" });
      }
      return defaultResponse(invocation);
    });
    const stateRoot = join(root, "state");
    const containerName = `reynard-lab-v1-p${process.pid}-already-absent`;
    const sandbox = new DockerSandbox({
      executor,
      stateRoot,
      uniqueId: () => "already-absent",
      isProcessAlive: () => true,
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: true,
      value: [
        {
          caseId: "case-1",
          exitCode: 0,
          stdout: "not-json\n",
          stderr: "",
          timedOut: false,
          durationMillis: 1,
        },
      ],
    });
    expect(
      executor.invocations.some(
        ({ args }) =>
          args[0] === "ps" &&
          args.includes("--quiet") &&
          args.includes(`name=^/${containerName}$`),
      ),
    ).toBe(false);
    await expect(
      stat(join(stateRoot, "cidfiles", `${containerName}.cid`)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("detects a snapshot mutation during execution, removes the container, and cleans staging", async () => {
    const root = await temporaryDirectory("reynard-runtime-mutation-");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor(async (invocation) => {
      if (invocation.args[0] !== "run") return defaultResponse(invocation);
      const cidfile = invocation.args[invocation.args.indexOf("--cidfile") + 1];
      if (cidfile === undefined) throw new Error("missing cidfile argument");
      await writeFile(cidfile, `${"f".repeat(64)}\n`);
      await writeFile(join(candidate.snapshotPath, "main.sh"), "mutated");
      return successfulOutcome({ stdout: "{}\n" });
    });
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      uniqueId: () => "mutation",
      isProcessAlive: () => true,
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
    expect(
      executor.invocations.some(
        ({ args }) => args.join(" ") === `rm --force ${"f".repeat(64)}`,
      ),
    ).toBe(true);
    await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("uses a distinct one-shot container and request for every case", async () => {
    const root = await temporaryDirectory("reynard-per-case-");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor();
    let ordinal = 0;
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
      uniqueId: () => `case-${ordinal++}`,
      isProcessAlive: () => true,
    });
    const requests = [
      { schemaVersion: 1 as const, caseId: "one", seed: 1, input: "first" },
      { schemaVersion: 1 as const, caseId: "two", seed: 1, input: "second" },
    ];

    const result = await sandbox.run(candidate, requests, V1_SANDBOX_POLICY);

    expect(result.ok).toBe(true);
    const runs = executor.invocations.filter(({ args }) => args[0] === "run");
    expect(runs).toHaveLength(2);
    expect(runs.map(({ args }) => args[args.indexOf("--name") + 1])).toEqual([
      `reynard-lab-v1-p${process.pid}-case-0`,
      `reynard-lab-v1-p${process.pid}-case-1`,
    ]);
    expect(runs.map(({ stdin }) => stdin)).toEqual(
      requests.map((request) => `${JSON.stringify(request)}\n`),
    );
  });

  test("maps a missing Docker executable to SandboxUnavailable before candidate execution", async () => {
    const root = await temporaryDirectory("reynard-missing-docker-");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "version"
        ? successfulOutcome({
            exitCode: null,
            spawnError: "spawn /missing/docker ENOENT",
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({
      executable: "/missing/docker",
      executor,
      stateRoot: join(root, "state"),
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
    expect(executor.invocations.some(({ args }) => args[0] === "run")).toBe(false);
    await expect(stat(candidate.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("rejects any caller-weakened policy before invoking Docker", async () => {
    const root = await temporaryDirectory("reynard-policy-change-");
    const candidate = await makeCandidate(root);
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executor,
      stateRoot: join(root, "state"),
    });

    const result = await sandbox.run(
      candidate,
      [{ schemaVersion: 1, caseId: "case-1", seed: 0, input: null }],
      { ...V1_SANDBOX_POLICY, network: "none", memoryMiB: 512 },
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
    expect(executor.invocations).toEqual([]);
  });

  test("next-run recovery removes only dead lab-namespaced containers and temporary state", async () => {
    const root = await temporaryDirectory("reynard-stale-recovery-");
    const stateRoot = join(root, "state");
    const staleName = "reynard-lab-v1-p999999-stale";
    const liveName = "reynard-lab-v1-p123-live";
    const staleStage = join(stateRoot, "staging", staleName);
    const liveStage = join(stateRoot, "staging", liveName);
    const unrelatedStage = join(stateRoot, "staging", "other-tool-state");
    const staleCidfile = join(stateRoot, "cidfiles", `${staleName}.cid`);
    const liveCidfile = join(stateRoot, "cidfiles", `${liveName}.cid`);
    const validatedBundle = join(stateRoot, "runs", "validated", "manifest.json");
    await mkdir(staleStage, { recursive: true });
    await mkdir(liveStage, { recursive: true });
    await mkdir(unrelatedStage, { recursive: true });
    await mkdir(join(stateRoot, "cidfiles"), { recursive: true });
    await mkdir(join(stateRoot, "runs", "validated"), { recursive: true });
    await writeFile(staleCidfile, `${"a".repeat(64)}\n`);
    await writeFile(liveCidfile, `${"b".repeat(64)}\n`);
    await writeFile(validatedBundle, "validated");
    const deadContainerId = "c".repeat(64);
    const liveContainerId = "d".repeat(64);
    const unrelatedContainerId = "e".repeat(64);
    const executor = new RecordingExecutor((invocation) =>
      invocation.args[0] === "ps"
        ? successfulOutcome({
            stdout: [
              `${deadContainerId}\t${staleName}`,
              `${liveContainerId}\t${liveName}`,
              `${unrelatedContainerId}\tunrelated-container`,
            ].join("\n"),
          })
        : defaultResponse(invocation),
    );
    const sandbox = new DockerSandbox({
      executor,
      stateRoot,
      ownerPid: 456,
      isProcessAlive: (pid) => pid === 123,
    });

    const result = await sandbox.recoverStaleState();

    expect(result.ok).toBe(true);
    expect(
      executor.invocations.some(
        ({ args }) => args.join(" ") === `rm --force ${deadContainerId}`,
      ),
    ).toBe(true);
    expect(
      executor.invocations.some(
        ({ args }) => args.includes(liveContainerId) || args.includes(unrelatedContainerId),
      ),
    ).toBe(false);
    await expect(stat(staleStage)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(staleCidfile)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await stat(liveStage)).isDirectory()).toBe(true);
    expect((await stat(liveCidfile)).isFile()).toBe(true);
    expect((await stat(unrelatedStage)).isDirectory()).toBe(true);
    expect(await readFile(validatedBundle, "utf8")).toBe("validated");
  });

  test("default recovery finds loader snapshots under Node tmpdir and preserves live, unrelated, and validated state", async () => {
    const root = await temporaryDirectory("reynard-default-state-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const bytes = Buffer.from("default-state");
    await writeFile(join(sourceDirectory, "main.sh"), bytes);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeFile(
      definitionPath,
      JSON.stringify({
        ...candidateDefinition(),
        source: {
          relativePath: "src",
          digest: sha256(
            canonicalJson([
              {
                relativePath: "main.sh",
                digest: sha256(bytes),
                executableBits: 0,
              },
            ]),
          ),
        },
      }),
    );
    const loaded = await loadCandidateSnapshot(definitionPath);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const stateRoot = defaultLabStateRoot();
    expect(stateRoot).toBe(join(tmpdir(), "reynard-lab-v1"));
    expect(loaded.value.snapshotPath.startsWith(join(stateRoot, "staging"))).toBe(
      true,
    );
    const suffix = basename(root).replaceAll(/[^A-Za-z0-9._-]/g, "-");
    const staleStage = join(
      stateRoot,
      "staging",
      `reynard-lab-v1-p2147483646-${suffix}`,
    );
    const liveStage = join(
      stateRoot,
      "staging",
      `reynard-lab-v1-p${process.pid}-${suffix}`,
    );
    const unrelatedStage = join(stateRoot, "staging", `other-${suffix}`);
    const validatedBundle = join(
      stateRoot,
      "runs",
      `validated-${suffix}`,
      "manifest.json",
    );
    await rename(loaded.value.snapshotPath, staleStage);
    await mkdir(liveStage, { recursive: true });
    await mkdir(unrelatedStage, { recursive: true });
    await mkdir(join(validatedBundle, ".."), { recursive: true });
    await writeFile(validatedBundle, "validated");
    const executor = new RecordingExecutor();
    const sandbox = new DockerSandbox({
      executor,
      ownerPid: process.pid,
      isProcessAlive: (pid) => pid === process.pid,
    });
    try {
      const recovered = await sandbox.recoverStaleState();

      expect(recovered.ok).toBe(true);
      await expect(stat(staleStage)).rejects.toMatchObject({ code: "ENOENT" });
      expect((await stat(liveStage)).isDirectory()).toBe(true);
      expect((await stat(unrelatedStage)).isDirectory()).toBe(true);
      expect(await readFile(validatedBundle, "utf8")).toBe("validated");
    } finally {
      await rm(staleStage, { recursive: true, force: true });
      await rm(liveStage, { recursive: true, force: true });
      await rm(unrelatedStage, { recursive: true, force: true });
      await rm(join(stateRoot, "runs", `validated-${suffix}`), {
        recursive: true,
        force: true,
      });
    }
  });
});
