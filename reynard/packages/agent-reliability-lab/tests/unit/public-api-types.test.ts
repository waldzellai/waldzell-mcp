import { describe, expect, test } from "vitest";

import {
  createDockerSandbox,
  recoverArtifactPublishLocks,
  writeArtifactBundle,
  type ArtifactWriteInput,
  type ArtifactWriteResult,
  type CandidateSnapshotOptions,
  type ValidatedArtifactBundle,
} from "../../src/index.js";

// @ts-expect-error artifact filesystem I/O is package-internal
import type { ArtifactIo } from "../../src/index.js";
// @ts-expect-error artifact recovery options are package-internal
import type { ArtifactRecoveryOptions } from "../../src/index.js";
// @ts-expect-error artifact write options are package-internal
import type { ArtifactWriteOptions } from "../../src/index.js";
// @ts-expect-error the concrete Docker sandbox is package-internal
import type { DockerSandbox } from "../../src/index.js";
// @ts-expect-error Docker construction options are package-internal
import type { DockerSandboxOptions } from "../../src/index.js";
// @ts-expect-error fixed executable details are package-internal
import type { FixedDockerExecutable } from "../../src/index.js";
// @ts-expect-error process execution is package-internal
import type { ProcessExecutor } from "../../src/index.js";
// @ts-expect-error process invocation details are package-internal
import type { ProcessInvocation } from "../../src/index.js";
// @ts-expect-error process outcomes are package-internal
import type { ProcessOutcome } from "../../src/index.js";

// @ts-expect-error platform selection is package-internal
type PlatformSelector = typeof import("../../src/index.js").dockerExecutableForPlatform;

type RemovedRootTypes = [
  ArtifactIo,
  ArtifactRecoveryOptions,
  ArtifactWriteOptions,
  DockerSandbox,
  DockerSandboxOptions,
  FixedDockerExecutable,
  ProcessExecutor,
  ProcessInvocation,
  ProcessOutcome,
  PlatformSelector,
];

describe("public option types", () => {
  test("keeps safe result and candidate configuration types", () => {
    const candidate: CandidateSnapshotOptions = { stagingRoot: "/tmp/staging" };
    const rejectedCandidateOverride: CandidateSnapshotOptions = {
      // @ts-expect-error candidate cleanup operations are package-internal
      directoryOperations: {},
    };
    const result = {} as ArtifactWriteResult;
    const bundle = {} as ValidatedArtifactBundle;

    expect([candidate, rejectedCandidateOverride, result, bundle]).toHaveLength(4);
  });

  test("rejects every artifact and Docker injection argument", () => {
    const rejectedCalls = (): void => {
      const input = {} as ArtifactWriteInput;

      // @ts-expect-error artifact I/O overrides are package-internal
      void writeArtifactBundle(input, { io: {} });
      // @ts-expect-error lock-release overrides are package-internal
      void writeArtifactBundle(input, { releasePublishLock: async () => {} });
      // @ts-expect-error lock timing overrides are package-internal
      void writeArtifactBundle(input, { lockTimeoutMillis: 1 });
      // @ts-expect-error lock retry overrides are package-internal
      void writeArtifactBundle(input, { lockRetryMillis: 1 });
      // @ts-expect-error cleanup operations are package-internal
      void writeArtifactBundle(input, { directoryOperations: {} });

      // @ts-expect-error liveness overrides are package-internal
      void recoverArtifactPublishLocks("runs", { isProcessAlive: () => false });
      // @ts-expect-error malformed-age overrides are package-internal
      void recoverArtifactPublishLocks("runs", { staleMalformedLockMillis: 1 });
      // @ts-expect-error cleanup operations are package-internal
      void recoverArtifactPublishLocks("runs", { directoryOperations: {} });

      // @ts-expect-error executors are package-internal
      void createDockerSandbox({
        executor: {
          execute: async () => ({
            exitCode: 0,
            signal: null,
            stdout: "",
            stderr: "",
            timedOut: false,
            stdoutOverflow: false,
            stderrOverflow: false,
            durationMillis: 0,
          }),
        },
      });
      // @ts-expect-error state roots are package-internal
      void createDockerSandbox({ stateRoot: "/tmp/state" });
      // @ts-expect-error owner PIDs are package-internal
      void createDockerSandbox({ ownerPid: 123 });
      // @ts-expect-error unique-ID sources are package-internal
      void createDockerSandbox({ uniqueId: () => "fixed" });
      // @ts-expect-error process liveness is package-internal
      void createDockerSandbox({ isProcessAlive: () => false });
      // @ts-expect-error platform overrides are package-internal
      void createDockerSandbox({ platform: "win32" });
    };

    expect(undefined as unknown as RemovedRootTypes).toBeUndefined();
    expect(rejectedCalls).toBeTypeOf("function");
  });
});
