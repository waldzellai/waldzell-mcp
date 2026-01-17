# Spec: forge-eval

Goal: evaluation runner that scores candidates across functional, chaos, and idempotency suites and emits metrics.

Functional (MUST):
1) Data loading: read datasets (goldens, chaos config, fuzz) from `datasets/<project>/`; validate schema.
2) Functional suite: execute graph on goldens; compare outputs; compute accuracy/errorRate; write detailed per-case results.
3) Chaos suite: wrap tool/LLM calls with injectors (timeouts, jitter, 429/500); measure latencyP95, chaosDivergence, retryHygieneScore.
4) Idempotency suite: rerun side-effecting flows multiple times; verify ledger prevents duplicates or applies compensation; produce idempotencyPassRate.
5) Runner API: `runAllSuites` returns aggregated metrics; support `--smoke` to run small subset quickly.
6) Outputs: per-candidate metrics JSON under `manifests/<id>/eval.json`; include pass/fail per suite.

SHOULD:
- Metric normalization and weighting configurable.
- CLI-friendly progress reporting.

Acceptance:
- Demo project runs all suites without placeholders; outputs metrics with non-zero samples.
- Chaos suite verifies retries obey backoff and stop on non-idempotent tools.
- Idempotency suite fails if ledger is disabled/misconfigured.
