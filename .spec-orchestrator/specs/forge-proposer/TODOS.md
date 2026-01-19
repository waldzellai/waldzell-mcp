# forge-proposer Implementation TODOs

## Current State Analysis

**Existing**:
- Provider types defined (LLMProvider interface)
- OpenAI and Anthropic provider stubs (work without API keys)
- Planner prompt template exists
- Stub functions for SpecWizard, Planner, Coder

**Missing**:
- SpecWizard validation and defaulting
- Planner LLM integration
- Coder code generation
- Manifest generation with deterministic hashing
- Provider integration
- Error handling

---

## Implementation Tasks

### Task 1: SpecWizard Implementation
**File**: `src/specWizard.ts`
**Priority**: HIGH
**Effort**: 2 units

- [x] Define complete TaskSpec interface
- [ ] Implement validation logic
- [ ] Add defaulting for optional fields
- [ ] Exit non-zero on unresolved/contradictory fields
- [ ] Support programmatic and interactive modes

### Task 2: Provider Integration
**Files**: `src/providers/index.ts`, update package.json
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Create provider factory
- [ ] Load provider from config
- [ ] Handle missing API keys gracefully
- [ ] Add dependencies to package.json

### Task 3: Planner Implementation
**File**: `src/planner.ts`
**Priority**: HIGH
**Effort**: 3 units

- [ ] Load and fill planner prompt template
- [ ] Call LLM provider with proper options
- [ ] Parse response into GraphSpec
- [ ] Validate generated graph
- [ ] Handle LLM errors
- [ ] Record model pins and seeds

### Task 4: Coder Implementation  
**File**: `src/coder.ts`
**Priority**: HIGH
**Effort**: 3 units

- [ ] Generate archive directory structure
- [ ] Create src/ with TypeScript code per node
- [ ] Generate tests/ with basic test scaffolding
- [ ] Create package.json with dependencies
- [ ] Generate CandidateManifest with all metadata
- [ ] Write manifest.json with deterministic hash

### Task 5: Manifest Generation
**File**: `src/manifestGenerator.ts` (new)
**Priority**: HIGH
**Effort**: 2 units

- [ ] Generate CandidateManifest from GraphSpec
- [ ] Include model pins (planner, coder, grader, attacker)
- [ ] Include tools, sandbox policy, seeds
- [ ] Include budgets (maxNodes, maxLOC, maxToolKinds)
- [ ] Compute manifest hash
- [ ] Write to archives/agents/<id>/manifest.json

### Task 6: Determinism & Seeds
**Files**: Various
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Accept seed parameter for reproducibility
- [ ] Generate deterministic UUIDs from seed
- [ ] Record seeds in manifest
- [ ] Same seed → same manifest hash

---

## Estimated Budget: 12 units
**Actual allocation**: Task 1 (2) + Task 2 (1) + Task 3 (3) + Task 4 (3) + Task 5 (2) + Task 6 (1) = 12 units
