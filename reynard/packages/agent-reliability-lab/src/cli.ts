#!/usr/bin/env node

import { parseArgs } from "node:util";

import {
  evaluateApplication,
  type EvaluationOptions,
} from "./application.js";
import type { LabError, Result } from "./errors.js";

type CliOptions = EvaluationOptions;

function invalidInput<T>(message: string): Result<T> {
  return { ok: false, error: { _tag: "InvalidInput", message } };
}

function parseCliOptions(args: readonly string[]): Result<CliOptions> {
  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        baseline: { type: "string" },
        candidate: { type: "string" },
        cases: { type: "string" },
        seed: { type: "string" },
      },
    });
    if (
      parsed.positionals.length !== 1 ||
      parsed.positionals[0] !== "evaluate"
    ) {
      return invalidInput("Expected the command: evaluate");
    }
    const baseline = parsed.values.baseline;
    const candidate = parsed.values.candidate;
    const cases = parsed.values.cases;
    if (baseline === undefined) return invalidInput("Missing required --baseline");
    if (candidate === undefined) return invalidInput("Missing required --candidate");
    if (cases === undefined) return invalidInput("Missing required --cases");
    const seedText = parsed.values.seed;
    if (seedText === undefined) return invalidInput("Missing required --seed");
    if (!/^-?(?:0|[1-9][0-9]*)$/.test(seedText)) {
      return invalidInput("--seed must be a safe integer");
    }
    const seed = Number(seedText);
    if (!Number.isSafeInteger(seed)) {
      return invalidInput("--seed must be a safe integer");
    }
    return {
      ok: true,
      value: {
        baseline,
        candidate,
        cases,
        seed,
      },
    };
  } catch (error) {
    return invalidInput(
      `Invalid CLI arguments: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function exitCode(error: LabError): number {
  switch (error._tag) {
    case "InvalidInput":
      return 2;
    case "SandboxUnavailable":
      return 3;
    case "ExecutionFailed":
      return 4;
    case "EvaluationFailed":
      return 5;
    case "ArtifactWriteFailed":
      return 6;
  }
}

async function main(args: readonly string[]): Promise<number> {
  const options = parseCliOptions(args);
  if (!options.ok) {
    process.stderr.write(`${options.error.message}\n`);
    return exitCode(options.error);
  }
  const completed = await evaluateApplication(options.value);
  if (!completed.ok) {
    process.stderr.write(`${completed.error.message}\n`);
    return exitCode(completed.error);
  }
  process.stdout.write(`Run directory: ${completed.value.directory}\n`);
  process.stdout.write(
    `Candidate passed ${completed.value.passedCaseCount}/${completed.value.caseCount} cases${
      completed.value.published ? "" : " (existing bundle validated)"
    }.\n`,
  );
  if (completed.value.failedCaseIds.length > 0) {
    process.stdout.write(
      `Failed cases: ${completed.value.failedCaseIds.join(", ")}\n`,
    );
  }
  return completed.value.overallPassed ? 0 : 5;
}

process.exitCode = await main(process.argv.slice(2));
