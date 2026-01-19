# forge-core Implementation TODOs

## Current State Analysis

**Existing Scaffolding:**
- Basic type definitions (ModelPin, ToolSpec, SandboxPolicy, CandidateManifest, GraphSpec, etc.)
- Basic hashObject implementation (NOT deterministic)
- Manifest read/write functions (no validation)
- Novelty scoring framework (stub implementations)

**Issues Found:**
- hashObject uses JSON.stringify which doesn't guarantee key order → NOT deterministic
- No zod schemas or validation
- NodeSpec is incomplete (TODO comment for detail)
- Novelty algorithms are placeholders
- No UUID generation utility
- No time-safe JSON stringify

---

## Implementation Tasks

### Task 1: Fix Types - Finalize NodeSpec
**File**: `src/types.ts`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Expand NodeSpec to include tool/llm/router/critic-specific fields
- [ ] Add toolId, config for tool nodes
- [ ] Add modelPin, prompt template for llm nodes
- [ ] Add condition logic for router nodes
- [ ] Add verdict schema for critic nodes
- [ ] Ensure all fields are properly typed

### Task 2: Add Validation - Zod Schemas
**Files**: `src/manifest.ts`, `src/validation.ts` (new)
**Priority**: HIGH
**Effort**: 3 units

- [ ] Install zod dependency (add to package.json)
- [ ] Create zod schemas for all core types (ModelPin, ToolSpec, SandboxPolicy, CandidateManifest, GraphSpec, etc.)
- [ ] Implement schema validation in readManifest with descriptive errors
- [ ] Implement schema validation in writeManifest
- [ ] Add defaulting for optional fields
- [ ] Export schemas for use by other packages
- [ ] Add validation error types with field paths

### Task 3: Fix Hashing - Deterministic Implementation
**File**: `src/hash.ts`
**Priority**: HIGH
**Effort**: 1 unit

- [ ] Replace JSON.stringify with deterministic serialization
- [ ] Sort object keys recursively before hashing
- [ ] Ensure consistent handling of undefined/null
- [ ] Test with same object in different key orders → same hash
- [ ] Test with different seeds/pins → different hash

### Task 4: Implement Novelty - Nearest Neighbor & Algorithms
**Files**: `src/novelty/*.ts`
**Priority**: MEDIUM
**Effort**: 1.5 units

- [ ] Implement nearest neighbor search over archive by behavioral distance
- [ ] Improve behavioral distance (currently crude step count diff)
- [ ] Validate structural delta Jaccard implementation
- [ ] Improve size penalty to consider LOC from budgets field
- [ ] Add configurable thresholds support
- [ ] Return detailed component scores
- [ ] Handle empty archive case properly

### Task 5: Add Utilities
**File**: `src/utils.ts` (new)
**Priority**: LOW
**Effort**: 0.5 units

- [ ] Add UUID generation helper (crypto.randomUUID or uuid package)
- [ ] Add time-safe JSON stringify (deterministic serialization)
- [ ] Export utilities from index.ts

---

## Acceptance Criteria (from spec)

### AC1: Invalid manifests reject with specific field path
- [ ] Test: invalid modelPin provider → error with path "modelPins.planner.provider"
- [ ] Test: missing required field → error with field path
- [ ] Test: wrong type → error with field and expected type

### AC2: Same manifest yields same hash across runs
- [ ] Test: create manifest, hash it, create same manifest with keys in different order, hash → same hash
- [ ] Test: different seeds → different hash
- [ ] Test: different sandbox pins → different hash

### AC3: Novelty scoring runs against empty and populated archive
- [ ] Test: empty archive → pass (first candidate always novel)
- [ ] Test: populated archive → nearest neighbor found
- [ ] Test: thresholds enforced (below threshold → pass=false)

---

## Estimated Budget: 8 units
**Actual allocation**: Task 1 (2) + Task 2 (3) + Task 3 (1) + Task 4 (1.5) + Task 5 (0.5) = 8 units
