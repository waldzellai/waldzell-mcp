/**
 * Store for managing systems thinking data
 */

import { BaseStore } from './BaseStore.js';
import { SystemsData } from '../../types/index.js';

/**
 * Specialized store for managing systems thinking sessions
 */
export class SystemsStore extends BaseStore<SystemsData> {
  /** Map of system names to their analysis sessions */
  private systemAnalyses: Map<string, SystemsData[]>;
  
  /** Map of components to systems containing them */
  private componentIndex: Map<string, Set<string>>;
  
  constructor() {
    super('SystemsStore');
    this.systemAnalyses = new Map();
    this.componentIndex = new Map();
  }
  
  /**
   * Add a new systems thinking session
   * @param id - Unique identifier
   * @param system - The systems data
   */
  add(id: string, system: SystemsData): void {
    this.data.set(id, system);
    
    // Track by system name
    const analyses = this.systemAnalyses.get(system.system) || [];
    analyses.push(system);
    this.systemAnalyses.set(system.system, analyses);
    
    // Index components
    system.components.forEach(component => {
      const systems = this.componentIndex.get(component) || new Set();
      systems.add(id);
      this.componentIndex.set(component, systems);
    });
  }
  
  /**
   * Get all systems thinking sessions
   * @returns Array of all sessions
   */
  getAll(): SystemsData[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.systemAnalyses.clear();
    this.componentIndex.clear();
  }
  
  /**
   * Get analyses for a specific system
   * @param systemName - The system name
   * @returns Array of analyses for that system
   */
  getBySystem(systemName: string): SystemsData[] {
    const exact = this.systemAnalyses.get(systemName) || [];
    
    // Also find partial matches
    const partial = this.filter(system => 
      system.system.toLowerCase().includes(systemName.toLowerCase()) &&
      !exact.includes(system)
    );
    
    return [...exact, ...partial];
  }
  
  /**
   * Get systems containing a specific component
   * @param component - The component name
   * @returns Array of systems containing that component
   */
  getSystemsWithComponent(component: string): SystemsData[] {
    const systemIds = this.componentIndex.get(component);
    if (!systemIds) return [];
    
    return Array.from(systemIds)
      .map(id => this.get(id))
      .filter((system): system is SystemsData => system !== undefined);
  }
  
  /**
   * Get all unique components across all systems
   * @returns Array of component names
   */
  getAllComponents(): string[] {
    return Array.from(this.componentIndex.keys());
  }
  
  /**
   * Get active sessions needing more analysis
   * @returns Array of active sessions
   */
  getActiveSessions(): SystemsData[] {
    return this.filter(system => system.nextAnalysisNeeded);
  }
  
  /**
   * Get systems with feedback loops
   * @returns Array of systems with identified feedback loops
   */
  getSystemsWithFeedbackLoops(): SystemsData[] {
    return this.filter(system => system.feedbackLoops.length > 0);
  }
  
  /**
   * Get systems with positive feedback loops
   * @returns Array of systems with reinforcing loops
   */
  getSystemsWithPositiveFeedback(): SystemsData[] {
    return this.filter(system => 
      system.feedbackLoops.some(loop => loop.type === 'positive')
    );
  }
  
  /**
   * Get systems with negative feedback loops
   * @returns Array of systems with balancing loops
   */
  getSystemsWithNegativeFeedback(): SystemsData[] {
    return this.filter(system => 
      system.feedbackLoops.some(loop => loop.type === 'negative')
    );
  }
  
  /**
   * Calculate system complexity metrics
   * @param sessionId - The session identifier
   * @returns Complexity metrics
   */
  getComplexityMetrics(sessionId: string): Record<string, any> | undefined {
    const system = this.get(sessionId);
    if (!system) return undefined;
    
    const totalRelationships = system.relationships.length;
    const totalComponents = system.components.length;
    
    return {
      componentCount: totalComponents,
      relationshipCount: totalRelationships,
      connectionDensity: totalComponents > 1 
        ? totalRelationships / (totalComponents * (totalComponents - 1) / 2)
        : 0,
      feedbackLoopCount: system.feedbackLoops.length,
      positiveFeedbackLoops: system.feedbackLoops.filter(l => l.type === 'positive').length,
      negativeFeedbackLoops: system.feedbackLoops.filter(l => l.type === 'negative').length,
      emergentPropertyCount: system.emergentProperties.length,
      leveragePointCount: system.leveragePoints.length,
      averageRelationshipStrength: this.calculateAverageRelationshipStrength(system),
      complexity: this.calculateComplexityScore(system)
    };
  }
  
