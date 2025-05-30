#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
// Fixed chalk import for ESM
import chalk from 'chalk';
import { validateInput, ValidationError, ProcessResult } from "./src/utils/validation.js";
import { ThoughtDataSchema, MentalModelSchema, DebuggingApproachSchema } from "./src/schemas/core.js";
import { CollaborativeReasoningSchema } from "./src/schemas/collaborative.js";

// Data Interfaces
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;

  isRevision?: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean;
}

interface MentalModelData {
  modelName: string;
  problem: string;
  steps: string[];
  reasoning: string;
  conclusion: string;
}

interface DebuggingApproachData {
  approachName: string;
  issue: string;
  steps: string[];
  findings: string;
  resolution: string;
}

// --- BEGIN ADDED DATA INTERFACES --- 

// Collaborative Reasoning Data Interfaces
interface PersonaData {
  id: string;
  name: string;
  expertise: string[];
  background: string;
  perspective: string;
  biases: string[];
  communication: {
    style: string;
    tone: string;
  };
}

interface ContributionData {
  personaId: string;
  content: string;
  type: "observation" | "question" | "insight" | "concern" | "suggestion" | "challenge" | "synthesis";
  confidence: number; // 0.0-1.0
  referenceIds?: string[]; // IDs of previous contributions this builds upon
}

interface DisagreementPosition {
  personaId: string;
  position: string;
  arguments: string[];
}

interface DisagreementResolution {
  type: "consensus" | "compromise" | "integration" | "tabled";
  description: string;
}

interface DisagreementData {
  topic: string;
  positions: DisagreementPosition[];
  resolution?: DisagreementResolution;
}

interface CollaborativeReasoningData {
  topic: string;
  personas: PersonaData[];
  contributions: ContributionData[];
  stage: "problem-definition" | "ideation" | "critique" | "integration" | "decision" | "reflection";
  activePersonaId: string;
  nextPersonaId?: string;
  consensusPoints?: string[];
  disagreements?: DisagreementData[];
  keyInsights?: string[];
  openQuestions?: string[];
  finalRecommendation?: string;
  sessionId: string;
  iteration: number;
  suggestedContributionTypes?: ("observation" | "question" | "insight" | "concern" | "suggestion" | "challenge" | "synthesis")[];
  nextContributionNeeded: boolean;
}

// Decision Framework Data Interfaces
interface DecisionOption {
  id?: string;
  name: string;
  description: string;
}

interface DecisionCriterion {
  id?: string;
  name: string;
  description: string;
  weight: number; // 0.0-1.0
  evaluationMethod: "quantitative" | "qualitative" | "boolean";
}

interface CriterionEvaluation {
  criterionId: string;
  optionId: string;
  score: number; // 0.0-1.0
  justification: string;
}

interface PossibleOutcome {
  id?: string;
  description: string;
  probability: number; // 0.0-1.0
  value: number; // Utility value
  optionId: string;
  confidenceInEstimate: number; // 0.0-1.0
}

interface InformationGap {
  description: string;
  impact: number; // 0.0-1.0
  researchMethod: string;
}

interface DecisionFrameworkData {
  decisionStatement: string;
  options: DecisionOption[];
  criteria?: DecisionCriterion[];
  stakeholders?: string[];
  constraints?: string[];
  timeHorizon?: string;
  riskTolerance?: "risk-averse" | "risk-neutral" | "risk-seeking";
  possibleOutcomes?: PossibleOutcome[];
  criteriaEvaluations?: CriterionEvaluation[];
  informationGaps?: InformationGap[];
  analysisType: "expected-utility" | "multi-criteria" | "maximin" | "minimax-regret" | "satisficing";
  stage: "problem-definition" | "options" | "criteria" | "evaluation" | "analysis" | "recommendation";
  recommendation?: string;
  sensitivityInsights?: string[];
  expectedValues?: Record<string, number>;
  multiCriteriaScores?: Record<string, number>;
  decisionId: string;
  iteration: number;
  suggestedNextStage?: string;
  nextStageNeeded: boolean;
}

// Metacognitive Monitoring Data Interfaces
interface KnowledgeAssessment {
  domain: string;
  knowledgeLevel: "expert" | "proficient" | "familiar" | "basic" | "minimal" | "none";
  confidenceScore: number; // 0.0-1.0
  supportingEvidence: string;
  knownLimitations: string[];
  relevantTrainingCutoff?: string;
}

