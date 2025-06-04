/**
 * Store for managing debugging session data
 */

import { BaseStore } from './BaseStore.js';
import { DebuggingSession } from '../../types/index.js';

/**
 * Specialized store for managing debugging sessions
 */
export class DebuggingStore extends BaseStore<DebuggingSession> {
  /** Map of approach names to their sessions */
  private approachSessions: Map<string, DebuggingSession[]>;
  
  /** Map of issue keywords to related sessions */
  private issueIndex: Map<string, Set<string>>;
  
  constructor() {
    super('DebuggingStore');
    this.approachSessions = new Map();
    this.issueIndex = new Map();
  }
  
  /**
   * Add a new debugging session
   * @param id - Unique identifier
   * @param session - The debugging session data
   */
  add(id: string, session: DebuggingSession): void {
    this.data.set(id, session);
    
    // Track by approach
    const sessions = this.approachSessions.get(session.approachName) || [];
    sessions.push(session);
    this.approachSessions.set(session.approachName, sessions);
    
    // Index by issue keywords
    this.indexIssue(id, session.issue);
  }
  
  /**
   * Index issue keywords for search
   * @param sessionId - Session identifier
   * @param issue - Issue description
   */
  private indexIssue(sessionId: string, issue: string): void {
    // Extract keywords (simple tokenization)
    const keywords = issue.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3); // Only index words > 3 chars
    
    keywords.forEach(keyword => {
      const sessions = this.issueIndex.get(keyword) || new Set();
      sessions.add(sessionId);
      this.issueIndex.set(keyword, sessions);
    });
  }
  
  /**
   * Get all debugging sessions
   * @returns Array of all sessions
   */
  getAll(): DebuggingSession[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.approachSessions.clear();
    this.issueIndex.clear();
  }
  
  /**
   * Get sessions by approach
   * @param approachName - The debugging approach name
   * @returns Array of sessions using that approach
   */
  getByApproach(approachName: DebuggingSession['approachName']): DebuggingSession[] {
    return this.approachSessions.get(approachName) || [];
  }
  
  /**
   * Search sessions by issue keywords
   * @param keywords - Keywords to search for
   * @returns Array of matching sessions
   */
  searchByIssue(keywords: string): DebuggingSession[] {
    const searchTerms = keywords.toLowerCase().split(/\s+/);
    const matchingIds = new Set<string>();
    
    searchTerms.forEach(term => {
      const sessions = this.issueIndex.get(term);
      if (sessions) {
        sessions.forEach(id => matchingIds.add(id));
      }
    });
    
    return Array.from(matchingIds)
      .map(id => this.get(id))
      .filter((session): session is DebuggingSession => session !== undefined);
  }
  
  /**
   * Get successfully resolved sessions
   * @returns Array of sessions with resolutions
   */
  getResolvedSessions(): DebuggingSession[] {
    return this.filter(session => 
      session.resolution.trim().length > 0
    );
  }
  
  /**
   * Get statistics about debugging approaches
   * @returns Statistics object
   */
  getStatistics(): {
    totalSessions: number;
    resolvedSessions: number;
    approachUsage: Record<string, number>;
    successRate: number;
  } {
    const resolved = this.getResolvedSessions();
    const stats: Record<string, number> = {};
    
    this.approachSessions.forEach((sessions, approach) => {
      stats[approach] = sessions.length;
    });
    
    return {
      totalSessions: this.size(),
      resolvedSessions: resolved.length,
      approachUsage: stats,
      successRate: this.size() > 0 ? resolved.length / this.size() : 0
    };
  }
  
  /**
   * Get the most effective approach based on resolution rate
   * @returns Approach with highest success rate
   */
  getMostEffectiveApproach(): { approach: string; successRate: number } | undefined {
    let bestApproach: string | undefined;
    let bestRate = 0;
    
    this.approachSessions.forEach((sessions, approach) => {
      const resolved = sessions.filter(s => s.resolution && s.resolution.trim().length > 0);
      const rate = sessions.length > 0 ? resolved.length / sessions.length : 0;
      
      if (rate > bestRate) {
        bestRate = rate;
        bestApproach = approach;
      }
    });
    
    return bestApproach ? { approach: bestApproach, successRate: bestRate } : undefined;
  }
}