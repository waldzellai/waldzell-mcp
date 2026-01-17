# TODOs: forge-ledger
- Implement File/SQLite ledger with atomic writes and schema (intentId, toolId, inputHash, status, timestamps, payload).
- Ensure prepare is idempotent and returns existing intentId on duplicate key.
- Make commit/compensate idempotent; enforce ordering rules.
- Add locking/concurrency safety for multi-process calls.
- Add integrity checks and basic metrics; tests for concurrent prepare/commit flows.
