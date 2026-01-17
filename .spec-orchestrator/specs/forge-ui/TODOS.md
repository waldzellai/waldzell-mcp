# forge-ui Implementation TODOs

## Current State Analysis

**Existing**:
- React + Vite setup
- Basic App component structure
- Stub components: RunsList, CandidateCompare, TraceViewer
- TypeScript types configured

**Missing**:
- Data models and API integration
- Complete component implementations
- Metrics display
- Redteam findings viewer
- Navigation and routing

---

## Implementation Tasks

### Task 1: Data Models & Types
**File**: `src/types.ts` (new)
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Define UI types for Run, Candidate, Trace, Metric, Finding
- [ ] Import from forge packages where possible
- [ ] Add display-specific types

### Task 2: RunsList Component
**File**: `src/components/RunsList.tsx`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Display list of evaluation runs
- [ ] Show run metadata (ID, timestamp, status)
- [ ] Show aggregate metrics per run
- [ ] Allow selection to view details
- [ ] Sort/filter capabilities

### Task 3: CandidateCompare Component
**File**: `src/components/CandidateCompare.tsx`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Side-by-side candidate comparison
- [ ] Display manifests, metrics, traces
- [ ] Highlight differences
- [ ] Visual metric comparison (charts/bars)
- [ ] Export comparison report

### Task 4: TraceViewer Component
**File**: `src/components/TraceViewer.tsx`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Display behavior trace
- [ ] Node-by-node execution flow
- [ ] Show inputs/outputs per node
- [ ] Timing information
- [ ] Error highlighting
- [ ] Expandable/collapsible nodes

### Task 5: Metrics Display
**File**: `src/components/MetricsDisplay.tsx` (new)
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Display eval metrics (accuracy, latency, etc.)
- [ ] Visual representation (progress bars, charts)
- [ ] Threshold indicators
- [ ] Color coding for pass/fail

### Task 6: Redteam Findings Viewer
**File**: `src/components/RedteamFindings.tsx` (new)
**Priority**: MEDIUM
**Effort**: 2 units

- [ ] Display security findings
- [ ] Group by severity/category
- [ ] Show scenario details
- [ ] Highlight critical issues
- [ ] Export findings report

---

## Estimated Budget: 10 units
**Actual allocation**: Task 1 (1) + Task 2 (2) + Task 3 (2) + Task 4 (2) + Task 5 (1) + Task 6 (2) = 10 units
