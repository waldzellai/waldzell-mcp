/**
 * Main session state management class for the Clear Thought MCP server
 * 
 * This class manages all thinking session data and provides centralized
 * access to different types of thinking tools and their data.
 */

import { ServerConfig } from '../config.js';
import { 
  ThoughtData, 
  MentalModelData, 
  DebuggingSession,
  CollaborativeSession,
  DecisionData,
  MetacognitiveData,
  ScientificInquiryData,
  CreativeData,
  SystemsData,
  VisualData,
  SessionExport,
  ArgumentData,
  SocraticData
} from '../types/index.js';

// Import all stores
import { ThoughtStore } from './stores/ThoughtStore.js';
import { MentalModelStore } from './stores/MentalModelStore.js';
import { DebuggingStore } from './stores/DebuggingStore.js';
import { CollaborativeStore } from './stores/CollaborativeStore.js';
import { DecisionStore } from './stores/DecisionStore.js';
import { MetacognitiveStore } from './stores/MetacognitiveStore.js';
import { ScientificStore } from './stores/ScientificStore.js';
import { CreativeStore } from './stores/CreativeStore.js';
import { SystemsStore } from './stores/SystemsStore.js';
import { VisualStore } from './stores/VisualStore.js';

/**
 * Comprehensive session statistics
 */
export interface SessionStatistics {
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  thoughtCount: number;
  toolsUsed: string[];
  totalOperations: number;
  isActive: boolean;
  remainingThoughts: number;
  stores: {
    thoughts: Record<string, any>;
    mentalModels: Record<string, any>;
    debugging: Record<string, any>;
    collaborative: Record<string, any>;
    decisions: Record<string, any>;
    metacognitive: Record<string, any>;
    scientific: Record<string, any>;
    creative: Record<string, any>;
    systems: Record<string, any>;
    visual: Record<string, any>;
  };
}

/**
 * Main session state class
 */
export class SessionState {
  /** Unique session identifier */
  readonly sessionId: string;
  
  /** Server configuration */
  private readonly config: ServerConfig;
  
  /** Session creation timestamp */
  private readonly createdAt: Date;
  
  /** Last access timestamp */
  private lastAccessedAt: Date;
  
  /** Timeout timer reference */
  private timeoutTimer?: NodeJS.Timeout;
  
  /** Data stores */
  private readonly thoughtStore: ThoughtStore;
  private readonly mentalModelStore: MentalModelStore;
  private readonly debuggingStore: DebuggingStore;
  private readonly collaborativeStore: CollaborativeStore;
  private readonly decisionStore: DecisionStore;
  private readonly metacognitiveStore: MetacognitiveStore;
  private readonly scientificStore: ScientificStore;
  private readonly creativeStore: CreativeStore;
  private readonly systemsStore: SystemsStore;
  private readonly visualStore: VisualStore;
  
  /**
   * Create a new session state
   * @param sessionId - Unique identifier for this session
   * @param config - Server configuration
   */
  constructor(sessionId: string, config: ServerConfig) {
    this.sessionId = sessionId;
    this.config = config;
    this.createdAt = new Date();
    this.lastAccessedAt = new Date();
    
    // Initialize all stores
    this.thoughtStore = new ThoughtStore();
    this.mentalModelStore = new MentalModelStore();
    this.debuggingStore = new DebuggingStore();
    this.collaborativeStore = new CollaborativeStore();
    this.decisionStore = new DecisionStore();
    this.metacognitiveStore = new MetacognitiveStore();
    this.scientificStore = new ScientificStore();
    this.creativeStore = new CreativeStore();
    this.systemsStore = new SystemsStore();
    this.visualStore = new VisualStore();
    
    // Start timeout timer
    this.resetTimeout();
  }
  
  /**
   * Reset the session timeout
   */
  private resetTimeout(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    
    this.timeoutTimer = setTimeout(() => {
      this.cleanup();
    }, this.config.sessionTimeout);
    
    this.lastAccessedAt = new Date();
  }
  
  /**
   * Touch the session to prevent timeout
   */
  touch(): void {
    this.resetTimeout();
  }
  
  // ============================================================================
  // Thought Management
  // ============================================================================
  
