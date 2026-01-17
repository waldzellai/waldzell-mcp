# forge-cli Implementation TODOs

## Current State Analysis

**Existing**:
- Commander-based CLI structure
- 8 commands scaffolded: init, spec, propose, eval, redteam, select, reproduce, ui
- Config loading system (config.ts)
- Init command partially implemented
- Chalk for colored output

**Missing**:
- Command implementations (all TODOs)
- Integration with forge packages
- Error handling
- Progress reporting
- Config validation

---

## Implementation Tasks

### Task 1: Update Dependencies
**File**: `package.json`
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Add forge-core workspace dep
- [ ] Add forge-proposer workspace dep
- [ ] Add forge-exec workspace dep
- [ ] Add forge-eval workspace dep
- [ ] Add forge-redteam workspace dep
- [ ] Add forge-ui workspace dep

### Task 2: Implement `spec` Command
**File**: `src/commands/spec.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Load config
- [ ] Call runSpecWizard from forge-proposer
- [ ] Write TaskSpec to output file
- [ ] Error handling
- [ ] Progress reporting

### Task 3: Implement `propose` Command
**File**: `src/commands/propose.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Load spec.json
- [ ] Load config (provider, model)
- [ ] Call generateCandidate N times
- [ ] Write candidates to archives/
- [ ] Progress reporting
- [ ] Error handling

### Task 4: Implement `eval` Command
**File**: `src/commands/eval.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Load candidates from archives/
- [ ] Call runAllSuites from forge-eval
- [ ] Write metrics to results/
- [ ] Display summary
- [ ] Smoke mode support

### Task 5: Implement `redteam` Command
**File**: `src/commands/redteam.ts` (new)
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Load candidates
- [ ] Call runRedTeamSuite from forge-redteam
- [ ] Write report
- [ ] Display findings summary

### Task 6: Implement `select` Command
**File**: `src/commands/select.ts` (new)
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Load all candidate metrics
- [ ] Apply Pareto frontier selection
- [ ] Consider performance, novelty, complexity
- [ ] Write selected IDs to file

### Task 7: Implement `reproduce` Command
**File**: `src/commands/reproduce.ts` (new)
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Load manifest.json
- [ ] Re-run with same seeds/pins
- [ ] Verify determinism
- [ ] Display diff if any

---

## Estimated Budget: 10 units
**Actual allocation**: Task 1 (1) + Task 2 (2) + Task 3 (2) + Task 4 (2) + Task 5 (1) + Task 6 (1) + Task 7 (1) = 10 units
