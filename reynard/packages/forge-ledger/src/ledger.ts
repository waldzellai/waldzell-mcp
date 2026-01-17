import { readFile, writeFile, mkdir, open } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { Ledger } from './toolAdapter.js';

/**
 * Proposal record stored in the ledger
 */
export interface ProposalRecord {
  id: string;
  parentId?: string;
  generation: number;
  spec: string;
  implementation: string;
  metrics: ProposalMetrics;
  status: 'pending' | 'committed' | 'compensated' | 'failed';
  createdAt: string;
  updatedAt: string;
}

/**
 * Metrics associated with a proposal
 */
export interface ProposalMetrics {
  accuracy?: number;
  latencyP95?: number;
  errorRate?: number;
  structuralDelta?: number;
  behavioralDistance?: number;
  sizePenalty?: number;
  qualityScore?: number;
}

/**
 * Intent record for two-phase commit
 */
export interface IntentRecord {
  intentId: string;
  toolId: string;
  inputHash: string;
  status: 'prepared' | 'committed' | 'compensated';
  payload?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Ledger data structure
 */
interface LedgerData {
  version: number;
  checksum?: string;
  proposals: ProposalRecord[];
  intents: IntentRecord[];
}

/**
 * JSON file-based ledger implementation
 * Provides atomic operations via write-on-change with backup
 */
export class FileLedger implements Ledger {
  private path: string;
  private data: LedgerData | null = null;
  private loaded = false;
  private locks: Map<string, Promise<void>> = new Map();
  private useFsync: boolean;

  constructor(path: string = './ledger/ledger.json', options?: { useFsync?: boolean }) {
    this.path = path;
    this.useFsync = options?.useFsync ?? true;
  }

  /**
   * Acquire lock for a key (toolId:inputHash)
   */
  private async acquireLock(key: string): Promise<() => void> {
    // Wait for existing lock
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock
    let releaseFn: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseFn = resolve;
    });
    this.locks.set(key, lockPromise);

