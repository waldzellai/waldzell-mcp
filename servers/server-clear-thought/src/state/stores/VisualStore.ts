/**
 * Store for managing visual reasoning data
 */

import { BaseStore } from './BaseStore.js';
import { VisualData, VisualElement } from '../../types/index.js';

/**
 * Specialized store for managing visual reasoning sessions
 */
export class VisualStore extends BaseStore<VisualData> {
  /** Map of diagram IDs to their operations */
  private diagramOperations: Map<string, VisualData[]>;
  
  /** Map of diagram types to their sessions */
  private diagramTypes: Map<string, Set<string>>;
  
  /** Current state of all diagrams (latest elements) */
  private diagramStates: Map<string, VisualElement[]>;
  
  constructor() {
    super('VisualStore');
    this.diagramOperations = new Map();
    this.diagramTypes = new Map();
    this.diagramStates = new Map();
  }
  
  /**
   * Add a new visual reasoning operation
   * @param id - Unique identifier
   * @param visual - The visual data
   */
  add(id: string, visual: VisualData): void {
    this.data.set(id, visual);
    
    // Track by diagram ID
    const operations = this.diagramOperations.get(visual.diagramId) || [];
    operations.push(visual);
    this.diagramOperations.set(visual.diagramId, operations);
    
    // Track by diagram type
    const diagrams = this.diagramTypes.get(visual.diagramType) || new Set();
    diagrams.add(visual.diagramId);
    this.diagramTypes.set(visual.diagramType, diagrams);
    
    // Update diagram state
    this.updateDiagramState(visual);
  }
  
  /**
   * Update the current state of a diagram based on operation
   * @param visual - The visual operation
   */
  private updateDiagramState(visual: VisualData): void {
    const currentState = this.diagramStates.get(visual.diagramId) || [];
    
    switch (visual.operation) {
      case 'create':
        if (visual.elements) {
          this.diagramStates.set(visual.diagramId, [...currentState, ...visual.elements]);
        }
        break;
        
      case 'update':
        if (visual.elements) {
          const updatedState = [...currentState];
          visual.elements.forEach(newElement => {
            const index = updatedState.findIndex(e => e.id === newElement.id);
            if (index >= 0) {
              updatedState[index] = newElement;
            } else {
              updatedState.push(newElement);
            }
          });
          this.diagramStates.set(visual.diagramId, updatedState);
        }
        break;
        
      case 'delete':
        if (visual.elements) {
          const deletedIds = new Set(visual.elements.map(e => e.id));
          const filteredState = currentState.filter(e => !deletedIds.has(e.id));
          this.diagramStates.set(visual.diagramId, filteredState);
        }
        break;
        
      case 'transform':
        // Transformations are handled like updates
        if (visual.elements) {
          const transformedState = [...currentState];
          visual.elements.forEach(element => {
            const index = transformedState.findIndex(e => e.id === element.id);
            if (index >= 0) {
              transformedState[index] = element;
            }
          });
          this.diagramStates.set(visual.diagramId, transformedState);
        }
        break;
    }
  }
  
  /**
   * Get all visual reasoning operations
   * @returns Array of all operations
   */
  getAll(): VisualData[] {
    return Array.from(this.data.values());
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.diagramOperations.clear();
    this.diagramTypes.clear();
    this.diagramStates.clear();
  }
  
  /**
   * Get operations for a specific diagram
   * @param diagramId - The diagram identifier
   * @returns Array of operations for that diagram
   */
  getByDiagram(diagramId: string): VisualData[] {
    return this.diagramOperations.get(diagramId) || [];
  }
  
  /**
   * Get all diagram IDs of a specific type
   * @param diagramType - The type of diagram
   * @returns Array of diagram IDs
   */
  getDiagramsByType(diagramType: VisualData['diagramType']): string[] {
    const diagrams = this.diagramTypes.get(diagramType);
    return diagrams ? Array.from(diagrams) : [];
  }
  
  /**
   * Get current state of a diagram
   * @param diagramId - The diagram identifier
   * @returns Current elements in the diagram
   */
  getDiagramState(diagramId: string): VisualElement[] {
    return this.diagramStates.get(diagramId) || [];
  }
  
  /**
   * Get operations by type
   * @param operation - The operation type
   * @returns Array of operations of that type
   */
  getByOperation(operation: VisualData['operation']): VisualData[] {
    return this.filter(visual => visual.operation === operation);
  }
  
  /**
   * Get active sessions needing next operation
   * @returns Array of active sessions
   */
  getActiveSessions(): VisualData[] {
    return this.filter(visual => visual.nextOperationNeeded);
  }
  