  /**
   * Calculate average relationship strength
   * @param system - The system data
   * @returns Average strength or 0
   */
  private calculateAverageRelationshipStrength(system: SystemsData): number {
    const strengths = system.relationships
      .map(r => r.strength)
      .filter((s): s is number => s !== undefined);
    
    return strengths.length > 0 
      ? strengths.reduce((sum, s) => sum + s, 0) / strengths.length
      : 0;
  }
  
  /**
   * Calculate complexity score
   * @param system - The system data
   * @returns Complexity score (0-1)
   */
  private calculateComplexityScore(system: SystemsData): number {
    const factors = [
      Math.min(system.components.length / 20, 1), // Component count factor
      Math.min(system.relationships.length / 50, 1), // Relationship count factor
      Math.min(system.feedbackLoops.length / 10, 1), // Feedback loop factor
      Math.min(system.emergentProperties.length / 5, 1), // Emergent properties factor
      Math.min(system.leveragePoints.length / 5, 1) // Leverage points factor
    ];
    
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }
  
  /**
   * Find related systems (sharing components)
   * @param sessionId - The session identifier
   * @returns Array of related systems
   */
  findRelatedSystems(sessionId: string): SystemsData[] {
    const system = this.get(sessionId);
    if (!system) return [];
    
    const related = new Set<string>();
    
    // Find systems sharing components
    system.components.forEach(component => {
      const systemIds = this.componentIndex.get(component);
      if (systemIds) {
        systemIds.forEach(id => {
          if (id !== sessionId) related.add(id);
        });
      }
    });
    
    return Array.from(related)
      .map(id => this.get(id))
      .filter((s): s is SystemsData => s !== undefined);
  }
  
  /**
   * Get component co-occurrence matrix
   * @returns Map of component pairs to occurrence count
   */
  getComponentCoOccurrence(): Map<string, number> {
    const coOccurrence = new Map<string, number>();
    
    this.forEach(system => {
      // Generate all component pairs
      for (let i = 0; i < system.components.length; i++) {
        for (let j = i + 1; j < system.components.length; j++) {
          const pair = [system.components[i], system.components[j]].sort().join('::');
          coOccurrence.set(pair, (coOccurrence.get(pair) || 0) + 1);
        }
      }
    });
    
    return coOccurrence;
  }
  
  /**
   * Get overall statistics
   * @returns Comprehensive statistics
   */
  getStatistics(): Record<string, any> {
    const systems = this.getAll();
    
    return {
      totalSystems: systems.length,
      activeSystems: this.getActiveSessions().length,
      uniqueComponents: this.getAllComponents().length,
      systemsWithFeedback: this.getSystemsWithFeedbackLoops().length,
      totalFeedbackLoops: systems.reduce((sum, s) => sum + s.feedbackLoops.length, 0),
      totalEmergentProperties: systems.reduce((sum, s) => sum + s.emergentProperties.length, 0),
      totalLeveragePoints: systems.reduce((sum, s) => sum + s.leveragePoints.length, 0),
      averageComponents: systems.length > 0
        ? systems.reduce((sum, s) => sum + s.components.length, 0) / systems.length
        : 0,
      averageRelationships: systems.length > 0
        ? systems.reduce((sum, s) => sum + s.relationships.length, 0) / systems.length
        : 0,
      mostCommonComponents: this.getMostCommonComponents(5)
    };
  }
  
  /**
   * Get most common components
   * @param limit - Number of top components
   * @returns Array of components and counts
   */
  private getMostCommonComponents(limit: number): Array<{ component: string; count: number }> {
    const counts: Record<string, number> = {};
    
    this.componentIndex.forEach((systems, component) => {
      counts[component] = systems.size;
    });
    
    return Object.entries(counts)
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}