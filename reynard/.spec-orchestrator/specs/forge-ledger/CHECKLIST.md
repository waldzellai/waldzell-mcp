# Checklist: forge-ledger
- [ ] prepare returns same intentId for duplicate toolId+inputHash.
- [ ] commit/compensate idempotent and ordered.
- [ ] Concurrency-safe (no duplicate commits under race).
- [ ] Crash-safe persistence with integrity checks.
- [ ] Tests cover concurrent prepare/commit and compensate-after-commit failure.