  /**
   * Add a new thought
   * @param thought - The thought data
   * @returns True if added, false if limit reached
   */
  addThought(thought: ThoughtData): boolean {
    this.touch();
    
    // Check thought limit
    if (this.thoughtStore.size() >= this.config.maxThoughtsPerSession) {
      return false;
    }
    
    const id = `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.thoughtStore.add(id, thought);
    return true;
  }
  
  /**
   * Get all thoughts
   */
  getThoughts(): ThoughtData[] {
    this.touch();
    return this.thoughtStore.getAll();
  }
  
  /**
   * Get remaining thought capacity
   */
  getRemainingThoughts(): number {
    return Math.max(0, this.config.maxThoughtsPerSession - this.thoughtStore.size());
  }
  
  // ============================================================================
  // Mental Model Management
  // ============================================================================
  
  /**
   * Add a mental model application
   */
  addMentalModel(model: MentalModelData): void {
    this.touch();
    const id = `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.mentalModelStore.add(id, model);
  }
  
  /**
   * Get all mental model applications
   */
  getMentalModels(): MentalModelData[] {
    this.touch();
    return this.mentalModelStore.getAll();
  }
  
  // ============================================================================
  // Debugging Management
  // ============================================================================
  
  /**
   * Add a debugging session
   */
  addDebuggingSession(session: DebuggingSession): void {
    this.touch();
    const id = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.debuggingStore.add(id, session);
  }
  
  /**
   * Get all debugging sessions
   */
  getDebuggingSessions(): DebuggingSession[] {
    this.touch();
    return this.debuggingStore.getAll();
  }
  
  // ============================================================================
  // Collaborative Reasoning Management
  // ============================================================================
  
  /**
   * Add a collaborative session
   */
  addCollaborativeSession(session: CollaborativeSession): void {
    this.touch();
    const id = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.collaborativeStore.add(id, session);
  }
  
  /**
   * Get all collaborative sessions
   */
  getCollaborativeSessions(): CollaborativeSession[] {
    this.touch();
    return this.collaborativeStore.getAll();
  }
  
  /**
   * Get a specific collaborative session by ID
   */
  getCollaborativeSession(sessionId: string): CollaborativeSession | undefined {
    this.touch();
    return this.collaborativeStore.find(s => s.sessionId === sessionId);
  }
  
  // ============================================================================
  // Decision Framework Management
  // ============================================================================
  
  /**
   * Add a decision session
   */
  addDecision(decision: DecisionData): void {
    this.touch();
    const id = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.decisionStore.add(id, decision);
  }
  
  /**
   * Get all decision sessions
   */
  getDecisions(): DecisionData[] {
    this.touch();
    return this.decisionStore.getAll();
  }
  
  /**
   * Get a specific decision by ID
   */
  getDecision(decisionId: string): DecisionData | undefined {
    this.touch();
    return this.decisionStore.find(d => d.decisionId === decisionId);
  }
  
  // ============================================================================
  // Metacognitive Monitoring Management
  // ============================================================================
  
  /**
   * Add a metacognitive monitoring session
   */
  addMetacognitive(session: MetacognitiveData): void {
    this.touch();
    const id = `meta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.metacognitiveStore.add(id, session);
  }
  
  /**
   * Get all metacognitive sessions
   */
  getMetacognitiveSessions(): MetacognitiveData[] {
    this.touch();
    return this.metacognitiveStore.getAll();
  }
  
  /**
   * Get a specific metacognitive session by ID
   */
  getMetacognitiveSession(monitoringId: string): MetacognitiveData | undefined {
    this.touch();
    return this.metacognitiveStore.find(m => m.monitoringId === monitoringId);
  }
  
  // ============================================================================
  // Scientific Method Management
  // ============================================================================
  
  /**
   * Add a scientific inquiry session
   */
  addScientificInquiry(inquiry: ScientificInquiryData): void {
    this.touch();
    const id = `sci-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.scientificStore.add(id, inquiry);
  }
  
  /**
   * Get all scientific inquiry sessions
   */
  getScientificInquiries(): ScientificInquiryData[] {
    this.touch();
    return this.scientificStore.getAll();
  }
  
