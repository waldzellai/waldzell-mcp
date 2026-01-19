# TODOs: forge-exec
- Build node registry for tool/llm/router/critic; implement dispatch logic.
- Enforce maxSteps/timeouts and cancellation propagation; structured errors.
- Implement retries/backoff respecting idempotency flags; integrate ledger prepare/commit/compensate.
- Emit BehaviorTrace with request/response hashes, timestamps; persist traces.
- Validate node IO schemas; support streaming output interface.
- Add tests for budgets, cancellation, idempotent vs non-idempotent tools, and trace determinism.
