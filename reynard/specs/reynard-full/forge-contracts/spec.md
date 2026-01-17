# Spec: forge-contracts

Goal: contract runner that discovers and executes contract suites (property/fuzz/integration) for generated components, enforcing semantic version gates.

Functional (MUST):
1) Discovery: scan candidate archive for contracts/ directory or annotated tests; support config for locations.
2) Execution: run property and fuzz tests; capture pass/fail with logs; surface flaky detection (multiple runs).
3) Semver gates: enforce version compatibility based on contract results; block release if breaking changes detected.
4) API: `runContracts(componentPath)` returns structured result with failures, coverage, and suggested version bump.

SHOULD:
- Minimal runtime deps; reuse sandbox driver when side effects exist.
- Human-readable summary for UI.

Acceptance:
- Missing contracts yields clear warning (not crash).
- Failing contract marks component as incompatible and suggests semver bump.
- Fuzz seeds recorded for reproduction.
