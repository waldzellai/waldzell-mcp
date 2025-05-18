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

interface MentalModelResult extends MentalModelData {
  status: string;
  hasSteps: boolean;
  hasConclusion: boolean;
}

interface ApproachResult extends DebuggingApproachData {
  status: string;
  hasSteps: boolean;
  hasResolution: boolean;
}

interface ThoughtResult {
  thoughtNumber: number;
  totalThoughts: number;
  nextThoughtNeeded: boolean;
  branches: string[];
  thoughtHistoryLength: number;
}

// --- END ADDED DATA INTERFACES --- 

// Server Classes
class MentalModelServer {
  private validateModelData(input: unknown): MentalModelData {
    const data = input as Record<string, unknown>;
    
    if (!data.modelName || typeof data.modelName !== 'string') {
      throw new Error('Invalid modelName: must be a string');
    }
    if (!data.problem || typeof data.problem !== 'string') {
      throw new Error('Invalid problem: must be a string');
    }
    
    return {
      modelName: data.modelName,
      problem: data.problem,
      steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
      reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
      conclusion: typeof data.conclusion === 'string' ? data.conclusion : ''
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

  public process(input: unknown): MentalModelResult {
    const validatedInput = this.validateModelData(input);
    const formattedOutput = this.formatModelOutput(validatedInput);
    console.error(formattedOutput);

    return {
      ...validatedInput,
      status: 'success',
      hasSteps: validatedInput.steps.length > 0,
      hasConclusion: !!validatedInput.conclusion
    };
  }
}

class DebuggingApproachServer {
  private validateApproachData(input: unknown): DebuggingApproachData {
    const data = input as Record<string, unknown>;
    
    if (!data.approachName || typeof data.approachName !== 'string') {
      throw new Error('Invalid approachName: must be a string');
    }
    if (!data.issue || typeof data.issue !== 'string') {
      throw new Error('Invalid issue: must be a string');
    }
    
    return {
      approachName: data.approachName,
      issue: data.issue,
      steps: Array.isArray(data.steps) ? data.steps.map(String) : [],
      findings: typeof data.findings === 'string' ? data.findings : '',
      resolution: typeof data.resolution === 'string' ? data.resolution : ''
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

  public process(input: unknown): ApproachResult {
    const validatedInput = this.validateApproachData(input);
    const formattedOutput = this.formatApproachOutput(validatedInput);
    console.error(formattedOutput);

    return {
      ...validatedInput,
      status: 'success',
      hasSteps: validatedInput.steps.length > 0,
      hasResolution: !!validatedInput.resolution
    };
  }
}

class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};

  private validateThoughtData(input: unknown): ThoughtData {
    const data = input as Record<string, unknown>;

    if (!data.thought || typeof data.thought !== 'string') {
      throw new Error('Invalid thought: must be a string');
    }
    if (!data.thoughtNumber || typeof data.thoughtNumber !== 'number') {
      throw new Error('Invalid thoughtNumber: must be a number');
    }
    if (!data.totalThoughts || typeof data.totalThoughts !== 'number') {
      throw new Error('Invalid totalThoughts: must be a number');
    }
    if (typeof data.nextThoughtNeeded !== 'boolean') {
      throw new Error('Invalid nextThoughtNeeded: must be a boolean');
    }

    return {
      thought: data.thought,
      thoughtNumber: data.thoughtNumber,
      totalThoughts: data.totalThoughts,
      nextThoughtNeeded: data.nextThoughtNeeded,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
    };
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

  public process(input: unknown): ThoughtResult {
    const validatedInput = this.validateThoughtData(input);

    if (validatedInput.thoughtNumber > validatedInput.totalThoughts) {
      validatedInput.totalThoughts = validatedInput.thoughtNumber;
    }

    this.thoughtHistory.push(validatedInput);

    if (validatedInput.branchFromThought && validatedInput.branchId) {
      if (!this.branches[validatedInput.branchId]) {
        this.branches[validatedInput.branchId] = [];
      }
      this.branches[validatedInput.branchId].push(validatedInput);
    }

    const formattedThought = this.formatThought(validatedInput);
    console.error(formattedThought);

    return {
      thoughtNumber: validatedInput.thoughtNumber,
      totalThoughts: validatedInput.totalThoughts,
      nextThoughtNeeded: validatedInput.nextThoughtNeeded,
      branches: Object.keys(this.branches),
      thoughtHistoryLength: this.thoughtHistory.length
    };
  }
}

// --- BEGIN ADDED SERVER CLASSES ---

class CollaborativeReasoningServer {
  private validateInputData(input: unknown): CollaborativeReasoningData {
    const data = input as CollaborativeReasoningData;
    if (!data.topic || !data.personas || !data.contributions || !data.stage || !data.activePersonaId || !data.sessionId) {
      throw new Error("Invalid input for CollaborativeReasoning: Missing required fields.");
    }
    if (typeof data.iteration !== 'number' || data.iteration < 0) {
        throw new Error("Invalid iteration value for CollaborativeReasoningData.");
    }
    if (typeof data.nextContributionNeeded !== 'boolean') {
        throw new Error("Invalid nextContributionNeeded value for CollaborativeReasoningData.");
    }
    return data;
  }

  public process(input: unknown): CollaborativeReasoningData {
    const validatedData = this.validateInputData(input);
    return {
        ...validatedData,
        consensusPoints: validatedData.consensusPoints || [],
        disagreements: validatedData.disagreements || [],
        keyInsights: validatedData.keyInsights || [],
        openQuestions: validatedData.openQuestions || [],
        suggestedContributionTypes: validatedData.suggestedContributionTypes || [],
    };
  }
}

class DecisionFrameworkServer {
  private validateInputData(input: unknown): DecisionFrameworkData {
    const data = input as DecisionFrameworkData;
    if (!data.decisionStatement || !data.options || !data.analysisType || !data.stage || !data.decisionId) {
      throw new Error("Invalid input for DecisionFramework: Missing required fields.");
    }
    if (typeof data.iteration !== 'number' || data.iteration < 0) {
        throw new Error("Invalid iteration value for DecisionFrameworkData.");
    }
    if (typeof data.nextStageNeeded !== 'boolean') {
        throw new Error("Invalid nextStageNeeded value for DecisionFrameworkData.");
    }
    return data;
  }

  public process(input: unknown): DecisionFrameworkData {
    const validatedData = this.validateInputData(input);
    return {
        ...validatedData,
        criteria: validatedData.criteria || [],
        stakeholders: validatedData.stakeholders || [],
        constraints: validatedData.constraints || [],
        possibleOutcomes: validatedData.possibleOutcomes || [],
        criteriaEvaluations: validatedData.criteriaEvaluations || [],
        informationGaps: validatedData.informationGaps || [],
        sensitivityInsights: validatedData.sensitivityInsights || [],
    };
  }
}

class MetacognitiveMonitoringServer {
  private validateInputData(input: unknown): MetacognitiveMonitoringData {
    const data = input as MetacognitiveMonitoringData;
    if (!data.task || !data.stage || !data.monitoringId) {
      throw new Error("Invalid input for MetacognitiveMonitoring: Missing required fields.");
    }
     if (typeof data.overallConfidence !== 'number' || data.overallConfidence < 0 || data.overallConfidence > 1) {
        throw new Error("Invalid overallConfidence value for MetacognitiveMonitoringData.");
    }
    if (typeof data.iteration !== 'number' || data.iteration < 0) {
        throw new Error("Invalid iteration value for MetacognitiveMonitoringData.");
    }
    if (typeof data.nextAssessmentNeeded !== 'boolean') {
        throw new Error("Invalid nextAssessmentNeeded value for MetacognitiveMonitoringData.");
    }
    return data;
  }

  public process(input: unknown): MetacognitiveMonitoringData {
    const validatedData = this.validateInputData(input);
    return {
        ...validatedData,
        claims: validatedData.claims || [],
        reasoningSteps: validatedData.reasoningSteps || [],
        uncertaintyAreas: validatedData.uncertaintyAreas || [],
        suggestedAssessments: validatedData.suggestedAssessments || [],
    };
  }
}

class ScientificMethodServer {
  private validateInputData(input: unknown): ScientificInquiryData {
    const data = input as ScientificInquiryData;
    if (!data.stage || !data.inquiryId) {
      throw new Error("Invalid input for ScientificMethod: Missing required fields.");
    }
    if (typeof data.iteration !== 'number' || data.iteration < 0) {
        throw new Error("Invalid iteration value for ScientificInquiryData.");
    }
    if (typeof data.nextStageNeeded !== 'boolean') {
        throw new Error("Invalid nextStageNeeded value for ScientificInquiryData.");
    }
    return data;
  }

  public process(input: unknown): ScientificInquiryData {
    const validatedData = this.validateInputData(input);

    // Process hypothesis
    let finalHypothesis: HypothesisData | undefined = undefined;
    if (validatedData.hypothesis) {
      finalHypothesis = {
        // Start with all properties from the input hypothesis
        ...validatedData.hypothesis,
        // Ensure specific properties have defaults if they were null or undefined in the input
        variables: validatedData.hypothesis.variables ?? [],
        assumptions: validatedData.hypothesis.assumptions ?? [],
        status: validatedData.hypothesis.status ?? "proposed" as const,
      };
    }

    // Process experiment
    let finalExperiment: ExperimentData | undefined = undefined;
    if (validatedData.experiment) {
      finalExperiment = {
        // Start with all properties from the input experiment
        ...validatedData.experiment,
        // Ensure specific properties have defaults if they were null or undefined in the input
        predictions: validatedData.experiment.predictions ?? [],
        controlMeasures: validatedData.experiment.controlMeasures ?? [],
      };
    }
    
    return {
      // Spread the original validated data first
      ...validatedData,
      // Then overwrite hypothesis and experiment with our processed versions
      // (which will be undefined if the originals were undefined)
      hypothesis: finalHypothesis,
      experiment: finalExperiment,
    };
  }
}

class StructuredArgumentationServer {
  private validateInputData(input: unknown): ArgumentData {
    const data = input as ArgumentData;
    if (!data.claim || !data.premises || !data.conclusion || !data.argumentType) {
      throw new Error("Invalid input for StructuredArgumentation: Missing required fields.");
    }
    if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) {
        throw new Error("Invalid confidence value for ArgumentData.");
    }
    if (typeof data.nextArgumentNeeded !== 'boolean') {
        throw new Error("Invalid nextArgumentNeeded value for ArgumentData.");
    }
    return data;
  }

  public process(input: unknown): ArgumentData {
    const validatedData = this.validateInputData(input);
    return {
        ...validatedData,
        supports: validatedData.supports || [],
        contradicts: validatedData.contradicts || [],
        strengths: validatedData.strengths || [],
        weaknesses: validatedData.weaknesses || [],
        suggestedNextTypes: validatedData.suggestedNextTypes || [],
    };
  }
}

class VisualReasoningServer {
  private validateInputData(input: unknown): VisualOperationData {
    const data = input as VisualOperationData;
    if (!data.operation || !data.diagramId || !data.diagramType) {
      throw new Error("Invalid input for VisualReasoning: Missing required fields.");
    }
    if (typeof data.iteration !== 'number' || data.iteration < 0) {
        throw new Error("Invalid iteration value for VisualOperationData.");
    }
    if (typeof data.nextOperationNeeded !== 'boolean') {
        throw new Error("Invalid nextOperationNeeded value for VisualOperationData.");
    }
    return data;
  }

  public process(input: unknown): VisualOperationData {
    const validatedData = this.validateInputData(input);
    return {
        ...validatedData,
        elements: validatedData.elements || [],
    };
  }
}

// --- END ADDED SERVER CLASSES ---

// Tool Definitions
const MENTAL_MODEL_TOOL: Tool = {
  name: "mentalmodel",
  description: `A tool for applying structured mental models to problem-solving.
Supports various mental models including:
- First Principles Thinking
- Opportunity Cost Analysis
- Error Propagation Understanding
- Rubber Duck Debugging
- Pareto Principle
- Occam's Razor

Each model provides a systematic approach to breaking down and solving problems.`,
  inputSchema: {
    type: "object",
    properties: {
      modelName: {
        type: "string",
        enum: [
          "first_principles",
          "opportunity_cost",
          "error_propagation",
          "rubber_duck",
          "pareto_principle",
          "occams_razor"
        ]
      },
      problem: { type: "string" },
      steps: { 
        type: "array",
        items: { type: "string" }
      },
      reasoning: { type: "string" },
      conclusion: { type: "string" }
    },
    required: ["modelName", "problem"]
  }
};

const DEBUGGING_APPROACH_TOOL: Tool = {
  name: "debuggingapproach",
  description: `A tool for applying systematic debugging approaches to solve technical issues.
Supports various debugging methods including:
- Binary Search
- Reverse Engineering
- Divide and Conquer
- Backtracking
- Cause Elimination
- Program Slicing

Each approach provides a structured method for identifying and resolving issues.`,
  inputSchema: {
    type: "object",
    properties: {
      approachName: {
        type: "string",
        enum: [
          "binary_search",
          "reverse_engineering",
          "divide_conquer",
          "backtracking",
          "cause_elimination",
          "program_slicing"
        ]
      },
      issue: { type: "string" },
      steps: {
        type: "array",
        items: { type: "string" }
      },
      findings: { type: "string" },
      resolution: { type: "string" }
    },
    required: ["approachName", "issue"]
  }
};

const SEQUENTIAL_THINKING_TOOL: Tool = {
  name: "sequentialthinking",
  description: `A detailed tool for dynamic and reflective problem-solving through thoughts.
This tool helps analyze problems through a flexible thinking process that can adapt and evolve.
Each thought can build on, question, or revise previous insights as understanding deepens.

When to use this tool:
- Breaking down complex problems into steps
- Planning and design with room for revision
- Analysis that might need course correction
- Problems where the full scope might not be clear initially
- Problems that require a multi-step solution
- Tasks that need to maintain context over multiple steps
- Situations where irrelevant information needs to be filtered out

Key features:
- You can adjust total_thoughts up or down as you progress
- You can question or revise previous thoughts
- You can add more thoughts even after reaching what seemed like the end
- You can express uncertainty and explore alternative approaches
- Not every thought needs to build linearly - you can branch or backtrack
- Generates a solution hypothesis
- Verifies the hypothesis based on the Chain of Thought steps
- Repeats the process until satisfied
- Provides a correct answer

Parameters explained:
- thought: Your current thinking step, which can include:
* Regular analytical steps
* Revisions of previous thoughts
* Questions about previous decisions
* Realizations about needing more analysis
* Changes in approach
* Hypothesis generation
* Hypothesis verification
- next_thought_needed: True if you need more thinking, even if at what seemed like the end
- thought_number: Current number in sequence (can go beyond initial total if needed)
- total_thoughts: Current estimate of thoughts needed (can be adjusted up/down)
- is_revision: A boolean indicating if this thought revises previous thinking
- revises_thought: If is_revision is true, which thought number is being reconsidered
- branch_from_thought: If branching, which thought number is the branching point
- branch_id: Identifier for the current branch (if any)
- needs_more_thoughts: If reaching end but realizing more thoughts needed

You should:
1. Start with an initial estimate of needed thoughts, but be ready to adjust
2. Feel free to question or revise previous thoughts
3. Don't hesitate to add more thoughts if needed, even at the "end"
4. Express uncertainty when present
5. Mark thoughts that revise previous thinking or branch into new paths
6. Ignore information that is irrelevant to the current step
7. Generate a solution hypothesis when appropriate
8. Verify the hypothesis based on the Chain of Thought steps
9. Repeat the process until satisfied with the solution
10. Provide a single, ideally correct answer as the final output
11. Only set next_thought_needed to false when truly done and a satisfactory answer is reached`,
  inputSchema: {
    type: "object",
    properties: {
      thought: {
        type: "string",
        description: "Your current thinking step"
      },
      nextThoughtNeeded: {
        type: "boolean",
        description: "Whether another thought step is needed"
      },
      thoughtNumber: {
        type: "integer",
        description: "Current thought number",
        minimum: 1
      },
      totalThoughts: {
        type: "integer",
        description: "Estimated total thoughts needed",
        minimum: 1
      },
      isRevision: {
        type: "boolean",
        description: "Whether this revises previous thinking"
      },
      revisesThought: {
        type: "integer",
        description: "Which thought is being reconsidered",
        minimum: 1
      },
      branchFromThought: {
        type: "integer",
        description: "Branching point thought number",
        minimum: 1
      },
      branchId: {
        type: "string",
        description: "Branch identifier"
      },
      needsMoreThoughts: {
        type: "boolean",
        description: "If more thoughts are needed"
      }
    },
    required: ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
};

// --- BEGIN ADDED TOOL DEFINITIONS ---

const COLLABORATIVE_REASONING_TOOL: Tool = {
  name: "collaborativereasoning",
  description: `A detailed tool for simulating expert collaboration with diverse perspectives.
This tool helps models tackle complex problems by coordinating multiple viewpoints.
It provides a framework for structured collaborative reasoning and perspective integration.`,
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string" },
      personas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            expertise: { type: "array", items: { type: "string" } },
            background: { type: "string" },
            perspective: { type: "string" },
            biases: { type: "array", items: { type: "string" } },
            communication: {
              type: "object",
              properties: {
                style: { type: "string" },
                tone: { type: "string" },
              },
              required: ["style", "tone"],
            },
          },
          required: ["id", "name", "expertise", "background", "perspective", "biases", "communication"],
        },
      },
      contributions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaId: { type: "string" },
            content: { type: "string" },
            type: { type: "string", enum: ["observation", "question", "insight", "concern", "suggestion", "challenge", "synthesis"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            referenceIds: { type: "array", items: { type: "string" } },
          },
          required: ["personaId", "content", "type", "confidence"],
        },
      },
      stage: { type: "string", enum: ["problem-definition", "ideation", "critique", "integration", "decision", "reflection"] },
      activePersonaId: { type: "string" },
      nextPersonaId: { type: "string" },
      consensusPoints: { type: "array", items: { type: "string" } },
      disagreements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            topic: { type: "string" },
            positions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  personaId: { type: "string" },
                  position: { type: "string" },
                  arguments: { type: "array", items: { type: "string" } },
                },
                required: ["personaId", "position", "arguments"],
              },
            },
            resolution: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["consensus", "compromise", "integration", "tabled"] },
                description: { type: "string" },
              },
              required: ["type", "description"],
            },
          },
          required: ["topic", "positions"],
        },
      },
      keyInsights: { type: "array", items: { type: "string" } },
      openQuestions: { type: "array", items: { type: "string" } },
      finalRecommendation: { type: "string" },
      sessionId: { type: "string", description: "Unique identifier for this collaboration session" },
      iteration: { type: "number", minimum: 0, description: "Current iteration of the collaboration" },
      suggestedContributionTypes: {
        type: "array",
        items: { type: "string", enum: ["observation", "question", "insight", "concern", "suggestion", "challenge", "synthesis"] },
      },
      nextContributionNeeded: { type: "boolean", description: "Whether another contribution is needed" },
    },
    required: ["topic", "personas", "contributions", "stage", "activePersonaId", "sessionId", "iteration", "nextContributionNeeded"],
  },
};

