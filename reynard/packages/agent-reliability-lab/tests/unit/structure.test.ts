import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const reynardRoot = fileURLToPath(new URL("../../../../", import.meta.url));

describe("Reynard workspace structure", () => {
  it("keeps only the supported reliability-lab workspace package", async () => {
    const packageDirectories = (await readdir(resolve(reynardRoot, "packages"), {
      withFileTypes: true,
    }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(packageDirectories).toEqual(["agent-reliability-lab"]);

    const packageManifest = JSON.parse(
      await readFile(
        resolve(reynardRoot, "packages/agent-reliability-lab/package.json"),
        "utf8",
      ),
    ) as { name?: string };
    expect(packageManifest.name).toBe("@waldzellai/agent-reliability-lab");

    const rootManifest = JSON.parse(
      await readFile(resolve(reynardRoot, "package.json"), "utf8"),
    ) as { workspaces?: string[] };
    expect(rootManifest.workspaces).toEqual([
      "packages/agent-reliability-lab",
    ]);

    const workspaceConfig = await readFile(
      resolve(reynardRoot, "pnpm-workspace.yaml"),
      "utf8",
    );
    const declaredPackagePaths = workspaceConfig
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- "))
      .map((line) => line.slice(2).replace(/^['"]|['"]$/g, ""));
    expect(declaredPackagePaths).toEqual([
      "packages/agent-reliability-lab",
    ]);
  });
});
