# Reynard Full Spec Set

This folder contains implementation-ready specs to make the Reynard ADAS stack operational. Each subfolder maps to a package (plus one for the whole system). Implementing these specs should take the repo from scaffold to a runnable pipeline with deterministic reproduction.

Contents:
- `adas-system/` – end-to-end behavior and integration contracts.
- `forge-cli/`, `forge-core/`, `forge-proposer/`, `forge-exec/`, `forge-ledger/`, `forge-sandbox/`, `forge-eval/`, `forge-redteam/`, `forge-contracts/`, `forge-ui/` – package-level specs.

How to use:
1) Pick the package spec, implement all MUST/SHOULD items.
2) Run acceptance checks listed inside each spec.
3) For end-to-end, satisfy `adas-system` acceptance tests (propose → exec → eval → select → reproduce).
