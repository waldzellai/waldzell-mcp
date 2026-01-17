# Reynard ADAS Dependency Graph

## Visual Representation

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOUNDATION LAYER (Parallel)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  forge-core         forge-ledger       forge-sandbox           │
│  (types, hash)      (idempotency)      (Docker driver)         │
│                                                                 │
└────┬───────────────────┬───────────────────┬────────────────────┘
     │                   │                   │
     │                   │                   │
┌────┴───────────────────┴───────────────────┴────────────────────┐
│              GENERATION & EXECUTION LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  forge-proposer ──────> forge-exec ◄─────── forge-contracts   │
│  (LLM generation)       (graph execution)   (contract tests)   │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                    EVALUATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│       forge-eval                    forge-redteam              │
│       (functional/chaos/            (security testing)          │
│        idempotency suites)                                      │
│                                                                 │
└────┬──────────────────────────────────────────┬─────────────────┘
     │                                          │
     │                                          │
┌────┴──────────────────────────────────────────┴─────────────────┐
│                    INTERFACE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  forge-ui                          forge-cli                   │
│  (operator UI)                     (CLI commands)               │
│                                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                    INTEGRATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        adas-system                              │
│                (end-to-end orchestration)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Dependencies

| Package | Direct Dependencies | Transitive Dependencies |
|---------|-------------------|------------------------|
| forge-core | None | None |
| forge-ledger | None | None |
| forge-sandbox | None | None |
| forge-contracts | (optional: sandbox) | None |
| forge-proposer | core | None |
| forge-exec | core, sandbox, ledger | None |
| forge-eval | exec, sandbox, ledger | core |
| forge-redteam | exec, sandbox, ledger | core |
| forge-ui | proposer, exec, eval, redteam | core, sandbox, ledger |
| forge-cli | ALL (core through adas-system) | ALL |
| adas-system | ALL via forge-cli | ALL |

## Critical Path

The critical path (longest dependency chain) runs through:

```
forge-core → forge-exec → forge-eval → forge-ui → forge-cli → adas-system
```

**Path length**: 6 hops
**Estimated budget**: 8 + 12 + 10 + 10 + 10 + 10 = 60 units

## Parallelization Opportunities

### Phase 1: Foundation (4 parallel)
- forge-core
- forge-ledger
- forge-sandbox
- forge-contracts

### Phase 2: After core complete (1 task)
- forge-proposer

### Phase 3: After core + ledger + sandbox complete (1 task)
- forge-exec

### Phase 4: After exec complete (2 parallel)
- forge-eval
- forge-redteam

### Phase 5: After eval + redteam complete (2 parallel)
- forge-ui
- forge-cli (can start but won't complete until all deps done)

### Phase 6: After cli complete (1 task)
- adas-system

## Blocking Analysis

| Spec | Blocks | Blocked By |
|------|--------|------------|
| forge-core | proposer, exec | None |
| forge-ledger | exec | None |
| forge-sandbox | exec | None |
| forge-contracts | None | None |
| forge-proposer | ui, cli | core |
| forge-exec | eval, redteam, ui, cli | core, sandbox, ledger |
| forge-eval | ui, cli | exec |
| forge-redteam | ui, cli | exec |
| forge-ui | cli | proposer, exec, eval, redteam |
| forge-cli | adas-system | ALL except adas-system |
| adas-system | None | cli (and transitively, ALL) |

## Risk Assessment

**High-Risk Dependencies**:
- forge-exec is on the critical path and blocks 4 other packages
- forge-core blocks the entire generation layer
- forge-cli has the most dependencies (all packages)

**Mitigation Strategy**:
1. Prioritize foundation layer to unblock multiple downstream packages
2. Allocate sufficient budget to forge-exec given its criticality
3. Consider stub implementations for forge-cli during development of other packages
4. Run integration tests early and often given deep dependency chains
