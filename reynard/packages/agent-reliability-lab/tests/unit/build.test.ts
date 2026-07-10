import { execFile as execFileCallback } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

import { resolveEvaluatorIdentity } from "../../src/manifest.js";

const execFile = promisify(execFileCallback);
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");

describe("package build", () => {
  test("removes stale emitted JavaScript before resolving evaluator identity", async () => {
    const staleOutput = join(PACKAGE_ROOT, "dist", "stale-identity.js");
    await mkdir(dirname(staleOutput), { recursive: true });
    await writeFile(staleOutput, "export const stale = true;\n");
    const contaminated = await resolveEvaluatorIdentity(PACKAGE_ROOT);
    expect(contaminated.ok).toBe(true);

    try {
      await execFile("corepack", ["pnpm", "run", "build"], {
        cwd: WORKSPACE_ROOT,
        env: { ...process.env },
        maxBuffer: 1_048_576,
      });

      await expect(stat(staleOutput)).rejects.toMatchObject({ code: "ENOENT" });
      const clean = await resolveEvaluatorIdentity(PACKAGE_ROOT);
      expect(clean.ok).toBe(true);
      if (!contaminated.ok || !clean.ok) return;
      expect(clean.value.implementationDigest).not.toBe(
        contaminated.value.implementationDigest,
      );
    } finally {
      await rm(staleOutput, { force: true });
    }
  });
});
