# forge-ledger Implementation TODOs

## Current State Analysis

**Existing Implementation:**
- FileLedger class with JSON file storage
- IntentRecord schema with intentId, toolId, inputHash, status, timestamps
- API methods: recordPrepare, recordCommit, recordCompensate, findByKey
- ProposalRecord tracking (bonus functionality)
- Atomic writes via temp file

**Issues Found:**
1. recordPrepare always creates NEW intent (no idempotency - doesn't check for existing)
2. No concurrency control (race conditions possible)
3. No payload field in IntentRecord (spec requires it)
4. No fsync for crash-safety
5. No checksum/corruption detection
6. findByKey only finds 'committed' intents (should find 'prepared' too for idempotency)

---

## Implementation Tasks

### Task 1: Fix Idempotency - recordPrepare
**File**: `src/ledger.ts`
**Priority**: HIGH
**Effort**: 1 unit

- [ ] recordPrepare should check findByKey first
- [ ] If existing intent found (prepared or committed), return existing intentId
- [ ] Only create new intent if no existing one
- [ ] Test: repeated prepare with same toolId+inputHash returns same intentId

### Task 2: Add Payload Field
**Files**: `src/ledger.ts`, `src/toolAdapter.ts`
**Priority**: MEDIUM
**Effort**: 0.5 units

- [ ] Add payload?: string field to IntentRecord
- [ ] Update recordPrepare to accept optional payload
- [ ] Store payload with intent record
- [ ] Update interface in toolAdapter.ts

### Task 3: Concurrency Control - Locking
**File**: `src/ledger.ts`
**Priority**: HIGH
**Effort**: 2 units

- [ ] Add in-memory lock mechanism (Map<key, Promise>)
- [ ] Wrap recordPrepare, recordCommit, recordCompensate with locks
- [ ] Lock by toolId+inputHash key
- [ ] Ensure sequential access for same key
- [ ] Test: concurrent prepare calls for same key

### Task 4: Crash Safety - Fsync
**File**: `src/ledger.ts`
**Priority**: MEDIUM
**Effort**: 1 unit

- [ ] Import fsync from fs
- [ ] Call fsync after writeFile in save()
- [ ] Handle fsync errors gracefully
- [ ] Add config option to disable fsync (for testing)

### Task 5: Integrity - Corruption Detection
**File**: `src/ledger.ts`
**Priority**: LOW (SHOULD)
**Effort**: 1.5 units

- [ ] Add checksum field to LedgerData
- [ ] Compute checksum on save (hash of proposals + intents)
- [ ] Verify checksum on load
- [ ] Throw error if checksum mismatch
- [ ] Add version field validation

### Task 6: Fix findByKey
**File**: `src/ledger.ts`
**Priority**: HIGH
**Effort**: 0.5 units

- [ ] findByKey should find 'prepared' OR 'committed' intents
- [ ] Return intentId if found in either state
- [ ] Update logic to match idempotency requirements

### Task 7: Validation - Status Transitions
**File**: `src/ledger.ts`
**Priority**: MEDIUM
**Effort**: 0.5 units

- [ ] recordCommit: reject if already compensated
- [ ] recordCompensate: reject if already committed
- [ ] Add clear error messages
- [ ] Test: commit after compensate → error

---

## Estimated Budget: 7 units
**Actual allocation**: Task 1 (1) + Task 2 (0.5) + Task 3 (2) + Task 4 (1) + Task 5 (1.5) + Task 6 (0.5) + Task 7 (0.5) = 7 units
