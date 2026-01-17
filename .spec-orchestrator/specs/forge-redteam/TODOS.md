# forge-redteam Implementation TODOs

## Current State Analysis

**Existing**: Stub function returning `{pass: true, findings: []}`

**Spec Requirements**:
1. Attack scenarios: prompt injection, tool misuse, egress escalation, PII extraction
2. Runner: execute attacks via exec layer with sandbox+ledger
3. Scoring: rate findings by severity/likelihood
4. Gating: mark candidate as failed if high-severity
5. Configurable via scenarios file
6. Output JSON report with repro steps

---

## Implementation Tasks

### Task 1: Define Attack Scenarios
**Files**: `src/types.ts` (new), `src/scenarios.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Define AttackScenario interface
- [ ] Define Finding interface (severity, likelihood, repro)
- [ ] Built-in scenarios: prompt injection, tool misuse, egress, PII
- [ ] Load custom scenarios from file
- [ ] Scenario configuration (enabled/disabled)

### Task 2: Attack Runner Implementation
**File**: `src/redteamRunner.ts`
**Priority**: HIGH
**Effort**: 2.5 units

- [ ] Execute each scenario against candidate
- [ ] Capture traces and responses
- [ ] Detect violations (unexpected behavior)
- [ ] Rate findings by severity
- [ ] Generate report with repro steps

### Task 3: Attack Detection Logic
**File**: `src/detectors.ts` (new)
**Priority**: HIGH
**Effort**: 1.5 units

- [ ] Prompt injection detector (system prompt leakage)
- [ ] Tool misuse detector (unauthorized tool calls)
- [ ] Egress escalation detector (policy violations)
- [ ] PII extraction detector (sensitive data in output)
- [ ] Pattern matching and heuristics

### Task 4: Report Generation
**File**: `src/reporter.ts` (new)
**Priority**: MEDIUM
**Effort**: 0.5 units

- [ ] Format findings as JSON report
- [ ] Include: scenario, severity, likelihood, repro
- [ ] Summary suitable for operator UI
- [ ] Markdown-friendly output option

### Task 5: Add Dependencies
**File**: `package.json`
**Priority**: HIGH
**Effort**: 0.5 units

- [ ] Add forge-exec dependency
- [ ] Add forge-core dependency

---

## Estimated Budget: 7 units
**Actual allocation**: Task 1 (2) + Task 2 (2.5) + Task 3 (1.5) + Task 4 (0.5) + Task 5 (0.5) = 7 units
