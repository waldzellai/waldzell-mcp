# Reynard Reliability Lab

Reynard is an isolated pnpm workspace for one supported package:
`@waldzellai/agent-reliability-lab`. The package will execute an already-built
candidate in a fail-closed Docker sandbox, evaluate deterministic golden cases,
and compare the result with a recorded baseline.

The broad Reynard Forge prototype has been retired. LLM-driven generation,
multi-package orchestration, UI, and simulated acceptance paths are not part of
the supported reliability-lab boundary.

## Current state

This commit establishes only the single-package workspace and its structural
test. Behavioral source, deterministic fixtures, the Docker acceptance path,
and operator documentation arrive in later implementation tasks from the
[approved plan](./RELIABILITY_LAB_PLAN.md).

## Development

Use Node.js 20 or newer and pnpm 9:

```bash
pnpm install --frozen-lockfile
pnpm test:unit -- structure
```

The complete `pnpm verify` gate is intentionally unavailable until the later
behavioral and integration-test tasks have landed. No test suite is allowed to
pass with zero matching tests.