const DECISION_FRAMEWORK_TOOL: Tool = {
  name: "decisionframework",
  description: `A detailed tool for structured decision analysis and rational choice.
This tool helps models systematically evaluate options, criteria, and outcomes.
It supports multiple decision frameworks, probability estimates, and value judgments.`,
  inputSchema: {
    type: "object",
    properties: {
      decisionStatement: { type: "string" },
      options: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "description"],
        },
      },
      criteria: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            weight: { type: "number", minimum: 0, maximum: 1 },
            evaluationMethod: { type: "string", enum: ["quantitative", "qualitative", "boolean"] },
          },
          required: ["name", "description", "weight", "evaluationMethod"],
        },
      },
      stakeholders: { type: "array", items: { type: "string" } },
      constraints: { type: "array", items: { type: "string" } },
      timeHorizon: { type: "string" },
      riskTolerance: { type: "string", enum: ["risk-averse", "risk-neutral", "risk-seeking"] },
      possibleOutcomes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            description: { type: "string" },
            probability: { type: "number", minimum: 0, maximum: 1 },
            value: { type: "number" },
            optionId: { type: "string" },
            confidenceInEstimate: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["description", "probability", "optionId", "value", "confidenceInEstimate"],
        },
      },
      criteriaEvaluations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterionId: { type: "string" },
            optionId: { type: "string" },
            score: { type: "number", minimum: 0, maximum: 1 },
            justification: { type: "string" },
          },
          required: ["criterionId", "optionId", "score", "justification"],
        },
      },
      informationGaps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            impact: { type: "number", minimum: 0, maximum: 1 },
            researchMethod: { type: "string" },
          },
          required: ["description", "impact", "researchMethod"],
        },
      },
      analysisType: { type: "string", enum: ["expected-utility", "multi-criteria", "maximin", "minimax-regret", "satisficing"] },
      stage: { type: "string", enum: ["problem-definition", "options", "criteria", "evaluation", "analysis", "recommendation"] },
      recommendation: { type: "string" },
      sensitivityInsights: { type: "array", items: { type: "string" } },
      expectedValues: { type: "object", additionalProperties: { type: "number" } },
      multiCriteriaScores: { type: "object", additionalProperties: { type: "number" } },
      decisionId: { type: "string", description: "Unique identifier for this decision" },
      iteration: { type: "number", minimum: 0, description: "Current iteration of the decision analysis" },
      suggestedNextStage: { type: "string" },
      nextStageNeeded: { type: "boolean", description: "Whether another stage is needed" },
    },
    required: ["decisionStatement", "options", "analysisType", "stage", "decisionId", "iteration", "nextStageNeeded"],
  },
};

