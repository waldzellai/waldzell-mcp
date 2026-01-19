# Spec Orchestrator Manifest

> **Session**: reynard-full-2026-01-17
> **Source**: reynard/specs/reynard-full/
> **Generated**: 2026-01-17T20:00:00Z

## Spec Inventory

Implementing the complete Reynard ADAS system from scaffold to operational pipeline.

### Foundation Layer - Budget: 23 units

| ID | Spec | Requirements | Complexity | Est. Budget | Dependencies |
|----|------|--------------|------------|-------------|--------------|
| forge-core | forge-core | 5 MUST | Medium | 8 | None |
| forge-ledger | forge-ledger | 5 MUST | Medium | 7 | None |
| forge-sandbox | forge-sandbox | 5 MUST | Medium | 8 | None |

**Goal**: Core types, validation, hashing, novelty scoring; intent ledger for idempotency; Docker sandbox driver with resource limits.

### Generation & Execution Layer - Budget: 34 units

| ID | Spec | Requirements | Complexity | Est. Budget | Dependencies |
|----|------|--------------|------------|-------------|--------------|
| forge-proposer | forge-proposer | 7 MUST + 3 SHOULD | High | 12 | core |
| forge-exec | forge-exec | 6 MUST + 2 SHOULD | High | 12 | core, sandbox, ledger |
| forge-contracts | forge-contracts | 4 MUST + 2 SHOULD | Medium | 6 | sandbox (optional) |

**Goal**: LLM-powered candidate generation with SpecWizard and Planner/Coder; deterministic graph execution with tracing; contract runner for property/fuzz tests.

### Evaluation Layer - Budget: 17 units

| ID | Spec | Requirements | Complexity | Est. Budget | Dependencies |
|----|------|--------------|------------|-------------|--------------|
| forge-eval | forge-eval | 6 MUST + 2 SHOULD | High | 10 | exec, sandbox, ledger |
| forge-redteam | forge-redteam | 4 MUST + 2 SHOULD | Medium | 7 | exec, sandbox, ledger |

**Goal**: Functional/chaos/idempotency evaluation suites; security testing with attack scenarios.

### Interface Layer - Budget: 20 units

| ID | Spec | Requirements | Complexity | Est. Budget | Dependencies |
|----|------|--------------|------------|-------------|--------------|
| forge-ui | forge-ui | 5 MUST + 2 SHOULD | Medium-High | 10 | artifacts from all |
| forge-cli | forge-cli | 8 commands MUST | High | 10 | ALL packages |

**Goal**: Operator UI for inspecting runs/traces/metrics; CLI commands driving full Reynard flow.

### Integration Layer - Budget: 10 units

| ID | Spec | Requirements | Complexity | Est. Budget | Dependencies |
|----|------|--------------|------------|-------------|--------------|
| adas-system | adas-system | 10 MUST | Highest | 10 | ALL packages |

**Goal**: End-to-end orchestration from TaskSpec → candidates → evaluation → selection → reproduction.

## Implementation Queue (Dependency Order)

```
PHASE 1: Foundation (Parallel)
1. forge-core (budget: 8) - READY
2. forge-ledger (budget: 7) - READY
3. forge-sandbox (budget: 8) - READY
4. forge-contracts (budget: 6) - READY

PHASE 2: Generation & Execution
5. forge-proposer (budget: 12) - BLOCKED by forge-core
6. forge-exec (budget: 12) - BLOCKED by forge-core, forge-sandbox, forge-ledger

PHASE 3: Evaluation
7. forge-eval (budget: 10) - BLOCKED by forge-exec
8. forge-redteam (budget: 7) - BLOCKED by forge-exec

PHASE 4: Interfaces
9. forge-ui (budget: 10) - BLOCKED by forge-proposer, forge-exec, forge-eval, forge-redteam
10. forge-cli (budget: 10) - BLOCKED by ALL packages

PHASE 5: Integration
11. adas-system (budget: 10) - BLOCKED by forge-cli
```

## Priority Recommendation

**Start with**: Foundation layer (forge-core, forge-ledger, forge-sandbox, forge-contracts) - 29 units total, all READY for parallel implementation.

## Success Criteria

- **Technical**: All MUST requirements implemented; acceptance tests pass
- **Integration**: End-to-end flow works (spec → propose → eval → select → reproduce)
- **Reproducibility**: Same manifest yields identical outputs
- **Quality**: Type-safe, deterministic hashing, proper error handling

## Expected Outcomes

After completion:
- Reynard repo goes from scaffold to fully operational ADAS pipeline
- Demo dataset runs successfully through full flow
- All packages export proper APIs for integration
- UI provides operator visibility into runs, traces, metrics
- Deterministic reproduction enables debugging and auditing
