import { execFile as execFileCallback } from "node:child_process";
import {
  chmod,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, test } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import {
  cleanupCandidateSnapshot,
  loadCandidateSnapshot,
  verifyCandidateSnapshot,
} from "../../src/candidate.js";
import { V1_INPUT_LIMITS } from "../../src/contracts.js";
import {
  createCandidateRequests,
  loadEvaluationCases,
} from "../../src/runner.js";

const temporaryDirectories: string[] = [];
const execFile = promisify(execFileCallback);

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

interface TestSourceEntry {
  readonly relativePath: string;
  readonly bytes: Uint8Array;
  readonly executableBits: number;
}

function digestForFiles(entries: readonly TestSourceEntry[]): `sha256:${string}` {
  return sha256(
    canonicalJson(
      [...entries]
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
        .map(({ relativePath, bytes, executableBits }) => ({
          relativePath,
          digest: sha256(bytes),
          executableBits,
        })),
    ),
  );
}

const IMMUTABLE_IMAGE = `busybox@sha256:${"a".repeat(64)}` as const;

async function writeDefinition(
  definitionPath: string,
  sourceRelativePath: string,
  digest: `sha256:${string}`,
): Promise<void> {
  await mkdir(dirname(definitionPath), { recursive: true });
  await writeFile(
    definitionPath,
    JSON.stringify({
      schemaVersion: 1,
      name: "fixture",
      image: IMMUTABLE_IMAGE,
      platform: "linux/arm64",
      entrypoint: ["/candidate/main.sh"],
      protocol: "jsonl-stdio",
      source: { relativePath: sourceRelativePath, digest },
    }),
  );
}

async function listFiles(root: string, directory = root): Promise<TestSourceEntry[]> {
  const files: TestSourceEntry[] = [];
  for (const name of await readdir(directory)) {
    const absolutePath = join(directory, name);
    const metadata = await lstat(absolutePath);
    if (metadata.isDirectory()) {
      files.push(...(await listFiles(root, absolutePath)));
    } else if (metadata.isFile()) {
      files.push({
        relativePath: relative(root, absolutePath).split(sep).join("/"),
        bytes: await readFile(absolutePath),
        executableBits: metadata.mode & 0o111,
      });
    }
  }
  return files;
}