const METACOGNITIVE_MONITORING_TOOL: Tool = {
  name: "metacognitivemonitoring",
  description: `A detailed tool for systematic self-monitoring of knowledge and reasoning quality.
This tool helps models track knowledge boundaries, claim certainty, and reasoning biases.
It provides a framework for metacognitive assessment across various domains and reasoning tasks.`,
  inputSchema: {
    type: "object",
    properties: {
      task: { type: "string" },
      stage: { type: "string", enum: ["knowledge-assessment", "planning", "execution", "monitoring", "evaluation", "reflection"] },
      knowledgeAssessment: {
        type: "object",
        properties: {
          domain: { type: "string" },
          knowledgeLevel: { type: "string", enum: ["expert", "proficient", "familiar", "basic", "minimal", "none"] },
          confidenceScore: { type: "number", minimum: 0, maximum: 1 },
          supportingEvidence: { type: "string" },
          knownLimitations: { type: "array", items: { type: "string" } },
          relevantTrainingCutoff: { type: "string" },
        },
        required: ["domain", "knowledgeLevel", "confidenceScore", "supportingEvidence", "knownLimitations"],
      },
      claims: {
        type: "array",
        items: {
          type: "object",
          properties: {
            claim: { type: "string" },
            status: { type: "string", enum: ["fact", "inference", "speculation", "uncertain"] },
            confidenceScore: { type: "number", minimum: 0, maximum: 1 },
            evidenceBasis: { type: "string" },
            falsifiabilityCriteria: { type: "string" },
            alternativeInterpretations: { type: "array", items: { type: "string" } },
          },
          required: ["claim", "status", "confidenceScore", "evidenceBasis"],
        },
      },
      reasoningSteps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            step: { type: "string" },
            potentialBiases: { type: "array", items: { type: "string" } },
            assumptions: { type: "array", items: { type: "string" } },
            logicalValidity: { type: "number", minimum: 0, maximum: 1 },
            inferenceStrength: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["step", "potentialBiases", "assumptions", "logicalValidity", "inferenceStrength"],
        },
      },
      overallConfidence: { type: "number", minimum: 0, maximum: 1 },
      uncertaintyAreas: { type: "array", items: { type: "string" } },
      recommendedApproach: { type: "string" },
      monitoringId: { type: "string", description: "Unique identifier for this monitoring session" },
      iteration: { type: "number", minimum: 0, description: "Current iteration of the monitoring process" },
      suggestedAssessments: {
        type: "array",
        items: { type: "string", enum: ["knowledge", "claim", "reasoning", "overall"] },
      },
      nextAssessmentNeeded: { type: "boolean", description: "Whether further assessment is needed" },
    },
    required: ["task", "stage", "overallConfidence", "uncertaintyAreas", "recommendedApproach", "monitoringId", "iteration", "nextAssessmentNeeded"],
  },
};