  /**
   * Get a specific scientific inquiry by ID
   */
  getScientificInquiry(inquiryId: string): ScientificInquiryData | undefined {
    this.touch();
    return this.scientificStore.find(i => i.inquiryId === inquiryId);
  }
  
  // ============================================================================
  // Creative Thinking Management
  // ============================================================================
  
  /**
   * Add a creative thinking session
   */
  addCreativeSession(session: CreativeData): void {
    this.touch();
    const id = `creative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.creativeStore.add(id, session);
  }
  
  /**
   * Get all creative sessions
   */
  getCreativeSessions(): CreativeData[] {
    this.touch();
    return this.creativeStore.getAll();
  }
  
  // ============================================================================
  // Systems Thinking Management
  // ============================================================================
  
  /**
   * Add a systems thinking session
   */
  addSystemsAnalysis(system: SystemsData): void {
    this.touch();
    const id = `systems-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.systemsStore.add(id, system);
  }
  
  /**
   * Get all systems analyses
   */
  getSystemsAnalyses(): SystemsData[] {
    this.touch();
    return this.systemsStore.getAll();
  }
  
  // ============================================================================
  // Visual Reasoning Management
  // ============================================================================
  
  /**
   * Add a visual reasoning operation
   */
  addVisualOperation(visual: VisualData): void {
    this.touch();
    const id = `visual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.visualStore.add(id, visual);
  }
  
  /**
   * Get all visual operations
   */
  getVisualOperations(): VisualData[] {
    this.touch();
    return this.visualStore.getAll();
  }
  
  /**
   * Get visual operations for a specific diagram
   */
  getVisualDiagram(diagramId: string): VisualData[] {
    this.touch();
    return this.visualStore.getByDiagram(diagramId);
  }
  
  // ============================================================================
  // Argumentation Support (Socratic method uses ArgumentData)
  // ============================================================================
  
  /**
   * Add a Socratic/argumentation session
   * Note: Since SocraticData extends ArgumentData, we can store it directly
   */
  addArgumentation(argument: ArgumentData | SocraticData): void {
    this.touch();
    // For now, we'll store these in the creative store as a placeholder
    // In a real implementation, you might want a dedicated ArgumentStore
    const session: CreativeData = {
      prompt: argument.claim,
      ideas: argument.premises,
      techniques: ['socratic-method'],
      connections: [],
      insights: [argument.conclusion],
      sessionId: argument.sessionId,
      iteration: argument.iteration,
      nextIdeaNeeded: argument.nextArgumentNeeded
    };
    this.addCreativeSession(session);
  }
  
  // ============================================================================
  // Statistics and Export
  // ============================================================================
  
  /**
   * Get comprehensive session statistics
   */
  getStats(): SessionStatistics {
    this.touch();
    
    const toolsUsed = new Set<string>();
    let totalOperations = 0;
    
    // Check which tools have been used
    if (this.thoughtStore.size() > 0) {
      toolsUsed.add('sequential-thinking');
      totalOperations += this.thoughtStore.size();
    }
    if (this.mentalModelStore.size() > 0) {
      toolsUsed.add('mental-models');
      totalOperations += this.mentalModelStore.size();
    }
    if (this.debuggingStore.size() > 0) {
      toolsUsed.add('debugging');
      totalOperations += this.debuggingStore.size();
    }
    if (this.collaborativeStore.size() > 0) {
      toolsUsed.add('collaborative-reasoning');
      totalOperations += this.collaborativeStore.size();
    }
    if (this.decisionStore.size() > 0) {
      toolsUsed.add('decision-framework');
      totalOperations += this.decisionStore.size();
    }
    if (this.metacognitiveStore.size() > 0) {
      toolsUsed.add('metacognitive-monitoring');
      totalOperations += this.metacognitiveStore.size();
    }
    if (this.scientificStore.size() > 0) {
      toolsUsed.add('scientific-method');
      totalOperations += this.scientificStore.size();
    }
    if (this.creativeStore.size() > 0) {
      toolsUsed.add('creative-thinking');
      totalOperations += this.creativeStore.size();
    }
    if (this.systemsStore.size() > 0) {
      toolsUsed.add('systems-thinking');
      totalOperations += this.systemsStore.size();
    }
    if (this.visualStore.size() > 0) {
      toolsUsed.add('visual-reasoning');
      totalOperations += this.visualStore.size();
    }
    
    return {
      sessionId: this.sessionId,
      createdAt: this.createdAt,
      lastAccessedAt: this.lastAccessedAt,
      thoughtCount: this.thoughtStore.size(),
      toolsUsed: Array.from(toolsUsed),
      totalOperations,
      isActive: !!this.timeoutTimer,
      remainingThoughts: this.getRemainingThoughts(),
      stores: {
        thoughts: this.thoughtStore.getStatistics(),
        mentalModels: this.mentalModelStore.getStatistics(),
        debugging: this.debuggingStore.getStatistics(),
        collaborative: this.collaborativeStore.getStatistics(),
        decisions: this.decisionStore.getStatistics(),
        metacognitive: this.metacognitiveStore.getStatistics(),
        scientific: this.scientificStore.getStatistics(),
        creative: this.creativeStore.getStatistics(),
        systems: this.systemsStore.getStatistics(),
        visual: this.visualStore.getStatistics()
      }
    };
  }
  
  /**
   * Export session data
   * @param storeType - Optional specific store to export
   * @returns Exportable session data
   */
  export(storeType?: string): SessionExport | SessionExport[] {
    this.touch();
    
    const baseExport = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };
    
    // Export specific store if requested
    if (storeType) {
      const exports: SessionExport[] = [];
      
      switch (storeType) {
        case 'thoughts':
          this.thoughtStore.getAll().forEach(thought => {
            exports.push({
              ...baseExport,
              sessionType: 'sequential',
              data: thought
            });
          });
          break;
          
        case 'mentalModels':
          this.mentalModelStore.getAll().forEach(model => {
            exports.push({
              ...baseExport,
              sessionType: 'mental-model',
              data: model
            });
          });
          break;
          
        // Add other cases as needed...
      }
      
      return exports.length === 1 ? exports[0] : exports;
    }
    
    // Export all data
    const allExports: SessionExport[] = [];
    
    // Add exports from all stores
    this.thoughtStore.getAll().forEach(thought => {
      allExports.push({
        ...baseExport,
        sessionType: 'sequential',
        data: thought
      });
    });
    
    this.mentalModelStore.getAll().forEach(model => {
      allExports.push({
        ...baseExport,
        sessionType: 'mental-model',
        data: model
      });
    });
    
    // Continue for all other stores...
    
    return allExports;
  }
  
  /**
   * Import session data
   * @param data - The session export data to import
   */
  import(data: SessionExport | SessionExport[]): void {
    this.touch();
    
    const imports = Array.isArray(data) ? data : [data];
    
    imports.forEach(item => {
      switch (item.sessionType) {
        case 'sequential':
          this.addThought(item.data as ThoughtData);
          break;
          
        case 'mental-model':
          this.addMentalModel(item.data as MentalModelData);
          break;
          
        case 'debugging':
          this.addDebuggingSession(item.data as DebuggingSession);
          break;
          
        case 'collaborative':
          this.addCollaborativeSession(item.data as CollaborativeSession);
          break;
          
        case 'decision':
          this.addDecision(item.data as DecisionData);
          break;
          
        case 'metacognitive':
          this.addMetacognitive(item.data as MetacognitiveData);
          break;
          
        case 'scientific':
          this.addScientificInquiry(item.data as ScientificInquiryData);
          break;
          
        case 'creative':
          this.addCreativeSession(item.data as CreativeData);
          break;
          
        case 'systems':
          this.addSystemsAnalysis(item.data as SystemsData);
          break;
          
        case 'visual':
          this.addVisualOperation(item.data as VisualData);
          break;
      }
    });
  }
  
  /**
   * Cleanup session data and stop timers
   */
  cleanup(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
    
    // Clear all stores
    this.thoughtStore.clear();
    this.mentalModelStore.clear();
    this.debuggingStore.clear();
    this.collaborativeStore.clear();
    this.decisionStore.clear();
    this.metacognitiveStore.clear();
    this.scientificStore.clear();
    this.creativeStore.clear();
    this.systemsStore.clear();
    this.visualStore.clear();
  }
  
  /**
   * Check if session is still active
   */
  isActive(): boolean {
    return !!this.timeoutTimer;
  }
}