describe("candidate loader", () => {
  test("copies a declared source tree into a verified private snapshot", async () => {
    const root = await temporaryDirectory("reynard-candidate-");
    const stagingRoot = join(root, "state", "staging");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const sourceBytes = Buffer.from("#!/bin/sh\nprintf '{\"ok\":true}\\n'\n");
    const sourceFile = join(sourceDirectory, "main.sh");
    await writeFile(sourceFile, sourceBytes);
    await chmod(sourceFile, 0o751);

    const definitionPath = join(root, "candidate", "candidate.json");
    await writeFile(
      definitionPath,
      JSON.stringify({
        schemaVersion: 1,
        name: "fixture",
        image: `busybox@sha256:${"a".repeat(64)}`,
        platform: "linux/arm64",
        entrypoint: ["/candidate/main.sh"],
        protocol: "jsonl-stdio",
        source: {
          relativePath: "src",
          digest: digestForFiles([
            {
              relativePath: "main.sh",
              bytes: sourceBytes,
              executableBits: 0o111 & 0o751,
            },
          ]),
        },
      }),
    );

    const loaded = await loadCandidateSnapshot(definitionPath, { stagingRoot });

    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.sourcePath).toBe(sourceDirectory);
    expect(loaded.value.snapshotPath).not.toBe(sourceDirectory);
    expect(await readFile(join(loaded.value.snapshotPath, "main.sh"))).toEqual(
      sourceBytes,
    );
    expect((await stat(join(loaded.value.snapshotPath, "main.sh"))).mode & 0o111).toBe(
      0o111 & 0o751,
    );
    expect((await stat(join(loaded.value.snapshotPath, "main.sh"))).mode & 0o444).toBe(
      0o444,
    );
    expect((await stat(stagingRoot)).mode & 0o077).toBe(0);
    expect((await stat(loaded.value.snapshotPath)).mode & 0o555).toBe(0o555);

    await cleanupCandidateSnapshot(loaded.value);
    await expect(stat(loaded.value.snapshotPath)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  test("tightens an existing staging root before creating a snapshot", async () => {
    const root = await temporaryDirectory("reynard-staging-mode-");
    const sourceDirectory = join(root, "candidate", "src");
    const stagingRoot = join(root, "state", "staging");
    await mkdir(sourceDirectory, { recursive: true });
    await mkdir(stagingRoot, { recursive: true, mode: 0o777 });
    await chmod(stagingRoot, 0o777);
    const bytes = Buffer.from("safe");
    await writeFile(join(sourceDirectory, "main.sh"), bytes);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([{ relativePath: "main.sh", bytes, executableBits: 0 }]),
    );

    const loaded = await loadCandidateSnapshot(definitionPath, { stagingRoot });

    expect(loaded.ok).toBe(true);
    expect((await stat(stagingRoot)).mode & 0o077).toBe(0);
    if (loaded.ok) await cleanupCandidateSnapshot(loaded.value);
  });

  test("rejects a symlinked staging root", async () => {
    const root = await temporaryDirectory("reynard-staging-link-");
    const sourceDirectory = join(root, "candidate", "src");
    const realStagingRoot = join(root, "real-staging");
    const stagingRoot = join(root, "state", "staging");
    await mkdir(sourceDirectory, { recursive: true });
    await mkdir(dirname(stagingRoot), { recursive: true });
    await mkdir(realStagingRoot, { recursive: true });
    await symlink(realStagingRoot, stagingRoot);
    const bytes = Buffer.from("safe");
    await writeFile(join(sourceDirectory, "main.sh"), bytes);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([{ relativePath: "main.sh", bytes, executableBits: 0 }]),
    );

    const loaded = await loadCandidateSnapshot(definitionPath, { stagingRoot });

    expect(loaded).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
    expect(await readdir(realStagingRoot)).toEqual([]);
  });

  test.each(["absolute", "traversal"])(
    "rejects a %s source path before staging",
    async (pathKind) => {
      const root = await temporaryDirectory("reynard-path-");
      const definitionDirectory = join(root, "candidate");
      const outsideSource = join(root, "outside");
      const stagingRoot = join(root, "state", "staging");
      await mkdir(outsideSource, { recursive: true });
      const bytes = Buffer.from("safe");
      await writeFile(join(outsideSource, "main.sh"), bytes);
      const definitionPath = join(definitionDirectory, "candidate.json");
      await writeDefinition(
        definitionPath,
        pathKind === "absolute" ? outsideSource : "../outside",
        digestForFiles([
          { relativePath: "main.sh", bytes, executableBits: 0 },
        ]),
      );

      const result = await loadCandidateSnapshot(definitionPath, { stagingRoot });

      expect(result).toEqual({
        ok: false,
        error: expect.objectContaining({ _tag: "InvalidInput" }),
      });
      await expect(readdir(stagingRoot)).rejects.toMatchObject({ code: "ENOENT" });
    },
  );

  test("rejects a symlinked candidate definition", async () => {
    const root = await temporaryDirectory("reynard-definition-link-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const bytes = Buffer.from("safe");
    await writeFile(join(sourceDirectory, "main.sh"), bytes);
    const realDefinition = join(root, "candidate", "real.json");
    await writeDefinition(
      realDefinition,
      "src",
      digestForFiles([{ relativePath: "main.sh", bytes, executableBits: 0 }]),
    );
    const linkedDefinition = join(root, "candidate", "linked.json");
    await symlink(realDefinition, linkedDefinition);

    const result = await loadCandidateSnapshot(linkedDefinition, {
      stagingRoot: join(root, "state", "staging"),
    });

    expect(result.ok).toBe(false);
    if (result.ok) await cleanupCandidateSnapshot(result.value);
  });

  test.each(["root", "directory", "file"])(
    "rejects a %s source symlink",
    async (symlinkKind) => {
      const root = await temporaryDirectory("reynard-source-link-");
      const candidateDirectory = join(root, "candidate");
      const realSource = join(root, "real-source");
      await mkdir(join(realSource, "nested"), { recursive: true });
      const bytes = Buffer.from("safe");
      await writeFile(join(realSource, "main.sh"), bytes);
      await writeFile(join(realSource, "nested", "nested.sh"), bytes);
      let sourceRelativePath = "src";
      const sourceDirectory = join(candidateDirectory, "src");
      await mkdir(sourceDirectory, { recursive: true });
      if (symlinkKind === "root") {
        await rm(sourceDirectory, { recursive: true });
        await symlink(realSource, sourceDirectory);
      } else if (symlinkKind === "directory") {
        await symlink(join(realSource, "nested"), join(sourceDirectory, "nested"));
      } else {
        await symlink(join(realSource, "main.sh"), join(sourceDirectory, "main.sh"));
      }
      if (symlinkKind !== "root") sourceRelativePath = "src";
      const digest = digestForFiles(await listFiles(realSource));
      const definitionPath = join(candidateDirectory, "candidate.json");
      await writeDefinition(definitionPath, sourceRelativePath, digest);

      const result = await loadCandidateSnapshot(definitionPath, {
        stagingRoot: join(root, "state", "staging"),
      });

      expect(result.ok).toBe(false);
      if (result.ok) await cleanupCandidateSnapshot(result.value);
    },
  );

  test("rejects a symlink in an intermediate source.relativePath component", async () => {
    const root = await temporaryDirectory("reynard-intermediate-link-");
    const candidateDirectory = join(root, "candidate");
    const escapedSource = join(root, "outside", "child");
    await mkdir(candidateDirectory, { recursive: true });
    await mkdir(escapedSource, { recursive: true });
    const bytes = Buffer.from("escaped");
    await writeFile(join(escapedSource, "main.sh"), bytes);
    await symlink(join(root, "outside"), join(candidateDirectory, "link"));
    const definitionPath = join(candidateDirectory, "candidate.json");
    await writeDefinition(
      definitionPath,
      "link/child",
      digestForFiles([{ relativePath: "main.sh", bytes, executableBits: 0 }]),
    );

    const result = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "state", "staging"),
    });

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
  });

  test("rejects a non-regular source entry", async () => {
    const root = await temporaryDirectory("reynard-special-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    await execFile("/usr/bin/mkfifo", [join(sourceDirectory, "named-pipe")]);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      sha256(canonicalJson([])),
    );

    const result = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "state", "staging"),
    });

    expect(result.ok).toBe(false);
  });

  test.each(["bytes", "relative path", "execution bits"])(
    "rejects source %s changed after its digest was declared",
    async (mutation) => {
      const root = await temporaryDirectory("reynard-source-change-");
      const sourceDirectory = join(root, "candidate", "src");
      await mkdir(sourceDirectory, { recursive: true });
      const originalBytes = Buffer.from("original");
      const originalPath = join(sourceDirectory, "main.sh");
      await writeFile(originalPath, originalBytes);
      await chmod(originalPath, 0o700);
      const declaredDigest = digestForFiles([
        {
          relativePath: "main.sh",
          bytes: originalBytes,
          executableBits: 0o100,
        },
      ]);
      const definitionPath = join(root, "candidate", "candidate.json");
      await writeDefinition(definitionPath, "src", declaredDigest);
      if (mutation === "bytes") await writeFile(originalPath, "changed");
      if (mutation === "relative path") {
        await rename(originalPath, join(sourceDirectory, "renamed.sh"));
      }
      if (mutation === "execution bits") await chmod(originalPath, 0o600);

      const result = await loadCandidateSnapshot(definitionPath, {
        stagingRoot: join(root, "state", "staging"),
      });

      expect(result.ok).toBe(false);
    },
  );

  test("hashes source entries in one global normalized POSIX path order", async () => {
    const root = await temporaryDirectory("reynard-global-source-order-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(join(sourceDirectory, "a"), { recursive: true });
    const nestedBytes = Buffer.from("nested");
    const rootBytes = Buffer.from("root");
    await writeFile(join(sourceDirectory, "a", "z"), nestedBytes);
    await writeFile(join(sourceDirectory, "a.txt"), rootBytes);
    const globallySortedDigest = sha256(
      canonicalJson([
        {
          relativePath: "a.txt",
          digest: sha256(rootBytes),
          executableBits: 0,
        },
        {
          relativePath: "a/z",
          digest: sha256(nestedBytes),
          executableBits: 0,
        },
      ]),
    );
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(definitionPath, "src", globallySortedDigest);

    const result = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "state", "staging"),
    });

    expect(result.ok).toBe(true);
    if (result.ok) await cleanupCandidateSnapshot(result.value);
  });

  test("accepts the candidate-definition byte limit and rejects one byte over", async () => {
    const root = await temporaryDirectory("reynard-definition-limit-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const bytes = Buffer.from("safe");
    await writeFile(join(sourceDirectory, "main.sh"), bytes);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([{ relativePath: "main.sh", bytes, executableBits: 0 }]),
    );
    const definition = await readFile(definitionPath);
    expect(definition.byteLength).toBeLessThan(V1_INPUT_LIMITS.candidateDefinitionBytes);
    const atLimit = Buffer.concat([
      definition,
      Buffer.alloc(V1_INPUT_LIMITS.candidateDefinitionBytes - definition.byteLength, 0x20),
    ]);
    await writeFile(definitionPath, atLimit);

    const accepted = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "accepted-staging"),
    });

    expect(accepted.ok).toBe(true);
    if (accepted.ok) await cleanupCandidateSnapshot(accepted.value);
    await writeFile(definitionPath, Buffer.concat([atLimit, Buffer.from(" ")]));

    const rejected = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "rejected-staging"),
    });

    expect(rejected.ok).toBe(false);
    if (rejected.ok) await cleanupCandidateSnapshot(rejected.value);
  });

  test("accepts the source-file count limit and rejects one file over", async () => {
    const root = await temporaryDirectory("reynard-count-limit-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const entries: TestSourceEntry[] = [];
    for (let index = 0; index < V1_INPUT_LIMITS.sourceFileCount; index += 1) {
      const relativePath = `file-${String(index).padStart(3, "0")}`;
      const bytes = Buffer.from([index]);
      await writeFile(join(sourceDirectory, relativePath), bytes);
      entries.push({ relativePath, bytes, executableBits: 0 });
    }
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(definitionPath, "src", digestForFiles(entries));

    const accepted = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "accepted-staging"),
    });

    expect(accepted.ok).toBe(true);
    if (accepted.ok) await cleanupCandidateSnapshot(accepted.value);
    const extraEntry = {
      relativePath: "file-extra",
      bytes: Buffer.from("x"),
      executableBits: 0,
    };
    await writeFile(join(sourceDirectory, extraEntry.relativePath), extraEntry.bytes);
    entries.push(extraEntry);
    await writeDefinition(definitionPath, "src", digestForFiles(entries));

    const rejected = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "rejected-staging"),
    });

    expect(rejected.ok).toBe(false);
    if (rejected.ok) await cleanupCandidateSnapshot(rejected.value);
  });

  test("accepts the per-file byte limit and rejects one byte over", async () => {
    const root = await temporaryDirectory("reynard-file-limit-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const atLimit = Buffer.alloc(V1_INPUT_LIMITS.sourceFileBytes, 0x61);
    const sourceFile = join(sourceDirectory, "payload");
    await writeFile(sourceFile, atLimit);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([
        { relativePath: "payload", bytes: atLimit, executableBits: 0 },
      ]),
    );

    const accepted = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "accepted-staging"),
    });

    expect(accepted.ok).toBe(true);
    if (accepted.ok) await cleanupCandidateSnapshot(accepted.value);
    const overLimit = Buffer.concat([atLimit, Buffer.from("x")]);
    await writeFile(sourceFile, overLimit);
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([
        { relativePath: "payload", bytes: overLimit, executableBits: 0 },
      ]),
    );

    const rejected = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "rejected-staging"),
    });

    expect(rejected.ok).toBe(false);
    if (rejected.ok) await cleanupCandidateSnapshot(rejected.value);
  });

  test("accepts the aggregate source byte limit and rejects one byte over", async () => {
    const root = await temporaryDirectory("reynard-total-limit-");
    const sourceDirectory = join(root, "candidate", "src");
    await mkdir(sourceDirectory, { recursive: true });
    const entries: TestSourceEntry[] = [];
    for (let index = 0; index < 4; index += 1) {
      const relativePath = `part-${index}`;
      const bytes = Buffer.alloc(V1_INPUT_LIMITS.sourceFileBytes, index);
      await writeFile(join(sourceDirectory, relativePath), bytes);
      entries.push({ relativePath, bytes, executableBits: 0 });
    }
    expect(entries.reduce((sum, entry) => sum + entry.bytes.byteLength, 0)).toBe(
      V1_INPUT_LIMITS.sourceTotalBytes,
    );
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(definitionPath, "src", digestForFiles(entries));

    const accepted = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "accepted-staging"),
    });

    expect(accepted.ok).toBe(true);
    if (accepted.ok) await cleanupCandidateSnapshot(accepted.value);
    const extraEntry = {
      relativePath: "extra",
      bytes: Buffer.from("x"),
      executableBits: 0,
    };
    await writeFile(join(sourceDirectory, extraEntry.relativePath), extraEntry.bytes);
    entries.push(extraEntry);
    await writeDefinition(definitionPath, "src", digestForFiles(entries));

    const rejected = await loadCandidateSnapshot(definitionPath, {
      stagingRoot: join(root, "rejected-staging"),
    });

    expect(rejected.ok).toBe(false);
    if (rejected.ok) await cleanupCandidateSnapshot(rejected.value);
  });

  test.each(["bytes", "relative path", "execution bits"])(
    "rejects snapshot %s mutated between validation and execution",
    async (mutation) => {
      const root = await temporaryDirectory("reynard-snapshot-mutation-");
      const sourceDirectory = join(root, "candidate", "src");
      await mkdir(sourceDirectory, { recursive: true });
      const bytes = Buffer.from("verified");
      const sourceFile = join(sourceDirectory, "main.sh");
      await writeFile(sourceFile, bytes);
      await chmod(sourceFile, 0o700);
      const definitionPath = join(root, "candidate", "candidate.json");
      await writeDefinition(
        definitionPath,
        "src",
        digestForFiles([
          {
            relativePath: "main.sh",
            bytes,
            executableBits: 0o100,
          },
        ]),
      );
      const loaded = await loadCandidateSnapshot(definitionPath, {
        stagingRoot: join(root, "staging"),
      });
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;
      const snapshotFile = join(loaded.value.snapshotPath, "main.sh");
      if (mutation === "bytes") await writeFile(snapshotFile, "mutated");
      if (mutation === "relative path") {
        await rename(snapshotFile, join(loaded.value.snapshotPath, "renamed.sh"));
      }
      if (mutation === "execution bits") await chmod(snapshotFile, 0o600);

      const verified = await verifyCandidateSnapshot(loaded.value);

      expect(verified).toEqual({
        ok: false,
        error: expect.objectContaining({ _tag: "InvalidInput" }),
      });
      await cleanupCandidateSnapshot(loaded.value);
    },
  );

  test("fails closed and cleans staging when source mutates during snapshot creation", async () => {
    const root = await temporaryDirectory("reynard-source-race-");
    const sourceDirectory = join(root, "candidate", "src");
    const stagingRoot = join(root, "state", "staging");
    await mkdir(sourceDirectory, { recursive: true });
    await mkdir(stagingRoot, { recursive: true });
    const originalBytes = Buffer.alloc(V1_INPUT_LIMITS.sourceFileBytes, 0x61);
    const sourceFile = join(sourceDirectory, "payload");
    await writeFile(sourceFile, originalBytes);
    const definitionPath = join(root, "candidate", "candidate.json");
    await writeDefinition(
      definitionPath,
      "src",
      digestForFiles([
        {
          relativePath: "payload",
          bytes: originalBytes,
          executableBits: 0,
        },
      ]),
    );
    const mutateWhenStagingStarts = (async () => {
      for (;;) {
        if ((await readdir(stagingRoot)).length > 0) break;
        await new Promise<void>((resolveImmediate) => setImmediate(resolveImmediate));
      }
      await writeFile(sourceFile, Buffer.alloc(originalBytes.byteLength, 0x62));
    })();

    const result = await loadCandidateSnapshot(definitionPath, { stagingRoot });
    await mutateWhenStagingStarts;

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ _tag: "InvalidInput" }),
    });
    expect(await readdir(stagingRoot)).toEqual([]);
  });
});

