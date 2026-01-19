# Checklist: forge-eval
- [ ] Datasets validated before use.
- [ ] Functional suite computes accuracy/errorRate with per-case outputs.
- [ ] Chaos suite injects failures and reports latencyP95/chaosDivergence/retryHygieneScore.
- [ ] Idempotency suite fails when ledger missing/misconfigured; computes pass rate.
- [ ] Smoke flag runs subset quickly.
- [ ] Metrics written to manifests/<id>/eval.json with pass/fail per suite.