  /**
   * Get operations with insights
   * @returns Array of operations that generated insights
   */
  getInsightfulOperations(): VisualData[] {
    return this.filter(visual => 
      !!(visual.insight && visual.insight.trim().length > 0)
    );
  }
  
  /**
   * Get operations with hypotheses
   * @returns Array of operations that formed hypotheses
   */
  getHypothesisOperations(): VisualData[] {
    return this.filter(visual => 
      !!(visual.hypothesis && visual.hypothesis.trim().length > 0)
    );
  }
  
  /**
   * Calculate diagram complexity
   * @param diagramId - The diagram identifier
   * @returns Complexity metrics
   */
  getDiagramComplexity(diagramId: string): Record<string, any> {
    const state = this.getDiagramState(diagramId);
    const operations = this.getByDiagram(diagramId);
    
    const nodes = state.filter(e => e.type === 'node');
    const edges = state.filter(e => e.type === 'edge');
    const containers = state.filter(e => e.type === 'container');
    const annotations = state.filter(e => e.type === 'annotation');
    
    return {
      totalElements: state.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      containerCount: containers.length,
      annotationCount: annotations.length,
      operationCount: operations.length,
      connectionDensity: nodes.length > 1 
        ? edges.length / (nodes.length * (nodes.length - 1) / 2)
        : 0,
      transformationCount: operations.filter(o => o.operation === 'transform').length,
      insightCount: operations.filter(o => o.insight).length,
      hypothesisCount: operations.filter(o => o.hypothesis).length
    };
  }
  
  /**
   * Get diagram evolution timeline
   * @param diagramId - The diagram identifier
   * @returns Timeline of operations
   */
  getDiagramTimeline(diagramId: string): Array<{
    iteration: number;
    operation: string;
    elementCount: number;
    hasInsight: boolean;
    hasHypothesis: boolean;
  }> {
    const operations = this.getByDiagram(diagramId);
    
    return operations
      .sort((a, b) => a.iteration - b.iteration)
      .map(op => ({
        iteration: op.iteration,
        operation: op.operation,
        elementCount: op.elements?.length || 0,
        hasInsight: !!op.insight,
        hasHypothesis: !!op.hypothesis
      }));
  }
  
  /**
   * Find similar diagrams based on structure
   * @param diagramId - The diagram identifier
   * @returns Array of similar diagram IDs
   */
  findSimilarDiagrams(diagramId: string): string[] {
    const targetState = this.getDiagramState(diagramId);
    const targetComplexity = this.getDiagramComplexity(diagramId);
    
    const similar: Array<{ id: string; similarity: number }> = [];
    
    this.diagramStates.forEach((state, id) => {
      if (id === diagramId) return;
      
      const complexity = this.getDiagramComplexity(id);
      
      // Simple similarity based on element counts
      const nodeDiff = Math.abs(complexity.nodeCount - targetComplexity.nodeCount);
      const edgeDiff = Math.abs(complexity.edgeCount - targetComplexity.edgeCount);
      
      const similarity = 1 / (1 + nodeDiff + edgeDiff);
      
      if (similarity > 0.5) {
        similar.push({ id, similarity });
      }
    });
    
    return similar
      .sort((a, b) => b.similarity - a.similarity)
      .map(s => s.id);
  }
  
  /**
   * Get overall statistics
   * @returns Comprehensive statistics
   */
  getStatistics(): Record<string, any> {
    const operations = this.getAll();
    const diagrams = Array.from(this.diagramStates.keys());
    
    return {
      totalOperations: operations.length,
      totalDiagrams: diagrams.length,
      activeOperations: this.getActiveSessions().length,
      operationDistribution: this.getOperationDistribution(),
      diagramTypeDistribution: this.getDiagramTypeDistribution(),
      insightfulOperations: this.getInsightfulOperations().length,
      hypothesisOperations: this.getHypothesisOperations().length,
      averageOperationsPerDiagram: diagrams.length > 0
        ? operations.length / diagrams.length
        : 0,
      averageElementsPerDiagram: diagrams.length > 0
        ? diagrams.reduce((sum, id) => sum + this.getDiagramState(id).length, 0) / diagrams.length
        : 0
    };
  }
  
  /**
   * Get distribution by operation type
   */
  private getOperationDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.forEach(visual => {
      distribution[visual.operation] = (distribution[visual.operation] || 0) + 1;
    });
    
    return distribution;
  }
  
  /**
   * Get distribution by diagram type
   */
  private getDiagramTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    this.diagramTypes.forEach((diagrams, type) => {
      distribution[type] = diagrams.size;
    });
    
    return distribution;
  }
}