describe("case loader", () => {
  test("accepts the case-file byte limit and rejects one byte over", async () => {
    const root = await temporaryDirectory("reynard-case-file-limit-");
    const casesPath = join(root, "cases.json");
    const base = Buffer.from(
      JSON.stringify([{ id: "case-1", input: { value: 1 }, expected: 2 }]),
    );
    const atLimit = Buffer.concat([
      base,
      Buffer.alloc(V1_INPUT_LIMITS.caseFileBytes - base.byteLength, 0x20),
    ]);
    await writeFile(casesPath, atLimit);

    const accepted = await loadEvaluationCases(casesPath);

    expect(accepted.ok).toBe(true);
    await writeFile(casesPath, Buffer.concat([atLimit, Buffer.from(" ")]));

    const rejected = await loadEvaluationCases(casesPath);

    expect(rejected.ok).toBe(false);
  });

  test("accepts the case-count limit and rejects one case over", async () => {
    const root = await temporaryDirectory("reynard-case-count-");
    const casesPath = join(root, "cases.json");
    const cases = Array.from({ length: V1_INPUT_LIMITS.caseCount }, (_, index) => ({
      id: `case-${index}`,
      input: index,
      expected: index,
    }));
    await writeFile(casesPath, JSON.stringify(cases));

    const accepted = await loadEvaluationCases(casesPath);

    expect(accepted.ok).toBe(true);
    cases.push({ id: "case-extra", input: 0, expected: 0 });
    await writeFile(casesPath, JSON.stringify(cases));

    const rejected = await loadEvaluationCases(casesPath);

    expect(rejected.ok).toBe(false);
  });

  test("accepts the per-case byte limit and rejects one byte over", async () => {
    const root = await temporaryDirectory("reynard-case-size-");
    const casesPath = join(root, "cases.json");
    const baseCase = { id: "case-1", input: "", expected: null };
    const baseBytes = Buffer.byteLength(canonicalJson(baseCase));
    const atLimitCase = {
      ...baseCase,
      input: "x".repeat(V1_INPUT_LIMITS.caseBytes - baseBytes),
    };
    expect(Buffer.byteLength(canonicalJson(atLimitCase))).toBe(
      V1_INPUT_LIMITS.caseBytes,
    );
    await writeFile(casesPath, JSON.stringify([atLimitCase]));

    const accepted = await loadEvaluationCases(casesPath);

    expect(accepted.ok).toBe(true);
    await writeFile(
      casesPath,
      JSON.stringify([{ ...atLimitCase, input: `${atLimitCase.input}x` }]),
    );

    const rejected = await loadEvaluationCases(casesPath);

    expect(rejected.ok).toBe(false);
  });

  test("retains the single-read bytes, digest, cases, and requests after the file mutates", async () => {
    const root = await temporaryDirectory("reynard-case-snapshot-");
    const casesPath = join(root, "cases.json");
    const originalBytes = Buffer.from(
      JSON.stringify([
        {
          id: "original",
          input: { prompt: "safe" },
          expected: { private: "golden" },
        },
      ]),
    );
    await writeFile(casesPath, originalBytes);
    const loaded = await loadEvaluationCases(casesPath);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    await writeFile(
      casesPath,
      JSON.stringify([{ id: "mutated", input: "bad", expected: "bad" }]),
    );

    const requests = createCandidateRequests(loaded.value.cases, 42);

    expect(loaded.value.digest).toBe(sha256(originalBytes));
    expect(loaded.value.cases).toEqual([
      {
        id: "original",
        input: { prompt: "safe" },
        expected: { private: "golden" },
      },
    ]);
    expect(requests).toEqual({
      ok: true,
      value: [
        {
          schemaVersion: 1,
          caseId: "original",
          seed: 42,
          input: { prompt: "safe" },
        },
      ],
    });
    expect(JSON.stringify(requests)).not.toContain("golden");
    expect(JSON.stringify(requests)).not.toContain("mutated");
  });
});
