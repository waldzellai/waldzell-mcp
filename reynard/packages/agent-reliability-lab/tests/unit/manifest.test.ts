import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalJson, sha256 } from "../../src/canonical-json.js";
import {
  V1_INPUT_LIMITS,
  V1_SANDBOX_POLICY,
  type RunManifest,
  type RunManifestInput,
} from "../../src/contracts.js";
import {
  createRunManifest,
  resolveEvaluatorIdentity,
} from "../../src/manifest.js";

const digest = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`;

const candidateDefinition = {
  schemaVersion: 1,
  name: "candidate",
  image: `example/candidate@${digest("a")}`,
  platform: "linux/amd64",
  entrypoint: ["node", "candidate.js"],
  protocol: "jsonl-stdio",
  source: {
    relativePath: "candidates/candidate",
    digest: digest("b"),
  },
} as const;

const candidateIdentity = {
  definition: candidateDefinition,
  image: {
    reference: candidateDefinition.image,
    imageId: digest("c"),
    os: "linux",
    architecture: "amd64",
    platform: candidateDefinition.platform,
  },
} as const;

const manifestInput: RunManifestInput = {
  evaluator: {
    schemaVersion: 1,
    implementationDigest: digest("d"),
    dependencyLockDigest: digest("e"),
    nodeVersion: "v22.17.0",
  },
  seed: 0,
  baseline: candidateIdentity,
  candidate: candidateIdentity,
  casesDigest: digest("f"),
  inputLimits: V1_INPUT_LIMITS,
  sandbox: V1_SANDBOX_POLICY,
};

function unwrapManifest(input: RunManifestInput): RunManifest {
  const result = createRunManifest(input);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

describe("createRunManifest", () => {
  it("excludes timestamps and durations from content identity", () => {
    const firstInput = {
      ...manifestInput,
      timestamp: "2026-07-09T10:00:00.000Z",
      durationMillis: 10,
    };
    const secondInput = {
      ...manifestInput,
      timestamp: "2036-01-01T00:00:00.000Z",
      durationMillis: 99_999,
    };

    const first = unwrapManifest(firstInput);
    const second = unwrapManifest(secondInput);

    expect(first.runId).toBe(second.runId);
    expect(first).not.toHaveProperty("timestamp");
    expect(first).not.toHaveProperty("durationMillis");
  });

  it("changes the run ID when the cases digest changes", () => {
    const changedCases = {
      ...manifestInput,
      casesDigest: digest("0"),
    };

    expect(unwrapManifest(changedCases).runId).not.toBe(
      unwrapManifest(manifestInput).runId,
    );
  });

  it.each<
    [string, (input: RunManifestInput) => RunManifestInput]
  >([
    ["seed", (input) => ({ ...input, seed: 1 })],
    [
      "source digest",
      (input) => ({
        ...input,
        candidate: {
          ...input.candidate,
          definition: {
            ...input.candidate.definition,
            source: {
              ...input.candidate.definition.source,
              digest: digest("1"),
            },
          },
        },
      }),
    ],
    [
      "resolved image ID",
      (input) => ({
        ...input,
        candidate: {
          ...input.candidate,
          image: { ...input.candidate.image, imageId: digest("2") },
        },
      }),
    ],
    [
      "resolved image platform",
      (input) => ({
        ...input,
        candidate: {
          ...input.candidate,
          image: { ...input.candidate.image, platform: "linux/arm64" },
        },
      }),
    ],
    [
      "evaluator implementation",
      (input) => ({
        ...input,
        evaluator: {
          ...input.evaluator,
          implementationDigest: digest("3"),
        },
      }),
    ],
    [
      "dependency lockfile",
      (input) => ({
        ...input,
        evaluator: {
          ...input.evaluator,
          dependencyLockDigest: digest("4"),
        },
      }),
    ],
    [
      "exact Node runtime",
      (input) => ({
        ...input,
        evaluator: { ...input.evaluator, nodeVersion: "v24.0.0" },
      }),
    ],
    [
      "input limits",
      (input) => ({
        ...input,
        inputLimits: {
          ...input.inputLimits,
          caseBytes: input.inputLimits.caseBytes + 1,
        },
      }),
    ],
    [
      "sandbox policy",
      (input) => ({
        ...input,
        sandbox: {
          ...input.sandbox,
          timeoutMillis: input.sandbox.timeoutMillis + 1,
        },
      }),
    ],
  ])("changes the run ID when %s changes", (_name, mutate) => {
    expect(unwrapManifest(mutate(manifestInput)).runId).not.toBe(
      unwrapManifest(manifestInput).runId,
    );
  });

  it("returns InvalidInput when an identity value violates its contract", () => {
    const result = createRunManifest({
      ...manifestInput,
      seed: Number.MAX_SAFE_INTEGER + 1,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { _tag: "InvalidInput" },
    });
  });
});

describe("resolveEvaluatorIdentity", () => {
  it("orders implementation paths with deterministic lexical comparison", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "reynard-sorted-identity-"));
    const packageRoot = join(workspace, "packages", "lab");
    const dist = join(packageRoot, "dist");
    const upperContents = "export const upper = true;\n";
    const lowerContents = "export const lower = true;\n";

    try {
      await mkdir(dist, { recursive: true });
      await writeFile(join(workspace, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
      await writeFile(join(dist, "a.js"), lowerContents);
      await writeFile(join(dist, "Z.js"), upperContents);

      const result = await resolveEvaluatorIdentity(packageRoot);
      expect(result.ok).toBe(true);
      if (!result.ok) {
        throw new Error(result.error.message);
      }

      expect(result.value.implementationDigest).toBe(
        sha256(
          canonicalJson([
            {
              path: "Z.js",
              bytes: Buffer.from(upperContents).toString("base64"),
            },
            {
              path: "a.js",
              bytes: Buffer.from(lowerContents).toString("base64"),
            },
          ]),
        ),
      );
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("hashes emitted JavaScript and the nearest lockfile using real files", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "reynard-identity-"));
    const packageRoot = join(workspace, "packages", "lab");
    const dist = join(packageRoot, "dist");

    try {
      await mkdir(join(dist, "nested"), { recursive: true });
      await writeFile(join(workspace, "pnpm-lock.yaml"), "lockfileVersion: 9\n");
      await writeFile(join(dist, "z.js"), "export const z = 1;\n");
      await writeFile(
        join(dist, "nested", "a.js"),
        "export const a = 1;\n",
      );
      await writeFile(join(dist, "ignored.js.map"), "not implementation");

      const initial = await resolveEvaluatorIdentity(packageRoot);
      expect(initial.ok).toBe(true);
      if (!initial.ok) {
        throw new Error(initial.error.message);
      }
      expect(initial.value.nodeVersion).toBe(process.version);

      await writeFile(join(dist, "z.js"), "export const z = 2;\n");
      const implementationChanged =
        await resolveEvaluatorIdentity(packageRoot);
      expect(implementationChanged.ok).toBe(true);
      if (!implementationChanged.ok) {
        throw new Error(implementationChanged.error.message);
      }
      expect(implementationChanged.value.implementationDigest).not.toBe(
        initial.value.implementationDigest,
      );
      expect(implementationChanged.value.dependencyLockDigest).toBe(
        initial.value.dependencyLockDigest,
      );

      await writeFile(
        join(workspace, "pnpm-lock.yaml"),
        "lockfileVersion: 9\nrevision: 2\n",
      );
      const lockChanged = await resolveEvaluatorIdentity(packageRoot);
      expect(lockChanged.ok).toBe(true);
      if (!lockChanged.ok) {
        throw new Error(lockChanged.error.message);
      }
      expect(lockChanged.value.dependencyLockDigest).not.toBe(
        implementationChanged.value.dependencyLockDigest,
      );
      expect(lockChanged.value.implementationDigest).toBe(
        implementationChanged.value.implementationDigest,
      );
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });

  it("rejects an empty emitted-JavaScript set", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "reynard-empty-identity-"));
    const packageRoot = join(workspace, "packages", "lab");

    try {
      await mkdir(join(packageRoot, "dist"), { recursive: true });
      await writeFile(join(workspace, "pnpm-lock.yaml"), "lockfileVersion: 9\n");

      const result = await resolveEvaluatorIdentity(packageRoot);
      expect(result).toMatchObject({
        ok: false,
        error: { _tag: "InvalidInput" },
      });
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});