const SCIENTIFIC_METHOD_TOOL: Tool = {
  name: "scientificmethod",
  description: `A detailed tool for applying formal scientific reasoning to questions and problems.
This tool guides models through the scientific method with structured hypothesis testing.
It enforces explicit variable identification, prediction making, and evidence evaluation.`,
  inputSchema: {
    type: "object",
    properties: {
      stage: { type: "string", enum: ["observation", "question", "hypothesis", "experiment", "analysis", "conclusion", "iteration"] },
      observation: { type: "string" },
      question: { type: "string" },
      hypothesis: {
        type: "object",
        properties: {
          statement: { type: "string" },
          variables: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["independent", "dependent", "controlled", "confounding"] },
                operationalization: { type: "string" },
              },
              required: ["name", "type"],
            },
          },
          assumptions: { type: "array", items: { type: "string" } },
          hypothesisId: { type: "string" },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          domain: { type: "string" },
          iteration: { type: "number", minimum: 0 },
          alternativeTo: { type: "array", items: { type: "string" } },
          refinementOf: { type: "string" },
          status: { type: "string", enum: ["proposed", "testing", "supported", "refuted", "refined"] },
        },
        required: ["statement", "variables", "assumptions", "hypothesisId", "confidence", "domain", "iteration", "status"],
      },
      experiment: {
        type: "object",
        properties: {
          design: { type: "string" },
          methodology: { type: "string" },
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                if: { type: "string" },
                then: { type: "string" },
                else: { type: "string" },
              },
              required: ["if", "then"],
            },
          },
          experimentId: { type: "string" },
          hypothesisId: { type: "string" },
          controlMeasures: { type: "array", items: { type: "string" } },
          results: { type: "string" },
          outcomeMatched: { type: "boolean" },
          unexpectedObservations: { type: "array", items: { type: "string" } },
          limitations: { type: "array", items: { type: "string" } },
          nextSteps: { type: "array", items: { type: "string" } },
        },
        required: ["design", "methodology", "predictions", "experimentId", "hypothesisId", "controlMeasures"],
      },
      analysis: { type: "string" },
      conclusion: { type: "string" },
      inquiryId: { type: "string", description: "Unique identifier for this scientific inquiry" },
      iteration: { type: "number", minimum: 0, description: "Current iteration of the scientific process" },
      nextStageNeeded: { type: "boolean", description: "Whether another stage is needed in the process" },
    },
    required: ["stage", "inquiryId", "iteration", "nextStageNeeded"],
  },
};

