# Spec Inventory: reynard-full

Specs and dependencies:
- `adas-system/system` (depends on all packages).
- `forge-cli/spec` (depends on core, proposer, exec, eval, redteam, selection).
- `forge-core/spec` (dependency for all).
- `forge-proposer/spec` (depends on core; feeds exec/eval).
- `forge-exec/spec` (depends on core, sandbox, ledger).
- `forge-ledger/spec` (used by exec, sandbox).
- `forge-sandbox/spec` (used by exec, eval).
- `forge-eval/spec` (depends on exec, sandbox, ledger).
- `forge-redteam/spec` (depends on exec, sandbox, ledger).
- `forge-contracts/spec` (depends on sandbox optionally).
- `forge-ui/spec` (consumes artifacts from proposer/exec/eval/redteam).
