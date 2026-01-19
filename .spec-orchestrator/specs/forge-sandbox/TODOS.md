# forge-sandbox Implementation TODOs

## Current State Analysis

**Existing Implementation:**
- DockerDriver class with run() and testEgress()
- Resource limits: CPU, memory, timeout
- Read-only rootfs support
- Writable tmpfs mounts
- Network isolation (none or bridge)
- Environment variables
- Security hardening (cap-drop, no-new-privileges)
- Stdout/stderr capture
- Exit code handling

**Issues Found:**
1. No actual volume mounts for candidate archive/datasets (uses tmpfs instead)
2. No duration/bytes stats in return value
3. No optional streaming of logs
4. No Docker availability detection
5. No image caching mechanism
6. testEgress uses network: bridge even for blocked hosts (should test actual policy)

---

## Implementation Tasks

### Task 1: Add Volume Mounts for Archive/Datasets
**File**: `src/drivers/docker.ts`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Add archivePath, datasetPaths to SandboxRunOptions
- [ ] Mount archive as read-only volume at /candidate
- [ ] Mount datasets as read-only volumes at /datasets/<name>
- [ ] Ensure paths exist before mounting
- [ ] Add proper error handling for missing paths

### Task 2: Add Stats Tracking
**Files**: `src/drivers/docker.ts`, `src/sandbox.types.ts`
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Track execution start/end time
- [ ] Calculate duration in milliseconds
- [ ] Track stdout/stderr byte counts
- [ ] Return stats in result: { durationMs, stdoutBytes, stderrBytes }
- [ ] Update SandboxDriver interface return type

### Task 3: Optional Log Streaming
**File**: `src/drivers/docker.ts`
**Priority**: LOW (SHOULD)
**Effort**: 1.5 units

- [ ] Add optional onStdout, onStderr callbacks to run() options
- [ ] Call callbacks as data arrives (if provided)
- [ ] Still accumulate full output for return value
- [ ] Test with and without streaming

### Task 4: Docker Availability Check
**File**: `src/drivers/docker.ts`
**Priority**: MEDIUM (SHOULD)
**Effort**: 1 unit

- [ ] Add checkAvailability() method
- [ ] Run `docker version` to verify Docker is installed
- [ ] Return helpful error if Docker not found
- [ ] Call on driver initialization (with option to skip)
- [ ] Cache result to avoid repeated checks

### Task 5: Image Caching
**File**: `src/drivers/docker.ts`
**Priority**: LOW (SHOULD)
**Effort**: 1.5 units

- [ ] Track pulled images in memory (Set<string>)
- [ ] Check if image exists before pull (`docker images`)
- [ ] Pull missing images explicitly
- [ ] Add pullImage() helper method
- [ ] Handle pull failures gracefully

### Task 6: Fix testEgress Policy Enforcement
**File**: `src/drivers/docker.ts`
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] testEgress should pass egressAllowlist correctly
- [ ] Verify blocked hosts actually fail (network=none)
- [ ] Verify allowed hosts succeed
- [ ] Add clear error messages

---

## Estimated Budget: 8 units
**Actual allocation**: Task 1 (2) + Task 2 (1) + Task 3 (1.5) + Task 4 (1) + Task 5 (1.5) + Task 6 (1) = 8 units