interface ClaimAssessment {
  claim: string;
  status: "fact" | "inference" | "speculation" | "uncertain";
  confidenceScore: number; // 0.0-1.0
  evidenceBasis: string;
  falsifiabilityCriteria?: string;
  alternativeInterpretations?: string[];
}

interface ReasoningAssessment {
  step: string;
  potentialBiases: string[];
  assumptions: string[];
  logicalValidity: number; // 0.0-1.0
  inferenceStrength: number; // 0.0-1.0
}

interface MetacognitiveMonitoringData {
  task: string;
  stage: "knowledge-assessment" | "planning" | "execution" | "monitoring" | "evaluation" | "reflection";
  knowledgeAssessment?: KnowledgeAssessment;
  claims?: ClaimAssessment[];
  reasoningSteps?: ReasoningAssessment[];
  overallConfidence: number; // 0.0-1.0
  uncertaintyAreas: string[];
  recommendedApproach: string;
  monitoringId: string;
  iteration: number;
  suggestedAssessments?: ("knowledge" | "claim" | "reasoning" | "overall")[];
  nextAssessmentNeeded: boolean;
}

// Scientific Method Data Interfaces
interface Variable {
  name: string;
  type: "independent" | "dependent" | "controlled" | "confounding";
  operationalization?: string;
}

interface HypothesisData {
  statement: string;
  variables: Variable[];
  assumptions: string[];
  hypothesisId: string;
  confidence: number; // 0.0-1.0
  domain: string;
  iteration: number;
  alternativeTo?: string[];
  refinementOf?: string;
  status: "proposed" | "testing" | "supported" | "refuted" | "refined";
}

interface Prediction {
  if: string;
  then: string;
  else?: string;
}

interface ExperimentData {
  design: string;
  methodology: string;
  predictions: Prediction[];
  experimentId: string;
  hypothesisId: string;
  controlMeasures: string[];
  results?: string;
  outcomeMatched?: boolean;
  unexpectedObservations?: string[];
  limitations?: string[];
  nextSteps?: string[];
}

interface ScientificInquiryData {
  stage: "observation" | "question" | "hypothesis" | "experiment" | "analysis" | "conclusion" | "iteration";
  observation?: string;
  question?: string;
  hypothesis?: HypothesisData;
  experiment?: ExperimentData;
  analysis?: string;
  conclusion?: string;
  inquiryId: string;
  iteration: number;
  nextStageNeeded: boolean;
}

// Structured Argumentation Data Interfaces
interface ArgumentData {
  claim: string;
  premises: string[];
  conclusion: string;
  argumentId?: string;
  argumentType: "thesis" | "antithesis" | "synthesis" | "objection" | "rebuttal";
  confidence: number; // 0.0-1.0
  respondsTo?: string;
  supports?: string[];
  contradicts?: string[];
  strengths?: string[];
  weaknesses?: string[];
  nextArgumentNeeded: boolean;
  suggestedNextTypes?: ("thesis" | "antithesis" | "synthesis" | "objection" | "rebuttal")[];
}

// Visual Reasoning Data Interfaces
interface VisualElement {
  id: string;
  type: "node" | "edge" | "container" | "annotation";
  label?: string;
  properties: Record<string, any>; 
  source?: string; 
  target?: string; 
  contains?: string[]; 
}

interface VisualOperationData {
  operation: "create" | "update" | "delete" | "transform" | "observe";
  elements?: VisualElement[];
  transformationType?: "rotate" | "move" | "resize" | "recolor" | "regroup";
  diagramId: string;
  diagramType: "graph" | "flowchart" | "stateDiagram" | "conceptMap" | "treeDiagram" | "custom";
  iteration: number;
  observation?: string;
  insight?: string;
  hypothesis?: string;
  nextOperationNeeded: boolean;
}

// --- END ADDED DATA INTERFACES --- 

// Enhanced Error Handling and Resource Management
class ResourceManager {
  private static instance: ResourceManager;
  private resources: Set<{ cleanup: () => void }> = new Set();
  private isShuttingDown = false;

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  register(resource: { cleanup: () => void }): void {
    if (!this.isShuttingDown) {
      this.resources.add(resource);
    }
  }