const STRUCTURED_ARGUMENTATION_TOOL: Tool = {
  name: "structuredargumentation",
  description: `A detailed tool for systematic dialectical reasoning and argument analysis.
This tool helps analyze complex questions through formal argumentation structures.
It facilitates the creation, critique, and synthesis of competing arguments.`,
  inputSchema: {
    type: "object",
    properties: {
      claim: { type: "string" },
      premises: { type: "array", items: { type: "string" } },
      conclusion: { type: "string" },
      argumentId: { type: "string", description: "Optional unique identifier for this argument" },
      argumentType: { type: "string", enum: ["thesis", "antithesis", "synthesis", "objection", "rebuttal"] },
      confidence: { type: "number", minimum: 0, maximum: 1, description: "Confidence level in this argument (0.0-1.0)" },
      respondsTo: { type: "string", description: "ID of the argument this directly responds to" },
      supports: { type: "array", items: { type: "string" }, description: "IDs of arguments this supports" },
      contradicts: { type: "array", items: { type: "string" }, description: "IDs of arguments this contradicts" },
      strengths: { type: "array", items: { type: "string" }, description: "Notable strong points of the argument" },
      weaknesses: { type: "array", items: { type: "string" }, description: "Notable weak points of the argument" },
      nextArgumentNeeded: { type: "boolean", description: "Whether another argument is needed in the dialectic" },
      suggestedNextTypes: {
        type: "array",
        items: { type: "string", enum: ["thesis", "antithesis", "synthesis", "objection", "rebuttal"] },
        description: "Suggested types for the next argument",
      },
    },
    required: ["claim", "premises", "conclusion", "argumentType", "confidence", "nextArgumentNeeded"],
  },
};

