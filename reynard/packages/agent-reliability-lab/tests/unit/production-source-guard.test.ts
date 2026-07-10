import { spawn } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");
const GUARD = join(WORKSPACE_ROOT, "scripts", "guard-production-source.mjs");
const temporaryDirectories: string[] = [];

interface GuardResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "reynard-source-guard-"));
  temporaryDirectories.push(directory);
  return directory;
}

async function runGuard(sourceRoot?: string): Promise<GuardResult> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(
      process.execPath,
      sourceRoot === undefined ? [GUARD] : [GUARD, sourceRoot],
      {
        cwd: WORKSPACE_ROOT,
        env: { ...process.env },
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolveResult({
        exitCode,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

async function guardFixture(
  source: string,
  relativePath = "index.ts",
): Promise<GuardResult> {
  const root = await temporaryDirectory();
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, source);
  return runGuard(root);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("production-source guard", () => {
  test("accepts production source without host I/O escape hatches", async () => {
    const result = await guardFixture(
      'export function add(left: number, right: number): number { return left + right; }\n',
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
  });

  test.each([
    [
      "host network import",
      'import "node:https";\n',
      "index.ts",
      /host network import/i,
    ],
    [
      "unapproved bare network package",
      'import request from "node-fetch";\nvoid request;\n',
      "index.ts",
      /static host capability import/i,
    ],
    [
      "host evaluation import",
      'import { runInNewContext } from "node:vm";\nrunInNewContext("1 + 1");\n',
      "index.ts",
      /dynamic evaluation import/i,
    ],
    [
      "global fetch",
      'void fetch("https://example.invalid");\n',
      "index.ts",
      /global fetch/i,
    ],
    [
      "aliased global fetch",
      [
        "const requestFromHost = fetch;",
        'void requestFromHost("https://example.invalid");',
      ].join("\n"),
      "index.ts",
      /global fetch/i,
    ],
    [
      "computed global fetch",
      'void globalThis["fetch"]("https://example.invalid");\n',
      "index.ts",
      /global fetch/i,
    ],
    [
      "dynamic import",
      'void import("./plugin.js");\n',
      "index.ts",
      /dynamic import/i,
    ],
    [
      "computed builtin module loader",
      [
        'const loadBuiltin = process["getBuiltinModule"];',
        'void loadBuiltin("node:https");',
      ].join("\n"),
      "index.ts",
      /dynamic import\/module loading/i,
    ],
    [
      "aliased builtin module loader",
      [
        "const loadBuiltin = process.getBuiltinModule;",
        'void loadBuiltin("node:https");',
      ].join("\n"),
      "index.ts",
      /dynamic import\/module loading/i,
    ],
    [
      "eval",
      'eval("1 + 1");\n',
      "index.ts",
      /dynamic evaluation/i,
    ],
    [
      "Function constructor",
      'new Function("return 1");\n',
      "index.ts",
      /dynamic evaluation/i,
    ],
    [
      "aliased Function constructor",
      [
        "const compileAtRuntime = Function;",
        'compileAtRuntime("return 1");',
      ].join("\n"),
      "index.ts",
      /dynamic evaluation/i,
    ],
    [
      "constructor-based evaluation",
      'const Dynamic = (() => {}).constructor;\nvoid Dynamic("return 1")();\n',
      "index.ts",
      /dynamic evaluation/i,
    ],
    [
      "native process binding",
      'void process.binding("spawn_sync");\n',
      "index.ts",
      /native loading\/execution/i,
    ],
    [
      "native process dlopen",
      'void process.dlopen({ exports: {} }, "/tmp/native.node");\n',
      "index.ts",
      /native loading\/execution/i,
    ],
    [
      "arbitrary child executable",
      [
        'import { spawn } from "node:child_process";',
        'spawn("curl", ["https://example.invalid"], { shell: false });',
      ].join("\n"),
      "sandbox/docker.ts",
      /fixed Docker invocation/i,
    ],
    [
      "aliased child executor",
      [
        'import { spawn } from "node:child_process";',
        "const runArbitraryCommand = spawn;",
        'runArbitraryCommand("curl", ["https://example.invalid"], { shell: false });',
      ].join("\n"),
      "sandbox/docker.ts",
      /fixed Docker invocation/i,
    ],
    [
      "conforming spawn shape with arbitrary executable type",
      [
        'import { spawn } from "node:child_process";',
        "interface ProcessInvocation {",
        "  readonly executable: string;",
        "  readonly args: readonly string[];",
        "  readonly shell: false;",
        "}",
        "function execute(invocation: ProcessInvocation): void {",
        "  spawn(invocation.executable, [...invocation.args], { shell: invocation.shell });",
        "}",
      ].join("\n"),
      "sandbox/docker.ts",
      /fixed Docker executable invariant/i,
    ],
  ] as const)("rejects %s", async (_label, source, relativePath, expected) => {
    const result = await guardFixture(source, relativePath);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(expected);
  });

  test("accepts the checked-in fixed Docker production boundary", async () => {
    const result = await runGuard();

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
  });

  test("rejects a symlinked production source", async () => {
    const root = await temporaryDirectory();
    const targetRoot = await temporaryDirectory();
    const target = join(targetRoot, "network.ts");
    await writeFile(join(root, "index.ts"), "export const safe = true;\n");
    await writeFile(target, 'import "node:https";\n');
    await symlink(target, join(root, "linked.ts"));

    const result = await runGuard(root);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/symlink/i);
  });

  test("rejects an unscanned runtime source extension", async () => {
    const root = await temporaryDirectory();
    await writeFile(
      join(root, "index.ts"),
      '// @ts-ignore\nimport "./escape.mjs";\n',
    );
    await writeFile(join(root, "escape.mjs"), 'void fetch("https://example.invalid");\n');

    const result = await runGuard(root);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/unsupported runtime source/i);
  });

  test("rejects a broadened fixed Docker executable union", async () => {
    const dockerSource = await readFile(
      join(PACKAGE_ROOT, "src", "sandbox", "docker.ts"),
      "utf8",
    );
    const broadened = dockerSource.replace(
      '  | "/usr/bin/docker";',
      '  | "/usr/bin/docker"\n  | string;',
    );
    expect(broadened).not.toBe(dockerSource);

    const result = await guardFixture(broadened, "sandbox/docker.ts");

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/fixed Docker executable invariant/i);
  });
});