  unregister(resource: { cleanup: () => void }): void {
    this.resources.delete(resource);
  }

  async cleanup(): Promise<void> {
    this.isShuttingDown = true;
    const cleanupPromises = Array.from(this.resources).map(resource => {
      try {
        return Promise.resolve(resource.cleanup());
      } catch (error) {
        console.error('Error during resource cleanup:', error);
        return Promise.resolve();
      }
    });
    
    await Promise.allSettled(cleanupPromises);
    this.resources.clear();
  }
}

// Enhanced Transport with Memory Leak Prevention
class EnhancedTransport {
  private abortController: AbortController;
  private cleanupCallbacks: (() => void)[] = [];
  private isConnected = false;
  private connectionTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor() {
    this.abortController = new AbortController();
    this.setupCleanup();
  }

  private setupCleanup(): void {
    // Register with resource manager
    const resourceManager = ResourceManager.getInstance();
    resourceManager.register({ cleanup: () => this.cleanup() });

    // Setup abort signal cleanup
    this.abortController.signal.addEventListener('abort', () => {
      this.cleanup();
    }, { once: true });
  }

  addCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  private cleanup(): void {
    if (!this.isConnected) return;
    
    this.isConnected = false;
    
    // Clear timeouts
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = undefined;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }

    // Execute cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });
    this.cleanupCallbacks = [];

    // Abort any pending operations
    if (!this.abortController.signal.aborted) {
      this.abortController.abort();
    }

    console.error(`[${new Date().toISOString()}] Transport cleanup completed`);
  }

  getAbortSignal(): AbortSignal {
    return this.abortController.signal;
  }

  setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  isTransportConnected(): boolean {
    return this.isConnected;
  }
}

// Server Classes with Enhanced Error Handling
class MentalModelServer {
  private validateModelData(input: unknown): MentalModelData {
    const validated = validateInput(MentalModelSchema, input, 'MentalModel');
    // Ensure all required fields are present after validation
    return {
      modelName: validated.modelName,
      problem: validated.problem,
      steps: validated.steps || [],
      reasoning: validated.reasoning || '',
      conclusion: validated.conclusion || ''
    };
  }

  private formatModelOutput(modelData: MentalModelData): string {
    const { modelName, problem, steps, reasoning, conclusion } = modelData;
    const border = '─'.repeat(Math.max(modelName.length + 20, problem.length + 4));

    return `
┌${border}┐
│ 🧠 Mental Model: ${modelName.padEnd(border.length - 16)} │
├${border}┤
│ Problem: ${problem.padEnd(border.length - 10)} │
├${border}┤
│ Steps:${' '.repeat(border.length - 7)} │
${steps.map(step => `│ • ${step.padEnd(border.length - 4)} │`).join('\n')}
├${border}┤
│ Reasoning: ${reasoning.padEnd(border.length - 11)} │
├${border}┤
│ Conclusion: ${conclusion.padEnd(border.length - 12)} │
└${border}┘`;
  }

  public processModel(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateModelData(input);
      const formattedOutput = this.formatModelOutput(validatedInput);
      console.error(formattedOutput);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            modelName: validatedInput.modelName,
            status: 'success',
            hasSteps: validatedInput.steps.length > 0,
            hasConclusion: !!validatedInput.conclusion
          }, null, 2)
        }]
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ProcessResult {
    if (error instanceof ValidationError) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error.message,
            details: error.prettyError,
            status: 'validation_failed'
          }, null, 2)
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'processing_failed'
        }, null, 2)
      }],
      isError: true
    };
  }
}

class DebuggingApproachServer {
  private validateApproachData(input: unknown): DebuggingApproachData {
    const validated = validateInput(DebuggingApproachSchema, input, 'DebuggingApproach');
    // Ensure all required fields are present after validation
    return {
      approachName: validated.approachName,
      issue: validated.issue,
      steps: validated.steps || [],
      findings: validated.findings || '',
      resolution: validated.resolution || ''
    };
  }

