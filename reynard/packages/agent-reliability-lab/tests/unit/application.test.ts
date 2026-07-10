import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { evaluateApplication } from "../../src/application.js";
import {
  cleanupCandidateSnapshot,
  loadCandidateSnapshot,
  type CandidateSnapshot,
} from "../../src/candidate.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const WORKSPACE_ROOT = resolve(PACKAGE_ROOT, "../..");
const FIXTURES = join(WORKSPACE_ROOT, "fixtures", "echo");

describe("evaluation application", () => {
  test("keeps artifact failure precedence while attempting both pre-Docker cleanups", async () => {
    const root = await mkdtemp(join(tmpdir(), "reynard-application-test-"));
    const stagingRoot = join(root, "staging");
    const loadedSnapshots: CandidateSnapshot[] = [];
    const cleaned: CandidateSnapshot[] = [];
    let dockerCreations = 0;

    try {
      const result = await evaluateApplication(
        {
          baseline: join(FIXTURES, "baseline", "candidate.json"),
          candidate: join(FIXTURES, "candidate", "candidate.json"),
          cases: join(FIXTURES, "goldens.jsonl"),
          seed: 0,
        },
        {
          loadCandidateSnapshot: async (definitionPath) => {
            const loaded = await loadCandidateSnapshot(definitionPath, {
              stagingRoot,
            });
            if (loaded.ok) loadedSnapshots.push(loaded.value);
            return loaded;
          },
          recoverArtifactPublishLocks: async () => ({
            ok: false,
            error: {
              _tag: "ArtifactWriteFailed",
              message: "injected artifact recovery failure",
            },
          }),
          createDockerSandbox: () => {
            dockerCreations += 1;
            throw new Error("Docker creation must not run");
          },
          snapshotCleanup: async (snapshot) => {
            cleaned.push(snapshot);
            throw new Error(
              `injected ${cleaned.length === 1 ? "baseline" : "candidate"} cleanup failure`,
            );
          },
        },
      );

      expect(dockerCreations).toBe(0);
      expect(cleaned).toHaveLength(2);
      expect(result).toEqual({
        ok: false,
        error: {
          _tag: "ArtifactWriteFailed",
          message: expect.stringMatching(
            /injected artifact recovery failure.*baseline.*injected baseline cleanup failure.*candidate.*injected candidate cleanup failure.*ArtifactWriteFailed/i,
          ),
        },
      });
    } finally {
      try {
        for (const snapshot of loadedSnapshots) {
          await cleanupCandidateSnapshot(snapshot);
          await expect(stat(snapshot.snapshotPath)).rejects.toMatchObject({
            code: "ENOENT",
          });
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  });
});
