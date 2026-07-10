#!/usr/bin/env node

import { execFile as execFileCallback } from "node:child_process";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY_ROOT = resolve(WORKSPACE_ROOT, "..");
const RETIRED_DIRECTORY = ["agentic", "scripts"].join("-");
const RETIRED_BASENAMES = [
  [["code", "review", "advanced"].join("-"), "sh"].join("."),
  [["intelligent", "debugger"].join("-"), "sh"].join("."),
  [["adas", "meta", "agent"].join("-"), "sh"].join("."),
  [["memory", "manager"].join("-"), "sh"].join("."),
  [["performance", "driven", "auto", "tuning"].join("-"), "sh"].join("."),
];
const RETIRED_TREE_TOKEN = `${RETIRED_DIRECTORY}/`;
const RETIRED_BASENAME_TOKEN = RETIRED_BASENAMES.join("|");
const WORKFLOW_PATH = ".github/workflows/reynard-reliability-lab.yml";
const RETIRED_WORKFLOW_PATH = `.github/workflows/${[
  "waldzell",
  "agentic",
  "enhancement",
].join("-")}.yml`;
const HISTORICAL_DOCUMENTS = [
  `${RETIRED_DIRECTORY}/README.md`,
  "reynard/RELIABILITY_LAB_PLAN.md",
  "reynard/docs/provenance.md",
];

function regexEscape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertRetiredTree() {
  const directory = join(REPOSITORY_ROOT, RETIRED_DIRECTORY);
  const directoryStats = await lstat(directory);
  if (!directoryStats.isDirectory() || directoryStats.isSymbolicLink()) {
    throw new Error(`${RETIRED_DIRECTORY} must be a real directory`);
  }
  const entries = await readdir(directory, { withFileTypes: true });
  if (
    entries.length !== 1 ||
    entries[0]?.name !== "README.md" ||
    !entries[0].isFile()
  ) {
    throw new Error(
      `${RETIRED_DIRECTORY} must contain exactly one regular file: README.md`,
    );
  }
  const readme = join(directory, "README.md");
  const readmeStats = await lstat(readme);
  if (!readmeStats.isFile() || readmeStats.isSymbolicLink()) {
    throw new Error(`${RETIRED_TREE_TOKEN}README.md must not be a symlink`);
  }
  const { stdout } = await execFile(
    "git",
    ["-C", REPOSITORY_ROOT, "ls-files", "--", RETIRED_DIRECTORY],
    { encoding: "utf8" },
  );
  if (stdout !== `${RETIRED_DIRECTORY}/README.md\n`) {
    throw new Error(
      `${RETIRED_DIRECTORY} tracked tree must contain exactly README.md`,
    );
  }
}

async function assertRetiredWorkflowAbsent() {
  try {
    await lstat(join(REPOSITORY_ROOT, RETIRED_WORKFLOW_PATH));
    throw new Error(`Retired workflow must remain absent: ${RETIRED_WORKFLOW_PATH}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      // Filesystem absence is required in addition to the tracked-tree check.
    } else {
      throw error;
    }
  }
  const { stdout } = await execFile(
    "git",
    ["-C", REPOSITORY_ROOT, "ls-files", "--", RETIRED_WORKFLOW_PATH],
    { encoding: "utf8" },
  );
  if (stdout !== "") {
    throw new Error(`Retired workflow must remain untracked: ${RETIRED_WORKFLOW_PATH}`);
  }
}

async function assertNoGrepMatches(label, grepArguments) {
  try {
    const { stdout } = await execFile(
      "git",
      ["-C", REPOSITORY_ROOT, "grep", "-n", ...grepArguments],
      { encoding: "utf8", maxBuffer: 1_048_576 },
    );
    throw new Error(`${label} found unexpected tracked references:\n${stdout}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 1
    ) {
      return;
    }
    throw error;
  }
}

function exclusionPathspecs() {
  return [...HISTORICAL_DOCUMENTS, WORKFLOW_PATH].map(
    (path) => `:(exclude)${path}`,
  );
}

