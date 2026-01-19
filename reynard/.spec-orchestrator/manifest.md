# Spec Orchestrator Manifest (reynard-full)

| Spec | Requirements | Complexity | Est. Budget | Dependencies |
|------|--------------|------------|-------------|--------------|
| forge-core | medium | 8 | 8 | - |
| forge-sandbox | medium | 10 | 10 | forge-core |
| forge-ledger | medium | 8 | 8 | forge-core |
| forge-proposer | high | 15 | 15 | forge-core |
| forge-exec | high | 15 | 15 | forge-core, forge-sandbox, forge-ledger |
| forge-eval | medium | 10 | 10 | forge-exec, forge-sandbox, forge-ledger |
| forge-redteam | medium | 6 | 6 | forge-exec, forge-sandbox, forge-ledger |
| forge-contracts | low | 5 | 5 | forge-sandbox |
| forge-ui | medium | 7 | 7 | forge-proposer, forge-exec, forge-eval, forge-redteam |
| forge-cli | medium | 8 | 8 | forge-core, forge-proposer, forge-exec, forge-eval, forge-redteam |
| adas-system | high | 8 | 8 | all above |

Total budget: 100 units
