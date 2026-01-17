# forge-exec Implementation TODOs

## Current State Analysis

**Existing Implementation**:
- ✅ runGraph() main function with topological sort
- ✅ Budget enforcement (maxSteps, maxNodes, time/mem)
- ✅ Cancellation support
- ✅ Node execution framework (tool/llm/router/critic)
- ✅ Tool node execution via sandbox
- ✅ ExecutionTrace generation
- ✅ Error handling and propagation
- ✅ toBehaviorTrace() conversion

**Issues/Gaps**:
1. **No ledger integration** - tool nodes don't use prepare/commit/compensate
2. **Trace hashing incomplete** - uses placeholder hashes (req-${index})
3. **LLM/router/critic are stubs** - need basic implementations
4. **No retry logic** - spec requires retry/backoff for transient errors
5. **No streaming support** - spec mentions streaming/iterator for UI
6. **Cycle detection stub** - cycle.ts has TODO
7. **Missing package dependencies** - needs forge-core and forge-ledger imports

---

## Implementation Tasks

### Task 1: Add Ledger Integration
**File**: `src/executor.ts`
**Priority**: HIGH
**Effort**: 3 units

- [ ] Import Ledger from forge-ledger
- [ ] Add ledger to RunContext
- [ ] Implement prepare/commit/compensate flow for tool nodes
- [ ] Use inputHash for idempotency keys
- [ ] Handle ledger errors gracefully
- [ ] Only use ledger for side-effectful tools

### Task 2: Implement Real Trace Hashing
**Files**: `src/executor.ts`
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Import hashObject from forge-core
- [ ] Hash request data (node inputs)
- [ ] Hash response data (node outputs)
- [ ] Store hashes in BehaviorTrace
- [ ] Ensure deterministic hashing

### Task 3: Improve Node Implementations
**File**: `src/executor.ts`
**Priority**: MEDIUM
**Effort**: 2 units

- [ ] Router node: evaluate condition expressions
- [ ] Critic node: basic validation logic
- [ ] LLM node: placeholder with clear TODO for provider integration
- [ ] Map node.kind correctly in toBehaviorTrace

### Task 4: Add Retry Logic
**File**: `src/retry.ts` (new)
**Priority**: MEDIUM
**Effort**: 2 units

- [ ] Implement retry with exponential backoff
- [ ] Detect transient vs permanent errors
- [ ] Respect deterministic handling for non-idempotent tools
- [ ] Configurable retry limits

### Task 5: Implement Cycle Detection
**File**: `src/cycle.ts`
**Priority**: LOW
**Effort**: 1 unit

- [ ] Implement DFS-based cycle detection
- [ ] Return true if cycle found
- [ ] Called before execution starts

### Task 6: Add Dependencies
**File**: `package.json`
**Priority**: HIGH
**Effort**: 0.5 units

- [ ] Add forge-core dependency
- [ ] Add forge-ledger dependency
- [ ] Add forge-sandbox dependency

### Task 7: Streaming Support (SHOULD)
**File**: `src/executor.ts`
**Priority**: LOW (defer if budget tight)
**Effort**: 2.5 units

- [ ] Add optional callback for step completion
- [ ] Make runGraph return AsyncIterator option
- [ ] Emit events for UI consumption

---

## Estimated Budget: 12 units
**Actual allocation**: Task 1 (3) + Task 2 (1) + Task 3 (2) + Task 4 (2) + Task 5 (1) + Task 6 (0.5) + Task 7 (2.5, optional) = 12 units

**MVP Priority** (9.5 units): Tasks 1-6 (skip streaming for now)
