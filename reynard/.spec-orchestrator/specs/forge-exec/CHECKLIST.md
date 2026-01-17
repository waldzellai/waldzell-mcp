# Checklist: forge-exec
- [ ] Node registry covers tool/llm/router/critic with dispatch.
- [ ] Budgets/timeouts enforced; cancellation stops execution and marks trace.
- [ ] Retry policy respects idempotency; ledger used for side effects.
- [ ] BehaviorTrace persisted with hashed req/resp and timestamps.
- [ ] IO validation in place; streaming supported where specified.
- [ ] Tests cover budgets, retries, idempotency, trace determinism.
