# TODOs: forge-eval
- Load datasets (goldens, chaos config, fuzz) with schema validation.
- Implement functional suite: run graph on goldens, compute accuracy/errorRate, per-case outputs.
- Implement chaos suite: inject timeouts/jitter/429/500, measure latencyP95, chaosDivergence, retryHygieneScore.
- Implement idempotency suite: rerun side-effect flows, verify ledger prevents duplicates or compensates; compute idempotencyPassRate.
- Support smoke mode subset; aggregate metrics and write manifests/<id>/eval.json.
- Add tests for suite runners and failure modes when ledger/sandbox misconfigured.
