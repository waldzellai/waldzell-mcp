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

export async function finalizeEvaluation<T>(
  primary: Result<T>,
  snapshots: readonly NamedCandidateSnapshot[],
  cleanup: CandidateSnapshotCleanup = cleanupCandidateSnapshot,
): Promise<Result<T>> {
  const failures: string[] = [];
  for (const { phase, snapshot } of snapshots) {
    try {
      await cleanup(snapshot);
    } catch (error) {
      failures.push(
        `${phase}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (failures.length === 0) return primary;
  const cleanupMessage = `Candidate snapshot cleanup failed during finalization: ${failures.join("; ")}`;
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