  private formatApproachOutput(approachData: DebuggingApproachData): string {
    const { approachName, issue, steps, findings, resolution } = approachData;
    const border = '─'.repeat(Math.max(approachName.length + 25, issue.length + 4));

    return `
┌${border}┐
│ 🔍 Debugging Approach: ${approachName.padEnd(border.length - 21)} │
├${border}┤
│ Issue: ${issue.padEnd(border.length - 8)} │
├${border}┤
│ Steps:${' '.repeat(border.length - 7)} │
${steps.map(step => `│ • ${step.padEnd(border.length - 4)} │`).join('\n')}
├${border}┤
│ Findings: ${findings.padEnd(border.length - 11)} │
├${border}┤
│ Resolution: ${resolution.padEnd(border.length - 12)} │
└${border}┘`;
  }

  public processApproach(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateApproachData(input);
      const formattedOutput = this.formatApproachOutput(validatedInput);
      console.error(formattedOutput);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            approachName: validatedInput.approachName,
            status: 'success',
            hasSteps: validatedInput.steps.length > 0,
            hasResolution: !!validatedInput.resolution
          }, null, 2)
        }]
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ProcessResult {
    if (error instanceof ValidationError) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error.message,
            details: error.prettyError,
            status: 'validation_failed'
          }, null, 2)
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'processing_failed'
        }, null, 2)
      }],
      isError: true
    };
  }
}

class SequentialThinkingServer {
  private static readonly MAX_THOUGHT_HISTORY = 1000;
  private static readonly MAX_BRANCH_SIZE = 100;
  private static readonly MAX_BRANCHES = 50;
  
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};

  private validateThoughtData(input: unknown): ThoughtData {
    const validatedData = validateInput(ThoughtDataSchema, input, 'SequentialThinking');
    
    // Apply business logic validation
    if (validatedData.isRevision && !validatedData.revisesThought) {
      throw new Error("Revision must specify which thought is being revised");
    }
    
    if (validatedData.branchFromThought && !validatedData.branchId) {
      throw new Error("Branch must have a branch ID");
    }
    
    return validatedData;
  }

  private formatThought(thoughtData: ThoughtData): string {
    const { thoughtNumber, totalThoughts, thought, isRevision, revisesThought, branchFromThought, branchId } = thoughtData;

    let prefix = '';
    let context = '';

    if (isRevision) {
      prefix = chalk.yellow('🔄 Revision');
      context = ` (revising thought ${revisesThought})`;
    } else if (branchFromThought) {
      prefix = chalk.green('🌿 Branch');
      context = ` (from thought ${branchFromThought}, ID: ${branchId})`;
    } else {
      prefix = chalk.blue('💭 Thought');
      context = '';
    }

    const header = `${prefix} ${thoughtNumber}/${totalThoughts}${context}`;
    const border = '─'.repeat(Math.max(header.length, thought.length) + 4);

    return `
┌${border}┐
│ ${header} │
├${border}┤
│ ${thought.padEnd(border.length - 2)} │
└${border}┘`;
  }

  private cleanupMemory(): void {
    // Clean up thought history if it exceeds maximum
    if (this.thoughtHistory.length > SequentialThinkingServer.MAX_THOUGHT_HISTORY) {
      const excessCount = this.thoughtHistory.length - SequentialThinkingServer.MAX_THOUGHT_HISTORY;
      this.thoughtHistory.splice(0, excessCount);
      console.error(`[${new Date().toISOString()}] Cleaned up ${excessCount} old thoughts from memory`);
    }

    // Clean up branches
    const branchIds = Object.keys(this.branches);
    if (branchIds.length > SequentialThinkingServer.MAX_BRANCHES) {
      const excessBranches = branchIds.slice(0, branchIds.length - SequentialThinkingServer.MAX_BRANCHES);
      excessBranches.forEach(branchId => {
        delete this.branches[branchId];
      });
      console.error(`[${new Date().toISOString()}] Cleaned up ${excessBranches.length} old branches from memory`);
    }

    // Clean up oversized branches
    Object.keys(this.branches).forEach(branchId => {
      if (this.branches[branchId].length > SequentialThinkingServer.MAX_BRANCH_SIZE) {
        const excessCount = this.branches[branchId].length - SequentialThinkingServer.MAX_BRANCH_SIZE;
        this.branches[branchId].splice(0, excessCount);
      }
    });
  }

  public processThought(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateThoughtData(input);
      const formattedOutput = this.formatThought(validatedInput);
      console.error(formattedOutput);

      // Store thought with memory management
      if (validatedInput.branchId) {
        if (!this.branches[validatedInput.branchId]) {
          this.branches[validatedInput.branchId] = [];
        }
        this.branches[validatedInput.branchId].push(validatedInput);
      } else {
        this.thoughtHistory.push(validatedInput);
      }

      // Perform memory cleanup
      this.cleanupMemory();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            thoughtNumber: validatedInput.thoughtNumber,
            totalThoughts: validatedInput.totalThoughts,
            status: 'success',
            isRevision: !!validatedInput.isRevision,
            isBranch: !!validatedInput.branchId,
            nextThoughtNeeded: validatedInput.nextThoughtNeeded
          }, null, 2)
        }]
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): ProcessResult {
    if (error instanceof ValidationError) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error.message,
            details: error.prettyError,
            status: 'validation_failed'
          }, null, 2)
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
          status: 'processing_failed'
        }, null, 2)
      }],
      isError: true
    };
  }
}

