# Spec: forge-ledger

Goal: durable intent ledger to enforce idempotency and compensation for tool executions.

Functional (MUST):
1) Storage: implement File/SQLite-backed ledger with atomic writes; schema supports intentId, toolId, inputHash, status (prepared/committed/compensated), timestamps, payload.
2) API: `recordPrepare`, `recordCommit`, `recordCompensate`, `findByKey` with proper locking to prevent duplicate commits.
3) Idempotency: repeated `prepare` with same toolId+inputHash returns existing intentId; commit is idempotent; compensate only once.
4) Concurrency: safe for concurrent calls from multiple executions.
5) Integrity: crash-safe (fsync where needed); corruption detection with checksum or version field.

SHOULD:
- Metrics for ledger operations (latency, failures).
- TTL/cleanup for old records.

Acceptance:
- Concurrent prepare calls for same key return same intentId.
- Commit after compensate fails with clear error.
- Crash simulation (mid-write) does not lose committed records.
