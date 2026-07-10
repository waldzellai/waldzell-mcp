# Deferred Capabilities

Reynard V1 is intentionally one deterministic evaluation path. The following
capabilities are absent and are not implied by the package name or historical
Reynard code:

- LLM-driven candidate generation;
- planner, coder, grader, or attacker providers;
- graph execution and cycle analysis;
- novelty scoring and Pareto selection;
- autonomous promotion or self-modification;
- red-team orchestration;
- an idempotency ledger;
- MCP server generation;
- a UI;
- fine-grained network egress;
- semantic or model-based grading; and
- distributed execution.

None should be restored as a compatibility shim, hidden CLI option, optional
provider, CI secret, or skipped test. A capability may be proposed only after
the vertical slice has real users or multiple meaningful candidate datasets,
and the proposal must define its own observable acceptance contract, threat
boundary, rollback, and artifact impact. Cloud resources, credentials,
deployment, and automatic promotion require separate explicit approval.

The current extension seam is evidence, not orchestration: add a separately
reviewed input or artifact contract, prove it through the public CLI with a
negative control, and keep the existing deterministic Docker path fail-closed.
