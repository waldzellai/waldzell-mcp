import {
  cleanupCandidateSnapshot,
  type CandidateSnapshot,
} from "./candidate.js";
import type { Result } from "./errors.js";

export interface NamedCandidateSnapshot {
  readonly phase: string;
  readonly snapshot: CandidateSnapshot;
}

export type CandidateSnapshotCleanup = (
  snapshot: CandidateSnapshot,
) => Promise<void>;

export interface NamedCleanup {
  readonly phase: string;
  readonly cleanup: () => Promise<void>;
}

export async function finalizeResult<T>(
  primary: Result<T>,
  cleanups: readonly NamedCleanup[],
): Promise<Result<T>> {
  const failures: string[] = [];
  for (const { phase, cleanup } of cleanups) {
    try {
      await cleanup();
    } catch (error) {
      failures.push(
        `${phase}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (failures.length === 0) return primary;
  const cleanupMessage = `Cleanup failed during finalization: ${failures.join("; ")}`;
  if (primary.ok) {
    return {
      ok: false,
      error: { _tag: "SandboxUnavailable", message: cleanupMessage },
    };
  }
  return {
    ok: false,
    error: {
      ...primary.error,
      message: `${primary.error.message}; ${cleanupMessage} after ${primary.error._tag}`,
    },
  };
}

export async function finalizeEvaluation<T>(
  primary: Result<T>,
  snapshots: readonly NamedCandidateSnapshot[],
  cleanup: CandidateSnapshotCleanup = cleanupCandidateSnapshot,
): Promise<Result<T>> {
  return finalizeResult(
    primary,
    snapshots.map(({ phase, snapshot }) => ({
      phase,
      cleanup: async () => cleanup(snapshot),
    })),
  );
}
