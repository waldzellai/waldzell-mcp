import { execFile as execFileCallback, spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, describe, expect, test } from "vitest";

const execFile = promisify(execFileCallback);
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");
const GUARD = join(WORKSPACE_ROOT, "scripts", "guard-retirement.mjs");
const RETIRED_DIRECTORY = ["agentic", "scripts"].join("-");
const RETIRED_BASENAMES = [
  [["code", "review", "advanced"].join("-"), "sh"].join("."),
  [["intelligent", "debugger"].join("-"), "sh"].join("."),
  [["adas", "meta", "agent"].join("-"), "sh"].join("."),
  [["memory", "manager"].join("-"), "sh"].join("."),
  [["performance", "driven", "auto", "tuning"].join("-"), "sh"].join("."),
];
const BASENAME_TOKEN = RETIRED_BASENAMES.join("|");
const TREE_TOKEN = `${RETIRED_DIRECTORY}/`;
const temporaryDirectories: string[] = [];

interface CommandResult {
  readonly exitCode: number | null;
  readonly stderr: string;
}

function workflow(options: {
  readonly duplicateStep?: boolean;
  readonly anchorReuse?: boolean;
  readonly namedExpansion?: boolean;
} = {}): string {
  const duplicate = options.duplicateStep
    ? [
        "      - name: Earlier unsafe step",
        "        env:",
        `          RETIRED_BASENAMES: ${BASENAME_TOKEN}`,
        `          RETIRED_TREE: ${TREE_TOKEN}`,
        "        run: |",
        "          echo safe",
      ].join("\n")
    : "";
  const anchor = options.anchorReuse ? " &retired_tokens" : "";
  const reused = options.anchorReuse
    ? [
        "      - name: Reused unsafe step",
        "        env: *retired_tokens",
        "        run: |",
        "          echo safe",
      ].join("\n")
    : "";
  return [
    "name: fixture",
    "jobs:",
    "  verify:",
    "    steps:",
    duplicate,
    "      - name: Enforce retired implementation boundary",
    `        env:${anchor}`,
    `          RETIRED_BASENAMES: ${BASENAME_TOKEN}`,
    `          RETIRED_TREE: ${TREE_TOKEN}`,
    "        run: |",
    "          node scripts/guard-retirement.mjs",
    options.namedExpansion ? "          $RETIRED_BASENAMES" : "",
    reused,
    "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

async function fixtureRepository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "reynard-retirement-guard-"));
  temporaryDirectories.push(root);
  const paths = [
    join(root, RETIRED_DIRECTORY),
    join(root, "reynard", "scripts"),
    join(root, "reynard", "docs"),
    join(root, ".github", "workflows"),
  ];
  await Promise.all(paths.map((path) => mkdir(path, { recursive: true })));
  await cp(GUARD, join(root, "reynard", "scripts", "guard-retirement.mjs"));
  await writeFile(join(root, RETIRED_DIRECTORY, "README.md"), "retired\n");
  await writeFile(join(root, "reynard", "RELIABILITY_LAB_PLAN.md"), "plan\n");
  await writeFile(join(root, "reynard", "docs", "provenance.md"), "history\n");
  await writeFile(
    join(root, ".github", "workflows", "reynard-reliability-lab.yml"),
    workflow(),
  );
  await execFile("git", ["init", "--quiet"], { cwd: root });
  await execFile("git", ["add", "--all"], { cwd: root });
  return root;
}

async function runGuard(root: string): Promise<CommandResult> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(
      process.execPath,
      [join(root, "reynard", "scripts", "guard-retirement.mjs")],
      { cwd: join(root, "reynard"), shell: false, stdio: ["ignore", "ignore", "pipe"] },
    );
    const stderr: Buffer[] = [];
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (exitCode) => {
      resolveResult({
        exitCode,
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("retirement guard", () => {
  test("accepts only the README tree, historical documents, and named-step tokens", async () => {
    expect(await runGuard(await fixtureRepository())).toMatchObject({
      exitCode: 0,
      stderr: "",
    });
  });

  test("rejects a retired reference in another tracked file", async () => {
    const root = await fixtureRepository();
    await writeFile(join(root, "quick-start.md"), `${RETIRED_BASENAMES[0]}\n`);
    await execFile("git", ["add", "quick-start.md"], { cwd: root });

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/unexpected tracked references/i),
    });
  });

  test("rejects retired-token expansion in the named step", async () => {
    const root = await fixtureRepository();
    await writeFile(
      join(root, ".github", "workflows", "reynard-reliability-lab.yml"),
      workflow({ namedExpansion: true }),
    );

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/never expand/i),
    });
  });

  test("rejects duplicate tokens and expansion in another step", async () => {
    const root = await fixtureRepository();
    await writeFile(
      join(root, ".github", "workflows", "reynard-reliability-lab.yml"),
      workflow({ duplicateStep: true }),
    );

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/search tokens must appear once/i),
    });
  });

  test("rejects YAML anchor reuse of the retired-token environment", async () => {
    const root = await fixtureRepository();
    await writeFile(
      join(root, ".github", "workflows", "reynard-reliability-lab.yml"),
      workflow({ anchorReuse: true }),
    );

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/YAML anchors and aliases/i),
    });
  });

  test("rejects any extra entry in the retired tree", async () => {
    const root = await fixtureRepository();
    await writeFile(join(root, RETIRED_DIRECTORY, "unexpected"), "unsafe\n");

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/exactly one regular file/i),
    });
  });

  test("rejects restoration of the retired workflow path", async () => {
    const root = await fixtureRepository();
    const retiredWorkflow = join(
      root,
      ".github",
      "workflows",
      "waldzell-agentic-enhancement.yml",
    );
    await writeFile(retiredWorkflow, "name: unsafe\n");

    expect(await runGuard(root)).toMatchObject({
      exitCode: 1,
      stderr: expect.stringMatching(/retired workflow must remain absent/i),
    });
  });
});
