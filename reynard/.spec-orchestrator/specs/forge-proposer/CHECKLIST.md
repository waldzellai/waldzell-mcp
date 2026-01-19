# Checklist: forge-proposer
- [ ] SpecWizard exits non-zero if critical fields missing; schemas validated.
- [ ] Planner respects budgets and safety, returns GraphSpec + rationale.
- [ ] Coder outputs buildable archive with tests and manifest; validators included.
- [ ] Providers use real APIs; clear error when key missing; caching/backoff present.
- [ ] Deterministic IDs/seeds; manifest hash stable across reruns.
- [ ] Parallel N candidate generation works and cleans up on failure.