const VISUAL_REASONING_TOOL: Tool = {
  name: "visualreasoning",
  description: `A tool for visual thinking, problem-solving, and communication.
This tool enables models to create, manipulate, and interpret diagrams, graphs, and other visual representations.
It supports various visual elements and operations to facilitate insight generation and hypothesis testing.`,
  inputSchema: {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["create", "update", "delete", "transform", "observe"] },
      elements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["node", "edge", "container", "annotation"] },
            label: { type: "string" },
            properties: { type: "object", additionalProperties: true },
            source: { type: "string" },
            target: { type: "string" },
            contains: { type: "array", items: { type: "string" } },
          },
          required: ["id", "type", "properties"],
        },
      },
      transformationType: { type: "string", enum: ["rotate", "move", "resize", "recolor", "regroup"] },
      diagramId: { type: "string" },
      diagramType: { type: "string", enum: ["graph", "flowchart", "stateDiagram", "conceptMap", "treeDiagram", "custom"] },
      iteration: { type: "number", minimum: 0 },
      observation: { type: "string" },
      insight: { type: "string" },
      hypothesis: { type: "string" },
      nextOperationNeeded: { type: "boolean" },
    },
    required: ["operation", "diagramId", "diagramType", "iteration", "nextOperationNeeded"],
  },
};

