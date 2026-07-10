import { execFile as execFileCallback } from "node:child_process";
import { chmod, mkdtemp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import { loadCandidateSnapshot } from "../../src/candidate.js";
import {
  V1_SANDBOX_POLICY,
  type CandidateDefinition,
  type ResolvedCandidate,
} from "../../src/contracts.js";
import { DockerSandbox } from "../../src/sandbox/docker.js";

const execFile = promisify(execFileCallback);
const DOCKER = "/usr/local/bin/docker";
const IMAGE =
  "busybox@sha256:73aaf090f3d85aa34ee199857f03fa3a95c8ede2ffd4cc2cdb5b94e566b11662" as CandidateDefinition["image"];
const IMAGE_ID =
  "sha256:b7c873bd97bdc9046fc894e0b216c8aef31e0db4c5b761fb53022e40577ab6c0" as const;
const PLATFORM = "linux/arm64" as const;
const temporaryDirectories: string[] = [];
let uniqueOrdinal = 0;

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

async function docker(args: readonly string[]): Promise<string> {
  const { stdout } = await execFile(DOCKER, [...args], {
    encoding: "utf8",
    maxBuffer: 1_048_576,
  });
  return stdout;
}

interface PreparedCandidate {
  readonly candidate: ResolvedCandidate;
  readonly sandbox: DockerSandbox;
  readonly stateRoot: string;
  readonly containerName: string;
}

async function prepareCandidate(
  root: string,
  script: string,
  testName: string,
): Promise<PreparedCandidate> {
  const sourceDirectory = join(root, "candidate", "src");
  await mkdir(sourceDirectory, { recursive: true });
  const bytes = Buffer.from(script);
  const sourceFile = join(sourceDirectory, "main.sh");
  await writeFile(sourceFile, bytes);
  await chmod(sourceFile, 0o755);
  const sourceDigest = sha256(
    canonicalJson([
      {
        relativePath: "main.sh",
        digest: sha256(bytes),
        executableBits: 0o111,
      },
    ]),
  );
  const definition: CandidateDefinition = {
    schemaVersion: 1,
    name: testName,
    image: IMAGE,
    platform: PLATFORM,
    entrypoint: ["/candidate/main.sh"],
    protocol: "jsonl-stdio",
    source: { relativePath: "src", digest: sourceDigest },
  };
  const definitionPath = join(root, "candidate", "candidate.json");
  await writeFile(definitionPath, JSON.stringify(definition));
  const stateRoot = join(root, "state");
  const snapshot = await loadCandidateSnapshot(definitionPath, {
    stagingRoot: join(stateRoot, "staging"),
  });
  if (!snapshot.ok) throw new Error(snapshot.error.message);
  const uniqueId = `${testName}-${uniqueOrdinal++}`;
  const sandbox = new DockerSandbox({
    executable: DOCKER,
    stateRoot,
    uniqueId: () => uniqueId,
  });
  const image = await sandbox.resolveImage(definition);
  if (!image.ok) throw new Error(image.error.message);
  expect(image.value).toEqual({
    reference: IMAGE,
    imageId: IMAGE_ID,
    os: "linux",
    architecture: "arm64",
    variant: "v8",
    platform: PLATFORM,
  });
  return {
    candidate: {
      definition,
      definitionPath: snapshot.value.definitionPath,
      sourcePath: snapshot.value.sourcePath,
      snapshotPath: snapshot.value.snapshotPath,
      image: image.value,
    },
    sandbox,
    stateRoot,
    containerName: `reynard-lab-v1-p${process.pid}-${uniqueId}`,
  };
}

async function expectNoRuntimeState(
  prepared: PreparedCandidate,
): Promise<void> {
  expect(
    (
      await docker([
        "ps",
        "--all",
        "--quiet",
        "--filter",
        `name=^/${prepared.containerName}$`,
      ])
    ).trim(),
  ).toBe("");
  await expect(stat(prepared.candidate.snapshotPath)).rejects.toMatchObject({
    code: "ENOENT",
  });
  await expect(
    stat(join(prepared.stateRoot, "cidfiles", `${prepared.containerName}.cid`)),
  ).rejects.toMatchObject({ code: "ENOENT" });
}

describe("real locked-down Docker runner", () => {
  test("reports a genuinely missing Docker executable without a host fallback", async () => {
    const sandbox = new DockerSandbox({
      executable: "/definitely/missing/reynard-docker",
    });

    const result = await sandbox.checkAvailability();

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "SandboxUnavailable" }),
    });
  });

  test("times out a real container and leaves no container, cidfile, or snapshot", async () => {
    const root = await temporaryDirectory("reynard-real-timeout-");
    const prepared = await prepareCandidate(
      root,
      "#!/bin/sh\nIFS= read -r request\nsleep 30\nprintf '{}\\n'\n",
      "timeout",
    );

    const result = await prepared.sandbox.run(
      prepared.candidate,
      [{ schemaVersion: 1, caseId: "timeout", seed: 1, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ExecutionFailed" }),
    });
    await expectNoRuntimeState(prepared);
  }, 20_000);

  test("maps a real nonzero candidate exit and removes its runtime state", async () => {
    const root = await temporaryDirectory("reynard-real-nonzero-");
    const prepared = await prepareCandidate(
      root,
      "#!/bin/sh\nIFS= read -r request\nexit 23\n",
      "nonzero",
    );

    const result = await prepared.sandbox.run(
      prepared.candidate,
      [{ schemaVersion: 1, caseId: "nonzero", seed: 1, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ExecutionFailed" }),
    });
    await expectNoRuntimeState(prepared);
  }, 15_000);

  test.each([
    ["invalid-json", "printf 'not-json\\n'", "not-json\n"],
    ["multiple-json", "printf '{}\\n{}\\n'", "{}\n{}\n"],
  ])(
    "captures real %s stdout for evaluator-owned protocol normalization",
    async (testName, outputCommand, stdout) => {
      const root = await temporaryDirectory(`reynard-real-${testName}-`);
      const prepared = await prepareCandidate(
        root,
        `#!/bin/sh\nIFS= read -r request\n${outputCommand}\n`,
        testName,
      );

      const result = await prepared.sandbox.run(
        prepared.candidate,
        [{ schemaVersion: 1, caseId: testName, seed: 1, input: null }],
        V1_SANDBOX_POLICY,
      );

      expect(result).toEqual({
        ok: true,
        value: [
          expect.objectContaining({
            caseId: testName,
            exitCode: 0,
            stdout,
            stderr: "",
            timedOut: false,
          }),
        ],
      });
      await expectNoRuntimeState(prepared);
    },
    15_000,
  );

  test("stops real stdout overflow at the policy boundary and cleans up", async () => {
    const root = await temporaryDirectory("reynard-real-overflow-");
    const prepared = await prepareCandidate(
      root,
      [
        "#!/bin/sh",
        "IFS= read -r request",
        "dd if=/dev/zero bs=65537 count=1 2>/dev/null | tr '\\000' x",
        "printf '\\n'",
      ].join("\n"),
      "overflow",
    );

    const result = await prepared.sandbox.run(
      prepared.candidate,
      [{ schemaVersion: 1, caseId: "overflow", seed: 1, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "ExecutionFailed" }),
    });
    await expectNoRuntimeState(prepared);
  }, 15_000);

  test("keeps the real root filesystem read-only while preserving bounded tmpfs writes", async () => {
    const root = await temporaryDirectory("reynard-real-readonly-");
    const prepared = await prepareCandidate(
      root,
      [
        "#!/bin/sh",
        "IFS= read -r request",
        "root_blocked=false",
        "tmp_writable=false",
        "touch /reynard-root-probe 2>/dev/null || root_blocked=true",
        "touch /tmp/reynard-tmp-probe 2>/dev/null && tmp_writable=true",
        "printf '{\"rootBlocked\":%s,\"tmpWritable\":%s}\\n' \"$root_blocked\" \"$tmp_writable\"",
      ].join("\n"),
      "readonly",
    );

    const result = await prepared.sandbox.run(
      prepared.candidate,
      [{ schemaVersion: 1, caseId: "readonly", seed: 1, input: null }],
      V1_SANDBOX_POLICY,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(JSON.parse(result.value[0]?.stdout ?? "null")).toEqual({
      rootBlocked: true,
      tmpWritable: true,
    });
    await expectNoRuntimeState(prepared);
  }, 15_000);

  test("reaches a test listener on a temporary network, then blocks it with production network=none", async () => {
    const root = await temporaryDirectory("reynard-real-network-");
    const suffix = `${process.pid}-${uniqueOrdinal++}`;
    const networkName = `reynard-test-network-${suffix}`;
    const listenerName = `reynard-test-listener-${suffix}`;
    await docker(["network", "create", networkName]);
    try {
      await docker([
        "run",
        "--detach",
        "--rm",
        "--pull=never",
        "--platform",
        PLATFORM,
        "--network",
        networkName,
        "--name",
        listenerName,
        IMAGE,
        "sh",
        "-c",
        "mkdir -p /www; printf ok >/www/index.html; exec httpd -f -p 8080 -h /www",
      ]);
      let positiveControl = "";
      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          positiveControl = await docker([
            "run",
            "--rm",
            "--pull=never",
            "--platform",
            PLATFORM,
            "--network",
            networkName,
            IMAGE,
            "wget",
            "-qO-",
            `http://${listenerName}:8080/`,
          ]);
          break;
        } catch {
          // The listener is test-owned and becomes ready without host sleeps.
        }
      }
      expect(positiveControl).toBe("ok");

      const prepared = await prepareCandidate(
        root,
        [
          "#!/bin/sh",
          "IFS= read -r request",
          `if wget -q -T 1 -O - http://${listenerName}:8080/ >/dev/null 2>&1; then`,
          "  printf '{\"networkBlocked\":false}\\n'",
          "else",
          "  printf '{\"networkBlocked\":true}\\n'",
          "fi",
        ].join("\n"),
        "network-none",
      );
      const result = await prepared.sandbox.run(
        prepared.candidate,
        [{ schemaVersion: 1, caseId: "network", seed: 1, input: null }],
        V1_SANDBOX_POLICY,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(JSON.parse(result.value[0]?.stdout ?? "null")).toEqual({
        networkBlocked: true,
      });
      await expectNoRuntimeState(prepared);
    } finally {
      await execFile(DOCKER, ["rm", "--force", listenerName]).catch(() => undefined);
      await execFile(DOCKER, ["network", "rm", networkName]).catch(() => undefined);
    }
  }, 30_000);
});
