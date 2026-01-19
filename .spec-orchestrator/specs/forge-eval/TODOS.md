# forge-eval Implementation TODOs

## Current State Analysis

**Existing**: Stub functions for all three suites
- runFunctionalSuite() returns {accuracy: 0, errorRate: 0}
- runChaosSuite() returns {latencyP95: 0, chaosDivergence: 0, retryHygieneScore: 0}
- runIdempotencySuite() returns {idempotencyPassRate: 1}
- runAllSuites() aggregates results

**Spec Requirements**:
1. Data loading from datasets/<project>/
2. Functional suite: run graph on goldens, compare outputs
3. Chaos suite: inject failures, measure resilience
4. Idempotency suite: verify ledger behavior
5. Support --smoke flag for quick subset
6. Output per-candidate metrics JSON

---

## Implementation Tasks

### Task 1: Data Loading Infrastructure
**Files**: `src/dataLoader.ts` (new), `src/types.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Define Dataset interfaces
- [ ] Load goldens.jsonl from datasets/<project>/
- [ ] Load chaos.yaml config
- [ ] Validate dataset schema
- [ ] Support smoke mode (subset of data)

### Task 2: Functional Suite Implementation
**File**: `src/suites/functional.ts`
**Priority**: HIGH
**Effort**: 2.5 units

- [ ] Load golden test cases
- [ ] Execute graph via forge-exec for each case
- [ ] Compare actual vs expected outputs
- [ ] Compute accuracy (correct/total)
- [ ] Compute errorRate (errors/total)
- [ ] Write detailed per-case results

### Task 3: Chaos Suite Implementation
**File**: `src/suites/chaos.ts`
**Priority**: MEDIUM
**Effort**: 2.5 units

- [ ] Wrap tool/LLM calls with chaos injectors
- [ ] Inject timeouts, jitter, 429/500 errors
- [ ] Measure latencyP95 across runs
- [ ] Measure chaosDivergence (output differences)
- [ ] Measure retryHygieneScore (proper backoff)
- [ ] Configurable chaos parameters

### Task 4: Idempotency Suite Implementation
**File**: `src/suites/idempotency.ts`
**Priority**: MEDIUM
**Effort**: 1.5 units

- [ ] Run side-effecting flow multiple times
- [ ] Verify ledger prevents duplicate commits
- [ ] Check compensation on errors
- [ ] Compute idempotencyPassRate
- [ ] Test with and without ledger

### Task 5: Runner API & Output
**Files**: `src/evalRunner.ts`, `src/output.ts` (new)
**Priority**: HIGH
**Effort**: 1 unit

- [ ] runAllSuites with smoke flag support
- [ ] Aggregate metrics from all suites
- [ ] Write metrics JSON to manifests/<id>/eval.json
- [ ] Include pass/fail per suite
- [ ] CLI-friendly progress reporting

### Task 6: Add Dependencies
**File**: `package.json`
**Priority**: HIGH
**Effort**: 0.5 units

- [ ] Add forge-exec dependency
- [ ] Add forge-core dependency
- [ ] Add js-yaml for chaos config parsing

---

## Estimated Budget: 10 units
**Actual allocation**: Task 1 (2) + Task 2 (2.5) + Task 3 (2.5) + Task 4 (1.5) + Task 5 (1) + Task 6 (0.5) = 10 units