// --- END ADDED TOOL DEFINITIONS ---

// Server Instances
const modelServer = new MentalModelServer();
const debuggingServer = new DebuggingApproachServer();
const thinkingServer = new SequentialThinkingServer();
const collaborativeReasoningServer = new CollaborativeReasoningServer();
const decisionFrameworkServer = new DecisionFrameworkServer();
const metacognitiveMonitoringServer = new MetacognitiveMonitoringServer();
const scientificMethodServer = new ScientificMethodServer();
const argumentationServer = new StructuredArgumentationServer();
const visualReasoningServer = new VisualReasoningServer();

const server = new Server(
  {
    name: "sequential-thinking-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {
        sequentialthinking: SEQUENTIAL_THINKING_TOOL,
        mentalmodel: MENTAL_MODEL_TOOL,
        debuggingapproach: DEBUGGING_APPROACH_TOOL,
        collaborativereasoning: COLLABORATIVE_REASONING_TOOL,
        decisionframework: DECISION_FRAMEWORK_TOOL,
        metacognitivemonitoring: METACOGNITIVE_MONITORING_TOOL,
        scientificmethod: SCIENTIFIC_METHOD_TOOL,
        structuredargumentation: STRUCTURED_ARGUMENTATION_TOOL,
        visualreasoning: VISUAL_REASONING_TOOL,
      },
    },
  }
);

