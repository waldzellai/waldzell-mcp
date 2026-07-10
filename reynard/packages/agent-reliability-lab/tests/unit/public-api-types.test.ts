import { describe, expect, test } from "vitest";

import type {
  ArtifactRecoveryOptions,
  ArtifactWriteOptions,
  CandidateSnapshotOptions,
} from "../../src/index.js";

describe("public option types", () => {
  test("reject filesystem-operation overrides", () => {
    const candidate: CandidateSnapshotOptions = {
      // @ts-expect-error cleanup operations are package-internal
      directoryOperations: {},
    };
    const recovery: ArtifactRecoveryOptions = {
      // @ts-expect-error cleanup operations are package-internal
      directoryOperations: {},
    };
    const write: ArtifactWriteOptions = {
      // @ts-expect-error cleanup operations are package-internal
      directoryOperations: {},
    };

    expect([candidate, recovery, write]).toHaveLength(3);
  });
});
