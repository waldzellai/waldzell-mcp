# Spec: forge-exec

Goal: execute GraphSpec deterministically with sandboxed tool calls, step budgets, traces, and cancellation.

Functional (MUST):
1) Node execution: support node kinds tool/llm/router/critic; dispatch via registry; router supports conditional edges; critic can short-circuit or request retries.
2) Budgets: enforce maxSteps and timeouts; cancellation propagates; over-budget raises structured error.
3) Tracing: emit BehaviorTrace with per-step request/response hashes, nodeId, timestamps; trace persisted with candidate artifacts.
4) Context: pass sandbox driver + ledger handles into tool nodes; ensure prepare/commit/compensate flow for side-effectful tools.
5) Error policy: configurable retry/backoff for transient errors; deterministic handling of non-idempotent tools (no retries unless tool declares idempotent).
6) API: expose `runGraph(graph, input, ctx)` returning {output, trace}; support streaming/iterator for UI.

SHOULD:
- Pluggable observability hooks (log events, metrics).
- Input/output validation via schemas attached to nodes.

Acceptance:
- Executes demo graph with mixed node types; honors maxSteps.
- Cancellation flag stops execution promptly and marks trace.
- Side-effecting tool called once even if downstream fails (ledger checked).
- Trace file contains hashed requests/responses and matches output deterministically.