// Request Handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  function fetch(server: { process: (args: unknown) => unknown, name?: string }, args: unknown) {
    const result = server.process(args);
    if (result instanceof Error) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Server '${server.name ?? "unknown"}' not found.`
      );
    } 
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } 

  try {
    switch (request.params.name) {
      case "sequentialthinking": {
        return fetch(thinkingServer, request.params.arguments);
      }
      case "mentalmodel": {
        return fetch(modelServer, request.params.arguments);  
      }
      case "debuggingapproach": {
        return fetch(debuggingServer, request.params.arguments);
      }
      case "collaborativereasoning": {
        return fetch(collaborativeReasoningServer, request.params.arguments);
      }
      case "decisionframework": {
        return fetch(decisionFrameworkServer, request.params.arguments);
      }
      case "metacognitivemonitoring": {
        return fetch(metacognitiveMonitoringServer, request.params.arguments);
      }
      case "scientificmethod": {
        return fetch(scientificMethodServer, request.params.arguments);
      }
      case "structuredargumentation": {
        return fetch(argumentationServer, request.params.arguments);
      }
      case "visualreasoning": {
        return fetch(visualReasoningServer, request.params.arguments);
      }
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool '${request.params.name}' not found.`
        );
    }
  } catch (error) {
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          status: 'failed'
        }, null, 2) 
      }]
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clear Thought MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