// Placeholder classes for other servers (keeping existing structure)
class CollaborativeReasoningServer {
  private validateInputData(input: unknown): CollaborativeReasoningData {
    const validated = validateInput(CollaborativeReasoningSchema, input, 'CollaborativeReasoning');
    // Ensure all required fields are present, especially for nested objects
    return {
      ...validated,
      personas: validated.personas.map(persona => ({
        ...persona,
        communication: {
          style: persona.communication.style,
          tone: persona.communication.tone
        }
      }))
    } as CollaborativeReasoningData;
  }

  processCollaborativeReasoning(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: error.message,
              details: error.prettyError,
              status: 'validation_failed'
            }, null, 2)
          }],
          isError: true
        };
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

class DecisionFrameworkServer {
  private validateInputData(input: unknown): DecisionFrameworkData {
    // Placeholder validation - implement proper schema
    return input as DecisionFrameworkData;
  }

  processDecisionFramework(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

class MetacognitiveMonitoringServer {
  private validateInputData(input: unknown): MetacognitiveMonitoringData {
    // Placeholder validation - implement proper schema
    return input as MetacognitiveMonitoringData;
  }

  processMetacognitiveMonitoring(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

class ScientificMethodServer {
  private validateInputData(input: unknown): ScientificInquiryData {
    // Placeholder validation - implement proper schema
    return input as ScientificInquiryData;
  }

  processScientificMethod(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

class StructuredArgumentationServer {
  private validateInputData(input: unknown): ArgumentData {
    // Placeholder validation - implement proper schema
    return input as ArgumentData;
  }

  processStructuredArgumentation(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

class VisualReasoningServer {
  private validateInputData(input: unknown): VisualOperationData {
    // Placeholder validation - implement proper schema
    return input as VisualOperationData;
  }

  processVisualReasoning(input: unknown): ProcessResult {
    try {
      const validatedInput = this.validateInputData(input);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(validatedInput, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'processing_failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

// Tool Definitions
const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: "Process sequential thoughts with branching, revision, and memory management capabilities",
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "The thought content"
      },
      thoughtNumber: {
        type: "number",
        description: "Current thought number in sequence"
      },
      totalThoughts: {
        type: "number", 
        description: "Total expected thoughts in sequence"
      },
      isRevision: {
        type: "boolean",
        description: "Whether this is a revision of a previous thought"
      },
      revisesThought: {
        type: "number",
        description: "Which thought number this revises (if isRevision is true)"
      },
      branchFromThought: {
        type: "number",
        description: "Which thought this branches from (for alternative thinking paths)"
      },
      branchId: {
        type: "string",
        description: "Unique identifier for this branch"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "Whether more thoughts are needed in this sequence"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether the next thought is needed"
      }
    },
    required: ["thought", "thoughtNumber", "totalThoughts", "nextThoughtNeeded"]
  }
};

const MENTAL_MODEL_TOOL: Tool = {
  name: "mentalmodel",
  description: "Apply mental models to analyze problems systematically",
  inputSchema: {
    type: "object",
    properties: {
      modelName: {
        type: "string",
        description: "Name of the mental model being applied"
      },
      problem: {
        type: "string",
        description: "The problem or situation to analyze"
      },
      steps: {
        type: "array",
        items: { type: "string" },
        description: "Step-by-step application of the mental model"
      },
      reasoning: {
        type: "string",
        description: "The reasoning process and insights"
      },
      conclusion: {
        type: "string",
        description: "Conclusions drawn from applying the mental model"
      }
    },
    required: ["modelName", "problem", "steps", "reasoning", "conclusion"]
  }
};

const DEBUGGING_APPROACH_TOOL: Tool = {
  name: "debuggingapproach",
  description: "Apply systematic debugging approaches to identify and resolve issues",
  inputSchema: {
    type: "object",
    properties: {
      approachName: {
        type: "string",
        description: "Name of the debugging approach being used"
      },
      issue: {
        type: "string",
        description: "Description of the issue or problem"
      },
      steps: {
        type: "array",
        items: { type: "string" },
        description: "Systematic steps taken to debug the issue"
      },
      findings: {
        type: "string",
        description: "What was discovered during the debugging process"
      },
      resolution: {
        type: "string",
        description: "How the issue was resolved or next steps"
      }
    },
    required: ["approachName", "issue", "steps", "findings", "resolution"]
  }
};

const COLLABORATIVE_REASONING_TOOL: Tool = {
  name: "collaborativereasoning",
  description: "Facilitate collaborative reasoning with multiple perspectives and personas",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string" },
      personas: { type: "array", items: { type: "object" } },
      contributions: { type: "array", items: { type: "object" } },
      stage: { type: "string" },
      activePersonaId: { type: "string" },
      sessionId: { type: "string" },
      iteration: { type: "number" },
      nextContributionNeeded: { type: "boolean" }
    },
    required: ["topic", "personas", "contributions", "stage", "activePersonaId", "sessionId", "iteration", "nextContributionNeeded"]
  }
};

const DECISION_FRAMEWORK_TOOL: Tool = {
  name: "decisionframework",
  description: "Apply structured decision-making frameworks",
  inputSchema: {
    type: "object",
    properties: {
      decisionStatement: { type: "string" },
      options: { type: "array", items: { type: "object" } },
      analysisType: { type: "string" },
      stage: { type: "string" },
      decisionId: { type: "string" },
      iteration: { type: "number" },
      nextStageNeeded: { type: "boolean" }
    },
    required: ["decisionStatement", "options", "analysisType", "stage", "decisionId", "iteration", "nextStageNeeded"]
  }
};

const METACOGNITIVE_MONITORING_TOOL: Tool = {
  name: "metacognitivemonitoring",
  description: "Monitor and assess thinking processes and knowledge",
  inputSchema: {
    type: "object",
    properties: {
      task: { type: "string" },
      stage: { type: "string" },
      overallConfidence: { type: "number" },
      uncertaintyAreas: { type: "array", items: { type: "string" } },
      recommendedApproach: { type: "string" },
      monitoringId: { type: "string" },
      iteration: { type: "number" },
      nextAssessmentNeeded: { type: "boolean" }
    },
    required: ["task", "stage", "overallConfidence", "uncertaintyAreas", "recommendedApproach", "monitoringId", "iteration", "nextAssessmentNeeded"]
  }
};

const SCIENTIFIC_METHOD_TOOL: Tool = {
  name: "scientificmethod",
  description: "Apply scientific method for systematic inquiry",
  inputSchema: {
    type: "object",
    properties: {
      stage: { type: "string" },
      inquiryId: { type: "string" },
      iteration: { type: "number" },
      nextStageNeeded: { type: "boolean" }
    },
    required: ["stage", "inquiryId", "iteration", "nextStageNeeded"]
  }
};

const STRUCTURED_ARGUMENTATION_TOOL: Tool = {
  name: "structuredargumentation",
  description: "Construct and analyze structured arguments",
  inputSchema: {
    type: "object",
    properties: {
      claim: { type: "string" },
      premises: { type: "array", items: { type: "string" } },
      conclusion: { type: "string" },
      argumentType: { type: "string" },
      confidence: { type: "number" },
      nextArgumentNeeded: { type: "boolean" }
    },
    required: ["claim", "premises", "conclusion", "argumentType", "confidence", "nextArgumentNeeded"]
  }
};

const VISUAL_REASONING_TOOL: Tool = {
  name: "visualreasoning",
  description: "Process visual reasoning and diagram operations",
  inputSchema: {
    type: "object",
    properties: {
      operation: { type: "string" },
      diagramId: { type: "string" },
      diagramType: { type: "string" },
      iteration: { type: "number" },
      nextOperationNeeded: { type: "boolean" }
    },
    required: ["operation", "diagramId", "diagramType", "iteration", "nextOperationNeeded"]
  }
};

// Server instances with enhanced error handling
const thinkingServer = new SequentialThinkingServer();
const modelServer = new MentalModelServer();
const debuggingServer = new DebuggingApproachServer();
const collaborativeReasoningServer = new CollaborativeReasoningServer();
const decisionFrameworkServer = new DecisionFrameworkServer();
const metacognitiveMonitoringServer = new MetacognitiveMonitoringServer();
const scientificMethodServer = new ScientificMethodServer();
const argumentationServer = new StructuredArgumentationServer();
const visualReasoningServer = new VisualReasoningServer();

// Enhanced Server with comprehensive error handling
const server = new Server(
  {
    name: "clear-thought",
    version: "0.0.5",
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  }
);

// Enhanced logging with proper error handling
server.sendLoggingMessage = server.sendLoggingMessage || ((message) => {
  try {
    console.error(`[${new Date().toISOString()}] ${message.level}: ${message.data}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Logging error:`, error);
  }
});

// Request handlers with enhanced error handling
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    return {
      tools: [
        SEQUENTIAL_THINKING_TOOL,
        MENTAL_MODEL_TOOL,
        DEBUGGING_APPROACH_TOOL,
        COLLABORATIVE_REASONING_TOOL,
        DECISION_FRAMEWORK_TOOL,
        METACOGNITIVE_MONITORING_TOOL,
        SCIENTIFIC_METHOD_TOOL,
        STRUCTURED_ARGUMENTATION_TOOL,
        VISUAL_REASONING_TOOL,
      ],
    };
  } catch (error) {
    console.error('Error listing tools:', error);
    throw new McpError(ErrorCode.InternalError, 'Failed to list tools');
  }
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "sequentialthinking": {
        const result = thinkingServer.processThought(request.params.arguments);
        return { content: result.content };
      }
      case "mentalmodel": {
        const result = modelServer.processModel(request.params.arguments);
        return { content: result.content };
      }
      case "debuggingapproach": {
        const result = debuggingServer.processApproach(request.params.arguments);
        return { content: result.content };
      }
      case "collaborativereasoning": {
        const result = collaborativeReasoningServer.processCollaborativeReasoning(request.params.arguments);
        return { content: result.content };
      }
      case "decisionframework": {
        const result = decisionFrameworkServer.processDecisionFramework(request.params.arguments);
        return { content: result.content };
      }
      case "metacognitivemonitoring": {
        const result = metacognitiveMonitoringServer.processMetacognitiveMonitoring(request.params.arguments);
        return { content: result.content };
      }
      case "scientificmethod": {
        const result = scientificMethodServer.processScientificMethod(request.params.arguments);
        return { content: result.content };
      }
      case "structuredargumentation": {
        const result = argumentationServer.processStructuredArgumentation(request.params.arguments);
        return { content: result.content };
      }
      case "visualreasoning": {
        const result = visualReasoningServer.processVisualReasoning(request.params.arguments);
        return { content: result.content };
      }
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${request.params.name}' not found.`
        );
    }
  } catch (error) {
    console.error(`Error processing tool ${request.params.name}:`, error);
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Failed to process tool: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// FIXED: Enhanced Protocol Keep-Alive Manager
class ProtocolKeepAlive {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly KEEPALIVE_INTERVAL = 30000; // 30 seconds (half of typical 60s timeout)
  private isRunning = false;
  private failedPings = 0;
  private readonly MAX_FAILED_PINGS = 3;

  constructor(private server: Server) {}

  start() {
    if (this.isRunning || this.intervalId) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        // Send a protocol-level keep-alive by sending a logging message
        // This ensures the MCP protocol sees activity
        await this.server.sendLoggingMessage({
          level: "debug",
          data: `Keep-alive ping at ${new Date().toISOString()}`,
          logger: "keepalive"
        });
        
        // Reset failed ping counter on success
        this.failedPings = 0;
        
        // Also log to stderr for monitoring
        console.error(`[${new Date().toISOString()}] Protocol keep-alive sent successfully`);
        
      } catch (error) {
        this.failedPings++;
        console.error(`[${new Date().toISOString()}] Protocol keep-alive failed (attempt ${this.failedPings}/${this.MAX_FAILED_PINGS}):`, error);
        
        // If we've failed too many times, the connection is likely dead
        if (this.failedPings >= this.MAX_FAILED_PINGS) {
          console.error(`[${new Date().toISOString()}] Too many failed keep-alives, connection may be dead`);
          // Optionally trigger cleanup/restart here
        }
      }
    }, this.KEEPALIVE_INTERVAL);

    // Register cleanup
    const resourceManager = ResourceManager.getInstance();
    resourceManager.register({ cleanup: () => this.stop() });
    
    console.error(`[${new Date().toISOString()}] Protocol keep-alive started (interval: ${this.KEEPALIVE_INTERVAL}ms)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.error(`[${new Date().toISOString()}] Protocol keep-alive stopped`);
  }
}

// Create protocol keep-alive instance
let protocolKeepAlive: ProtocolKeepAlive;

// FIXED: Enhanced server runner with protocol keep-alive
async function runServer() {
  const enhancedTransport = new EnhancedTransport();
  
  try {
    const transport = new StdioServerTransport();
    
    // Setup transport cleanup
    enhancedTransport.addCleanupCallback(() => {
      try {
        if (transport && typeof (transport as any).close === 'function') {
          (transport as any).close();
        }
      } catch (error) {
        console.error('Error closing transport:', error);
      }
    });

    // Connect with timeout protection
    const connectionPromise = server.connect(transport);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });

    await Promise.race([connectionPromise, timeoutPromise]);
    enhancedTransport.setConnected(true);
    
    console.error(`[${new Date().toISOString()}] ✅ Clear Thought MCP Server running on stdio`);
    
    // Send initial logging message
    try {
      await server.sendLoggingMessage({
        level: "info",
        data: "Clear Thought MCP Server started successfully",
      });
    } catch (error) {
      console.error('Error sending initial log message:', error);
    }
    
    // FIXED: Start protocol-level keep-alive instead of just console heartbeat
    protocolKeepAlive = new ProtocolKeepAlive(server);
    protocolKeepAlive.start();
    
    // Also log memory usage periodically (but less frequently)
    const memoryLogger = setInterval(() => {
      try {
        if (process.memoryUsage) {
          const memUsage = process.memoryUsage();
          console.error(`[${new Date().toISOString()}] Memory: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
        }
      } catch (error) {
        console.error('Error logging memory:', error);
      }
    }, 120000); // Every 2 minutes
    
    // Register memory logger cleanup
    const resourceManager = ResourceManager.getInstance();
    resourceManager.register({ cleanup: () => clearInterval(memoryLogger) });
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to start server:`, error);
    await cleanup();
    throw error;
  }
}

// Enhanced cleanup function
async function cleanup() {
  console.error(`[${new Date().toISOString()}] 🧹 Starting graceful shutdown...`);
  
  try {
    // Stop protocol keep-alive
    if (protocolKeepAlive) {
      protocolKeepAlive.stop();
    }
    
    // Cleanup all resources
    const resourceManager = ResourceManager.getInstance();
    await resourceManager.cleanup();
    
    console.error(`[${new Date().toISOString()}] ✅ Graceful shutdown completed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error during cleanup:`, error);
  }
}

// Enhanced signal handlers
process.on('SIGINT', async () => {
  console.error(`[${new Date().toISOString()}] 📡 Received SIGINT, shutting down gracefully...`);
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error(`[${new Date().toISOString()}] 📡 Received SIGTERM, shutting down gracefully...`);
  await cleanup();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error(`[${new Date().toISOString()}] 💥 Uncaught Exception:`, error);
  await cleanup();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error(`[${new Date().toISOString()}] 🚫 Unhandled Rejection at:`, promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});

// Start the server with comprehensive error handling
runServer().catch(async (error) => {
  console.error(`[${new Date().toISOString()}] 💀 Fatal error running server:`, error);
  await cleanup();
  process.exit(1);
});