async function assertTrackedReferences() {
  const workflowBasenames =
    process.env.RETIRED_BASENAMES ?? RETIRED_BASENAME_TOKEN;
  const workflowTree = process.env.RETIRED_TREE ?? RETIRED_TREE_TOKEN;
  if (workflowBasenames !== RETIRED_BASENAME_TOKEN) {
    throw new Error("CI retired-basename search tokens do not match the guard");
  }
  if (workflowTree !== RETIRED_TREE_TOKEN) {
    throw new Error("CI retired-tree search token does not match the guard");
  }
  const excluded = exclusionPathspecs();
  await assertNoGrepMatches("Retired basename guard", [
    "-E",
    `(${RETIRED_BASENAMES.map(regexEscape).join("|")})`,
    "--",
    ".",
    ...excluded,
  ]);
  await assertNoGrepMatches("Retired tree guard", [
    "-F",
    RETIRED_TREE_TOKEN,
    "--",
    ".",
    ...excluded,
  ]);
}

async function assertWorkflowTokensAreInert() {
  const workflow = await readFile(join(REPOSITORY_ROOT, WORKFLOW_PATH), "utf8");
  const lines = workflow.split("\n");
  const stepIndexes = lines
    .map((line, index) =>
      line.trim() === "- name: Enforce retired implementation boundary"
        ? index
        : -1,
    )
    .filter((index) => index >= 0);
  if (stepIndexes.length !== 1) {
    throw new Error("Workflow must contain one named retirement-guard step");
  }
  const start = stepIndexes[0];
  const end = lines.findIndex(
    (line, index) => index > start && line.trimStart().startsWith("- name:"),
  );
  const stepLines = lines.slice(start, end === -1 ? lines.length : end);
  const allowedBasenameLine = `RETIRED_BASENAMES: ${RETIRED_BASENAME_TOKEN}`;
  const allowedTreeLine = `RETIRED_TREE: ${RETIRED_TREE_TOKEN}`;
  const basenameLineIndexes = lines
    .map((line, index) => (line.trim() === allowedBasenameLine ? index : -1))
    .filter((index) => index >= 0);
  const treeLineIndexes = lines
    .map((line, index) => (line.trim() === allowedTreeLine ? index : -1))
    .filter((index) => index >= 0);
  const stepEnd = end === -1 ? lines.length : end;
  if (
    basenameLineIndexes.length !== 1 ||
    treeLineIndexes.length !== 1 ||
    basenameLineIndexes[0] === undefined ||
    treeLineIndexes[0] === undefined ||
    basenameLineIndexes[0] < start ||
    basenameLineIndexes[0] >= stepEnd ||
    treeLineIndexes[0] < start ||
    treeLineIndexes[0] >= stepEnd
  ) {
    throw new Error(
      "Workflow retirement search tokens must appear once as inert step environment values",
    );
  }
  lines.forEach((line, index) => {
    const containsBasename = RETIRED_BASENAMES.some((name) =>
      line.includes(name),
    );
    const containsTree = line.includes(RETIRED_TREE_TOKEN);
    if (
      (containsBasename || containsTree) &&
      index !== basenameLineIndexes[0] &&
      index !== treeLineIndexes[0]
    ) {
      throw new Error(
        `${WORKFLOW_PATH}:${index + 1} contains a retired token outside the guard environment`,
      );
    }
  });
  const runMarker = stepLines.findIndex((line) => line.trim() === "run: |");
  if (runMarker === -1) {
    throw new Error("Workflow retirement guard must use a literal run block");
  }
  if (/\$(?:\{|)RETIRED_(?:BASENAMES|TREE)/.test(workflow)) {
    throw new Error("Workflow must never expand a retired search token as a command");
  }
  if (/[&*][A-Za-z][A-Za-z0-9_-]*/.test(workflow)) {
    throw new Error("Workflow YAML anchors and aliases are forbidden");
  }
  if (/(^|[;&|])\s*(?:eval|source|\.|bash\s+-c|sh\s+-c)(?:\s|$)/m.test(workflow)) {
    throw new Error("Workflow retirement guard contains a dynamic Bash invocation");
  }
}

async function main() {
  try {
    await assertRetiredTree();
    await assertRetiredWorkflowAbsent();
    await assertTrackedReferences();
    await assertWorkflowTokensAreInert();
    process.stdout.write(
      "Retirement guard passed (README-only tree; tracked references clean).\n",
    );
    return 0;
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 1;
  }
}

process.exitCode = await main();
