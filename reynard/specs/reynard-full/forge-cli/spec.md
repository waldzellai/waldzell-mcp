# Spec: forge-cli

Goal: CLI commands that drive the full Reynard flow with real implementations and clear UX.

Commands (MUST):
- `forge init`: create config + folder layout; refuse overwrite unless `--force`; print next steps.
- `forge spec`: run SpecWizard; write TaskSpec.json in `specs/`; exit non-zero on unresolved fields.
- `forge propose --num N`: call proposer planner+coder; write archives and manifests; stream progress; return candidate IDs.
- `forge eval [--project demo] [--smoke]`: run evalRunner; write metrics JSON per candidate; exit non-zero if any mandatory suite fails.
- `forge redteam`: run redteam suite; write findings.
- `forge select`: run selection on available eval/novelty metrics; print winners.
- `forge reproduce --manifest <path>`: load manifest and replay deterministically; emit outputs + metrics.
- `forge ui`: start UI dev server/build with helpful URL hints.

Behavior:
- Config: load `reynard.config.yaml`, show defaults applied, validate.
- Errors: friendly messages, exit codes >0; propagate underlying module errors with context.
- Logging: structured (stage, candidateId, path); `--verbose` increases detail.
- Paths: allow `--out-dir` overrides where relevant; default to repo layout (`archives/`, `manifests/`, `datasets/`).

Acceptance:
- Each command runs end-to-end using other packages (no TODO prints).
- Invalid config or missing files causes clear failure.
- Smoke run on demo dataset succeeds: propose ≥1 candidate, eval produces metrics, select outputs winners list.
