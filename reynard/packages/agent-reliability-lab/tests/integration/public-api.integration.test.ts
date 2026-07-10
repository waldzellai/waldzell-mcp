import {
  mkdir,
  mkdtemp,
  rm,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { publicArtifactInput } from "../helpers/artifact-input.js";

type RootApi = typeof import("../../src/index.js");
type VariadicWrite = (
  input: Parameters<RootApi["writeArtifactBundle"]>[0],
  options: unknown,
) => ReturnType<RootApi["writeArtifactBundle"]>;
type VariadicRecovery = (
  runsDirectory: string,
  options: unknown,
) => ReturnType<RootApi["recoverArtifactPublishLocks"]>;
type VariadicDockerFactory = (
  options: unknown,
) => ReturnType<RootApi["createDockerSandbox"]>;

const temporaryDirectories: string[] = [];
let rootApi: RootApi;

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

beforeAll(async () => {
  const emittedRoot = new URL("../../dist/index.js", import.meta.url);
  rootApi = (await import(`${emittedRoot.href}?public-probe=${Date.now()}`)) as RootApi;
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("emitted package root", () => {
  test("keeps fault-injection exports absent while preserving safe exports", () => {
    for (const name of [
      "DockerSandbox",
      "dockerExecutableForPlatform",
      "recoverArtifactPublishLocksInternal",
      "writeArtifactBundleInternal",
    ]) {
      expect(name in rootApi).toBe(false);
    }
    for (const name of [
      "CandidateDefinitionSchema",
      "createDockerSandbox",
      "evaluateExecutions",
      "loadCandidateSnapshot",
      "readArtifactBundle",
      "recoverArtifactPublishLocks",
      "writeArtifactBundle",
    ]) {
      expect(name in rootApi).toBe(true);
    }
  });

  test("ignores a no-op artifact writer and really publishes", async () => {
    const root = await temporaryDirectory("reynard-emitted-write-");
    const runsDirectory = join(root, "runs");
    const input = publicArtifactInput(runsDirectory);
    let writeCalls = 0;
    const write = rootApi.writeArtifactBundle as unknown as VariadicWrite;

    const written = await write(input, {
      io: {
        writeFile: async () => {
          writeCalls += 1;
        },
      },
    });

    expect(writeCalls).toBe(0);
    expect(written).toEqual({
      ok: true,
      value: {
        directory: join(runsDirectory, input.manifest.runId),
        published: true,
      },
    });
    const validated = await rootApi.readArtifactBundle(
      join(runsDirectory, input.manifest.runId),
      input.loadedCases,
    );
    expect(validated.ok).toBe(true);
    await expect(
      stat(join(runsDirectory, `.${input.manifest.runId}.publish-lock`)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("ignores a no-op artifact reader and really publishes", async () => {
    const root = await temporaryDirectory("reynard-emitted-read-");
    const runsDirectory = join(root, "runs");
    const input = publicArtifactInput(runsDirectory);
    let readCalls = 0;
    const write = rootApi.writeArtifactBundle as unknown as VariadicWrite;

    const written = await write(input, {
      io: {
        readFile: async () => {
          readCalls += 1;
          return new Uint8Array();
        },
      },
    });

    expect(readCalls).toBe(0);
    expect(written.ok).toBe(true);
    expect(
      (
        await rootApi.readArtifactBundle(
          join(runsDirectory, input.manifest.runId),
          input.loadedCases,
        )
      ).ok,
    ).toBe(true);
  });

  test("ignores a no-op artifact rename and really publishes", async () => {
    const root = await temporaryDirectory("reynard-emitted-rename-");
    const runsDirectory = join(root, "runs");
    const input = publicArtifactInput(runsDirectory);
    let renameCalls = 0;
    const write = rootApi.writeArtifactBundle as unknown as VariadicWrite;

    const written = await write(input, {
      io: {
        rename: async () => {
          renameCalls += 1;
        },
      },
    });

    expect(renameCalls).toBe(0);
    expect(written.ok).toBe(true);
    expect(
      (
        await rootApi.readArtifactBundle(
          join(runsDirectory, input.manifest.runId),
          input.loadedCases,
        )
      ).ok,
    ).toBe(true);
  });

  test("ignores a no-op lock release and removes the real lock", async () => {
    const root = await temporaryDirectory("reynard-emitted-release-");
    const runsDirectory = join(root, "runs");
    const input = publicArtifactInput(runsDirectory);
    let releaseCalls = 0;
    const write = rootApi.writeArtifactBundle as unknown as VariadicWrite;

    const written = await write(input, {
      releasePublishLock: async () => {
        releaseCalls += 1;
      },
    });

    expect(releaseCalls).toBe(0);
    expect(written.ok).toBe(true);
    await expect(
      stat(join(runsDirectory, `.${input.manifest.runId}.publish-lock`)),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("ignores liveness and cleanup arguments while preserving live state", async () => {
    const root = await temporaryDirectory("reynard-emitted-recovery-");
    const runsDirectory = join(root, "runs");
    await mkdir(runsDirectory, { mode: 0o700 });
    const dead = join(
      runsDirectory,
      `.sha256:${"e".repeat(64)}.staging-p2147483647-00000000-0000-4000-8000-000000000005`,
    );
    const live = join(
      runsDirectory,
      `.sha256:${"f".repeat(64)}.staging-p${process.ppid}-00000000-0000-4000-8000-000000000006`,
    );
    await mkdir(dead, { mode: 0o700 });
    await mkdir(live, { mode: 0o700 });
    let livenessCalls = 0;
    let removalCalls = 0;
    const recover = rootApi.recoverArtifactPublishLocks as unknown as VariadicRecovery;

    const recovered = await recover(runsDirectory, {
      staleMalformedLockMillis: 1,
      isProcessAlive: () => {
        livenessCalls += 1;
        return false;
      },
      directoryOperations: {
        remove: async () => {
          removalCalls += 1;
        },
      },
    });

    expect(recovered).toEqual({ ok: true, value: 1 });
    expect(livenessCalls).toBe(0);
    expect(removalCalls).toBe(0);
    await expect(stat(dead)).rejects.toMatchObject({ code: "ENOENT" });
    expect((await stat(live)).isDirectory()).toBe(true);
  });

  test("ignores fake Docker construction arguments", () => {
    const reads: string[] = [];
    let executions = 0;
    const poison: Record<string, unknown> = {};
    const values: Record<string, unknown> = {
      executor: {
        execute: async () => {
          executions += 1;
          throw new Error("fake executor reached");
        },
      },
      isProcessAlive: () => false,
      ownerPid: 123,
      platform: process.platform,
      stateRoot: "/tmp/reynard-fake-state",
      uniqueId: () => "fixed",
    };
    for (const [name, value] of Object.entries(values)) {
      Object.defineProperty(poison, name, {
        enumerable: true,
        get: () => {
          reads.push(name);
          return value;
        },
      });
    }
    const create = rootApi.createDockerSandbox as unknown as VariadicDockerFactory;

    const created = create(poison);

    expect(created.ok).toBe(true);
    expect(reads).toEqual([]);
    expect(executions).toBe(0);
  });
});
