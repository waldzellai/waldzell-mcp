/**
 * Store for managing sequential thinking data with branching support
 */

import { BaseStore } from './BaseStore.js';
import { ThoughtData } from '../../types/index.js';

/**
 * Specialized store for managing thoughts with branching and revision support
 */
export class ThoughtStore extends BaseStore<ThoughtData> {
  /** Map of branch IDs to their thoughts */
  private branches: Map<string, ThoughtData[]>;
  
  /** Map of thought numbers to their revision history */
  private revisions: Map<number, ThoughtData[]>;
  
  constructor() {
    super('ThoughtStore');
    this.branches = new Map();
    this.revisions = new Map();
  }
  
  /**
   * Add a new thought to the store
   * @param id - Unique identifier for the thought
   * @param thought - The thought data to store
   */
  add(id: string, thought: ThoughtData): void {
    this.data.set(id, thought);
    
    // Track branches
    if (thought.branchId) {
      const branchThoughts = this.branches.get(thought.branchId) || [];
      branchThoughts.push(thought);
      this.branches.set(thought.branchId, branchThoughts);
    }
    
    // Track revisions
    if (thought.isRevision && thought.revisesThought !== undefined) {
      const revisionHistory = this.revisions.get(thought.revisesThought) || [];
      revisionHistory.push(thought);
      this.revisions.set(thought.revisesThought, revisionHistory);
    }
  }
  
  /**
   * Get all thoughts in chronological order
   * @returns Array of all thoughts
   */
  getAll(): ThoughtData[] {
    return Array.from(this.data.values()).sort((a, b) => 
      a.thoughtNumber - b.thoughtNumber
    );
  }
  
  /**
   * Clear all thoughts and associated data
   */
  clear(): void {
    this.data.clear();
    this.branches.clear();
    this.revisions.clear();
  }
  
  /**
   * Get thoughts for a specific branch
   * @param branchId - The branch identifier
   * @returns Array of thoughts in the branch
   */
  getBranch(branchId: string): ThoughtData[] {
    return this.branches.get(branchId) || [];
  }
  
  /**
   * Get all branches
   * @returns Map of branch IDs to their thoughts
   */
  getAllBranches(): Map<string, ThoughtData[]> {
    return new Map(this.branches);
  }
  
  /**
   * Get revision history for a thought
   * @param thoughtNumber - The original thought number
   * @returns Array of revisions for the thought
   */
  getRevisions(thoughtNumber: number): ThoughtData[] {
    return this.revisions.get(thoughtNumber) || [];
  }
  
  /**
   * Get the latest thought (highest thought number)
   * @returns The most recent thought or undefined
   */
  getLatest(): ThoughtData | undefined {
    const thoughts = this.getAll();
    return thoughts[thoughts.length - 1];
  }
  
  /**
   * Get thoughts in a specific range
   * @param start - Starting thought number (inclusive)
   * @param end - Ending thought number (inclusive)
   * @returns Array of thoughts in the range
   */
  getRange(start: number, end: number): ThoughtData[] {
    return this.getAll().filter(thought => 
      thought.thoughtNumber >= start && thought.thoughtNumber <= end
    );
  }
  
  /**
   * Get thoughts that need continuation
   * @returns Array of thoughts where nextThoughtNeeded is true
   */
  getPendingThoughts(): ThoughtData[] {
    return this.filter(thought => thought.nextThoughtNeeded);
  }
  
  /**
   * Count thoughts by type
   * @returns Object with counts for regular, revision, and branched thoughts
   */
  getStatistics(): {
    total: number;
    regular: number;
    revisions: number;
    branched: number;
    branches: number;
  } {
    const thoughts = this.getAll();
    return {
      total: thoughts.length,
      regular: thoughts.filter(t => !t.isRevision && !t.branchId).length,
      revisions: thoughts.filter(t => t.isRevision).length,
      branched: thoughts.filter(t => t.branchId).length,
      branches: this.branches.size
    };
  }
  
  /**
   * Export store data including branch and revision metadata
   */
  export(): Record<string, any> {
    return {
      thoughts: super.export(),
      branches: Object.fromEntries(this.branches),
      revisions: Object.fromEntries(
        Array.from(this.revisions).map(([k, v]) => [k.toString(), v])
      )
    };
  }
  
  /**
   * Import store data including branch and revision metadata
   */
  import(data: Record<string, any>): void {
    if (data.thoughts) {
      super.import(data.thoughts);
    }
    
    // Rebuild branch and revision maps
    this.branches.clear();
    this.revisions.clear();
    
    this.data.forEach((thought) => {
      if (thought.branchId) {
        const branchThoughts = this.branches.get(thought.branchId) || [];
        branchThoughts.push(thought);
        this.branches.set(thought.branchId, branchThoughts);
      }
      
      if (thought.isRevision && thought.revisesThought !== undefined) {
        const revisionHistory = this.revisions.get(thought.revisesThought) || [];
        revisionHistory.push(thought);
        this.revisions.set(thought.revisesThought, revisionHistory);
      }
    });
  }
}