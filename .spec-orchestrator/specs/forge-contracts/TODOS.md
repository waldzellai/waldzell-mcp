# forge-contracts Implementation TODOs

## Current State Analysis

**Existing**: Stub function `runContracts` that returns `{pass: true}`

**Spec Requirements**:
1. Discovery: scan for contracts/ directory or annotated tests
2. Execution: run property and fuzz tests
3. Semver gates: enforce version compatibility based on results
4. API: return structured result with failures, coverage, suggested version bump

---

## Implementation Tasks

### Task 1: Contract Discovery
**File**: `src/contractRunner.ts`
**Priority**: HIGH
**Effort**: 1.5 units

- [ ] Scan componentPath for contracts/ directory
- [ ] Look for test files (*.test.ts, *.spec.ts)
- [ ] Support configurable locations via contract.json
- [ ] Return list of discovered contract files

### Task 2: Contract Execution
**File**: `src/contractRunner.ts`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Execute tests via Node.js child_process
- [ ] Capture pass/fail status
- [ ] Capture test output and errors
- [ ] Support property tests and fuzz tests
- [ ] Detect flaky tests (multiple runs)

### Task 3: Result Structuring
**Files**: `src/contractRunner.ts`, `src/types.ts` (new)
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Define ContractResult interface
- [ ] Include: pass/fail, failures array, coverage, logs
- [ ] Include: suggested semver bump (major/minor/patch)
- [ ] Human-readable summary

### Task 4: Semver Gates
**File**: `src/semver.ts` (new)
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Analyze breaking changes vs additions
- [ ] Suggest version bump: major (breaking), minor (additions), patch (fixes)
- [ ] Mark component as incompatible if breaking
- [ ] Clear warnings for UI

### Task 5: Minimal Implementation (MVP)
**Priority**: HIGH if budget limited
**Effort**: 0.5 units

- [ ] Return structure even if no tests found
- [ ] Warning for missing contracts (not crash)
- [ ] Sensible defaults (patch bump if tests pass)
- [ ] Export types and runner

---

## Estimated Budget: 6 units
**Actual allocation**: Task 1 (1.5) + Task 2 (2) + Task 3 (1) + Task 4 (1) + Task 5 (0.5) = 6 units
