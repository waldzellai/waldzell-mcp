/**
 * Store for managing collaborative reasoning sessions
 */

import { BaseStore } from './BaseStore.js';
import { CollaborativeSession, PersonaData, ContributionData } from '../../types/index.js';

/**
 * Specialized store for managing collaborative reasoning sessions
 */
export class CollaborativeStore extends BaseStore<CollaborativeSession> {
  /** Map of topics to their sessions */
  private topicSessions: Map<string, CollaborativeSession[]>;
  
  /** Map of persona IDs to their participation sessions */
  private personaParticipation: Map<string, Set<string>>;
  
  constructor() {
    super('CollaborativeStore');
    this.topicSessions = new Map();
    this.personaParticipation = new Map();
  }
  
  /**
   * Add a new collaborative session
   * @param id - Unique identifier
   * @param session - The collaborative session data
   */
  add(id: string, session: CollaborativeSession): void {
    this.data.set(id, session);
    
    // Track by topic
    const sessions = this.topicSessions.get(session.topic) || [];
    sessions.push(session);
    this.topicSessions.set(session.topic, sessions);
    
    // Track persona participation
    session.personas.forEach(persona => {
      const participation = this.personaParticipation.get(persona.id) || new Set();
      participation.add(id);
      this.personaParticipation.set(persona.id, participation);
    });
  }
  
  /**
   * Get all collaborative sessions
   * @returns Array of all sessions
   */
  getAll(): CollaborativeSession[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.topicSessions.clear();
    this.personaParticipation.clear();
  }
  
  /**
   * Get sessions by topic
   * @param topic - The topic to search for
   * @returns Array of sessions on that topic
   */
  getByTopic(topic: string): CollaborativeSession[] {
    // Exact match
    const exact = this.topicSessions.get(topic) || [];
    
    // Also find partial matches
    const partial = this.filter(session => 
      session.topic.toLowerCase().includes(topic.toLowerCase()) &&
      !exact.includes(session)
    );
    
    return [...exact, ...partial];
  }
  
  /**
   * Get sessions where a specific persona participated
   * @param personaId - The persona identifier
   * @returns Array of sessions with that persona
   */
  getByPersona(personaId: string): CollaborativeSession[] {
    const sessionIds = this.personaParticipation.get(personaId);
    if (!sessionIds) return [];
    
    return Array.from(sessionIds)
      .map(id => this.get(id))
      .filter((session): session is CollaborativeSession => session !== undefined);
  }
  
  /**
   * Get active sessions (those needing next contribution)
   * @returns Array of active sessions
   */
  getActiveSessions(): CollaborativeSession[] {
    return this.filter(session => session.nextContributionNeeded);
  }
  
  /**
   * Get sessions with consensus
   * @returns Array of sessions that reached consensus
   */
  getConsensusSession(): CollaborativeSession[] {
    return this.filter(session => 
      !!(session.consensusPoints && session.consensusPoints.length > 0)
    );
  }
  
  /**
   * Get sessions with unresolved disagreements
   * @returns Array of sessions with active disagreements
   */
  getDisagreementSessions(): CollaborativeSession[] {
    return this.filter(session => 
      !!(session.disagreements && 
      session.disagreements.some(d => !d.resolution))
    );
  }
  
  /**
   * Get contribution statistics for a session
   * @param sessionId - The session identifier
   * @returns Statistics about contributions
   */
  getContributionStats(sessionId: string): Record<string, any> | undefined {
    const session = this.get(sessionId);
    if (!session) return undefined;
    
    const stats: Record<string, any> = {
      totalContributions: session.contributions.length,
      byType: {} as Record<string, number>,
      byPersona: {} as Record<string, number>,
      averageConfidence: 0
    };
    
    let totalConfidence = 0;
    
    session.contributions.forEach(contrib => {
      // Count by type
      stats.byType[contrib.type] = (stats.byType[contrib.type] || 0) + 1;
      
      // Count by persona
      const personaName = session.personas.find(p => p.id === contrib.personaId)?.name || 'Unknown';
      stats.byPersona[personaName] = (stats.byPersona[personaName] || 0) + 1;
      
      totalConfidence += contrib.confidence;
    });
    
    stats.averageConfidence = session.contributions.length > 0 
      ? totalConfidence / session.contributions.length 
      : 0;
    
    return stats;
  }
  
  /**
   * Get overall statistics
   * @returns Comprehensive statistics
   */
  getStatistics(): Record<string, any> {
    const sessions = this.getAll();
    
    return {
      totalSessions: sessions.length,
      activeSessions: this.getActiveSessions().length,
      sessionsWithConsensus: this.getConsensusSession().length,
      sessionsWithDisagreements: this.getDisagreementSessions().length,
      averageContributions: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.contributions.length, 0) / sessions.length
        : 0,
      averagePersonas: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.personas.length, 0) / sessions.length
        : 0,
      stageDistribution: this.getStageDistribution()
    };
  }
  
  /**
   * Get distribution of sessions by stage
   * @returns Count of sessions in each stage
   */
  private getStageDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.forEach(session => {
      distribution[session.stage] = (distribution[session.stage] || 0) + 1;
    });
    
    return distribution;
  }
}