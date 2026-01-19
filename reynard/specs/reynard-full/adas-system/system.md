# Reynard ADAS System Spec

Goal: take a TaskSpec → generate candidate MCP servers / LangGraph workflows → execute in sandbox with ledger → evaluate (functional, chaos, idempotency) → optional redteam → select winners → enable deterministic reproduce.

Scope:
- Orchestrates all packages; defines end-to-end flow and interfaces.
- Covers CLI surfaces, data flows, artifacts, and acceptance signals.

Functional requirements (MUST unless stated otherwise):
1. Pipelines: `spec` → `propose` (N candidates) → `eval` → `select` → `reproduce`.
2. Config: load `reynard.config.yaml`, fail fast on missing/invalid, surface defaults used.
3. Manifests: every candidate has manifest (model pins, tools, sandbox policy, seeds, budgets) hashed deterministically; stored under `archives/agents/<id>/manifest.json`.
4. Artifacts: proposer writes code/tests/contracts per candidate under `archives/agents/<id>/`; eval writes metrics under `manifests/<id>/eval.json`; traces stored alongside.
5. Sandbox+Ledger: all tool calls go through sandbox driver and ledger (prepare/commit/compensate) with idempotency keys.
6. Evaluation: run functional, chaos, idempotency suites; emit JSON metrics; support `--smoke` to run subset.
7. Redteam (SHOULD): optional attack suite producing findings JSON; results included in selection.
8. Selection: Pareto on performance (accuracy, latency, idempotency), novelty, complexity (nodes/LOC/tool kinds); outputs winners list with justification.
9. Reproducibility: `reproduce --manifest` replays candidate deterministically (same seeds, sandbox policy, pinned models).
10. Telemetry: log structured events (stage, candidateId, status, errors, durations); produce operator-friendly summary.

Non-functional:
- Deterministic hashing (manifests, inputs); clocks not required for correctness.
- Clear failure modes with actionable errors.
- End-to-end completes under configured budgets; supports cancellation.

Acceptance tests:
- E2E happy path: given demo dataset, `forge spec/propose/eval/select` produces ≥1 passing candidate, emits metrics and winners.
- Reproduce: rerun with saved manifest yields identical outputs/metrics within tolerance.
- Chaos/idempotency: retries obey ledger semantics; no duplicate side effects.
- Config validation: corrupt/missing config fails with message and exit code >0.
- Telemetry/logs: contain stage transitions and error reasons for failed candidates.