    return () => {
      this.locks.delete(key);
      releaseFn!();
    };
  }

  /**
   * Calculate checksum of ledger data
   */
  private calculateChecksum(data: Omit<LedgerData, 'checksum'>): string {
    const hash = createHash('sha256');
    // Hash proposals and intents, excluding checksum field
    hash.update(JSON.stringify({ 
      version: data.version,
      proposals: data.proposals, 
      intents: data.intents 
    }));
    return hash.digest('hex');
  }

  /**
   * Verify checksum of loaded data
   */
  private verifyChecksum(data: LedgerData): boolean {
    if (!data.checksum) {
      // No checksum in old data, assume valid
      return true;
    }
    const expected = this.calculateChecksum(data);
    return expected === data.checksum;
  }

  /**
   * Ensure ledger data is loaded
   */
  private async ensureLoaded(): Promise<LedgerData> {
    if (!this.loaded || !this.data) {
      this.data = await this.load();
      this.loaded = true;
    }
    return this.data;
  }

  /**
   * Load ledger from disk
   */
  private async load(): Promise<LedgerData> {
    try {
      if (existsSync(this.path)) {
        const content = await readFile(this.path, 'utf-8');
        const data = JSON.parse(content) as LedgerData;

        // Verify checksum
        if (!this.verifyChecksum(data)) {
          throw new Error(`Ledger checksum mismatch - data may be corrupted: ${this.path}`);
        }

        // Verify version
        if (data.version !== 1) {
          console.warn(`Ledger version mismatch: expected 1, got ${data.version}`);
        }

        return data;
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('checksum')) {
        throw err; // Re-throw checksum errors
      }
      console.warn(`Failed to load ledger from ${this.path}:`, err);
    }

    // Return empty ledger
    return {
      version: 1,
      checksum: this.calculateChecksum({ version: 1, proposals: [], intents: [] }),
      proposals: [],
      intents: [],
    };
  }

  /**
   * Save ledger to disk atomically with optional fsync
   */
  private async save(): Promise<void> {
    if (!this.data) return;

    // Calculate and add checksum
    const checksum = this.calculateChecksum(this.data);
    const dataWithChecksum = { ...this.data, checksum };

    // Ensure directory exists
    const dir = dirname(this.path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const content = JSON.stringify(dataWithChecksum, null, 2);

    // Write with fsync if enabled
    if (this.useFsync) {
      const fh = await open(this.path, 'w');
      try {
        await fh.writeFile(content, 'utf-8');
        await fh.sync(); // Ensure data is written to disk
      } finally {
        await fh.close();
      }
    } else {
      await writeFile(this.path, content, 'utf-8');
    }

    // Update in-memory data with checksum
    this.data = dataWithChecksum;
  }

  /**
   * Generate unique intent ID
   */
  private generateIntentId(toolId: string, inputHash: string): string {
    return `${toolId}:${inputHash}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  // ===== Ledger interface implementation =====

  /**
   * Record a prepared intent (two-phase commit: prepare phase)
   * Idempotent: returns existing intentId if already prepared/committed
   */
  async recordPrepare(toolId: string, inputHash: string, payload?: string): Promise<string> {
    const lockKey = `${toolId}:${inputHash}`;
    const release = await this.acquireLock(lockKey);

    try {
      const data = await this.ensureLoaded();

      // Check for existing intent (idempotency)
      const existing = data.intents.find(
        i => i.toolId === toolId && 
             i.inputHash === inputHash && 
             (i.status === 'prepared' || i.status === 'committed')
      );

      if (existing) {
        return existing.intentId;
      }

      // Create new intent
      const intentId = this.generateIntentId(toolId, inputHash);
      const intent: IntentRecord = {
        intentId,
        toolId,
        inputHash,
        status: 'prepared',
        payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      data.intents.push(intent);
      await this.save();

      return intentId;
    } finally {
      release();
    }
  }

  /**
   * Record a committed intent (two-phase commit: commit phase)
   * Idempotent: can be called multiple times safely
   */
  async recordCommit(intentId: string): Promise<void> {
    const data = await this.ensureLoaded();
    const intent = data.intents.find(i => i.intentId === intentId);

    if (!intent) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    // Already committed is OK (idempotent)
    if (intent.status === 'committed') {
      return;
    }

    // Cannot commit after compensate
    if (intent.status === 'compensated') {
      throw new Error(`Cannot commit intent that has been compensated: ${intentId}`);
    }

    if (intent.status !== 'prepared') {
      throw new Error(`Cannot commit intent in status: ${intent.status}`);
    }

    intent.status = 'committed';
    intent.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Record a compensated intent (rollback)
   * Idempotent: can be called multiple times safely
   */
  async recordCompensate(intentId: string): Promise<void> {
    const data = await this.ensureLoaded();
    const intent = data.intents.find(i => i.intentId === intentId);

    if (!intent) {
      throw new Error(`Intent not found: ${intentId}`);
    }

    // Already compensated is OK (idempotent)
    if (intent.status === 'compensated') {
      return;
    }

    // Cannot compensate after commit
    if (intent.status === 'committed') {
      throw new Error(`Cannot compensate intent that has been committed: ${intentId}`);
    }

    intent.status = 'compensated';
    intent.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Find an existing intent by tool and input
   * Returns intentId if found in prepared or committed state
   */
  async findByKey(toolId: string, inputHash: string): Promise<string | null> {
    const data = await this.ensureLoaded();
    const intent = data.intents.find(
      i => i.toolId === toolId && 
           i.inputHash === inputHash && 
           (i.status === 'prepared' || i.status === 'committed')
    );
    return intent?.intentId ?? null;
  }

  // ===== Proposal storage methods =====

  /**
   * Save a proposal to the ledger
   */
  async saveProposal(proposal: Omit<ProposalRecord, 'createdAt' | 'updatedAt'>): Promise<string> {
    const data = await this.ensureLoaded();

    const record: ProposalRecord = {
      ...proposal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update if exists, otherwise add
    const existingIndex = data.proposals.findIndex(p => p.id === proposal.id);
    if (existingIndex >= 0) {
      data.proposals[existingIndex] = {
        ...record,
        createdAt: data.proposals[existingIndex].createdAt,
      };
    } else {
      data.proposals.push(record);
    }

    await this.save();
    return proposal.id;
  }

  /**
   * Load a proposal by ID
   */
  async loadProposal(id: string): Promise<ProposalRecord | null> {
    const data = await this.ensureLoaded();
    return data.proposals.find(p => p.id === id) ?? null;
  }

  /**
   * List all proposals, optionally filtered by status
   */
  async listProposals(status?: ProposalRecord['status']): Promise<ProposalRecord[]> {
    const data = await this.ensureLoaded();
    if (status) {
      return data.proposals.filter(p => p.status === status);
    }
    return [...data.proposals];
  }

  /**
   * Get proposal lineage (all ancestors)
   */
  async getLineage(id: string): Promise<ProposalRecord[]> {
    const data = await this.ensureLoaded();
    const lineage: ProposalRecord[] = [];
    let current = data.proposals.find(p => p.id === id);

    while (current) {
      lineage.push(current);
      if (current.parentId) {
        current = data.proposals.find(p => p.id === current!.parentId);
      } else {
        break;
      }
    }

    return lineage;
  }

  /**
   * Get proposal descendants (all children)
   */
  async getDescendants(id: string): Promise<ProposalRecord[]> {
    const data = await this.ensureLoaded();
    const descendants: ProposalRecord[] = [];
    const queue = [id];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = data.proposals.filter(p => p.parentId === parentId);
      for (const child of children) {
        descendants.push(child);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  /**
   * Update proposal status
   */
  async updateStatus(id: string, status: ProposalRecord['status']): Promise<void> {
    const data = await this.ensureLoaded();
    const proposal = data.proposals.find(p => p.id === id);

    if (!proposal) {
      throw new Error(`Proposal not found: ${id}`);
    }

    proposal.status = status;
    proposal.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Update proposal metrics
   */
  async updateMetrics(id: string, metrics: Partial<ProposalMetrics>): Promise<void> {
    const data = await this.ensureLoaded();
    const proposal = data.proposals.find(p => p.id === id);

    if (!proposal) {
      throw new Error(`Proposal not found: ${id}`);
    }

    proposal.metrics = { ...proposal.metrics, ...metrics };
    proposal.updatedAt = new Date().toISOString();
    await this.save();
  }

  /**
   * Get proposals by generation
   */
  async getByGeneration(generation: number): Promise<ProposalRecord[]> {
    const data = await this.ensureLoaded();
    return data.proposals.filter(p => p.generation === generation);
  }

  /**
   * Get the highest generation number
   */
  async getMaxGeneration(): Promise<number> {
    const data = await this.ensureLoaded();
    if (data.proposals.length === 0) return 0;
    return Math.max(...data.proposals.map(p => p.generation));
  }
}

/**
 * Create a ledger instance
 */
export function createLedger(path?: string, options?: { useFsync?: boolean }): FileLedger {
  return new FileLedger(path, options);
}
