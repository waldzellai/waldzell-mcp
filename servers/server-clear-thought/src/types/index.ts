/**
 * Type definitions for the Clear Thought MCP server
 * 
 * This file contains all the data structures used by the various thinking tools
 * in the Clear Thought MCP server.
 */

// ============================================================================
// Core Thinking Types
// ============================================================================

/**
 * Sequential thinking data structure
 * Represents a single thought in a sequential thinking process
 */
export interface ThoughtData {
  /** The content of the thought */
  thought: string;
  /** Current thought number in the sequence */
  thoughtNumber: number;
  /** Total expected thoughts in the sequence */
  totalThoughts: number;
  /** Whether this is a revision of a previous thought */
  isRevision?: boolean;
  /** Which thought number this revises */
  revisesThought?: number;
  /** Which thought this branches from */
  branchFromThought?: number;
  /** Unique identifier for this branch */
  branchId?: string;
  /** Whether more thoughts are needed beyond totalThoughts */
  needsMoreThoughts?: boolean;
  /** Whether the next thought in sequence is needed */
  nextThoughtNeeded: boolean;
}

/**
 * Mental model application data
 * Represents the application of a specific mental model to a problem
 */
export interface MentalModelData {
  /** Name of the mental model being applied */
  modelName: 'first_principles' | 'opportunity_cost' | 'error_propagation' | 
             'rubber_duck' | 'pareto_principle' | 'occams_razor';
  /** The problem being analyzed */
  problem: string;
  /** Steps taken to apply the model */
  steps: string[];
  /** Reasoning process */
  reasoning: string;
  /** Conclusions drawn from the analysis */
  conclusion: string;
}

/**
 * Debugging approach data
 * Represents a systematic debugging session
 */
export interface DebuggingApproachData {
  /** The debugging approach being used */
  approachName: 'binary_search' | 'reverse_engineering' | 'divide_conquer' |
                'backtracking' | 'cause_elimination' | 'program_slicing' |
                'log_analysis' | 'static_analysis' | 'root_cause_analysis' |
                'delta_debugging' | 'fuzzing' | 'incremental_testing';
  /** Description of the issue being debugged */
  issue: string;
  /** Steps taken during debugging */
  steps: string[];
  /** Findings discovered during the process */
  findings: string;
  /** How the issue was resolved */
  resolution: string;
}

/**
 * Debugging session data (alternative naming)
 */
export interface DebuggingSession extends DebuggingApproachData {}

// ============================================================================
// Collaborative Reasoning Types
// ============================================================================

/**
 * Persona definition for collaborative reasoning
 */
export interface PersonaData {
  /** Unique identifier for the persona */
  id: string;
  /** Name of the persona */
  name: string;
  /** Areas of expertise */
  expertise: string[];
  /** Background information */
  background: string;
  /** Perspective or viewpoint */
  perspective: string;
  /** Known biases */
  biases: string[];
  /** Communication preferences */
  communication: {
    /** Communication style */
    style: 'formal' | 'casual' | 'technical' | 'creative';
    /** Tone of communication */
    tone: 'analytical' | 'supportive' | 'challenging' | 'neutral';
  };
}

/**
 * Contribution from a persona in collaborative reasoning
 */
export interface ContributionData {
  /** ID of the persona making the contribution */
  personaId: string;
  /** Content of the contribution */
  content: string;
  /** Type of contribution */
  type: 'observation' | 'question' | 'insight' | 'concern' | 
        'suggestion' | 'challenge' | 'synthesis';
  /** Confidence level (0.0-1.0) */
  confidence: number;
  /** IDs of previous contributions this builds upon */
  referenceIds?: string[];
}

/**
 * Position in a disagreement
 */
export interface DisagreementPosition {
  /** ID of the persona holding this position */
  personaId: string;
  /** The position statement */
  position: string;
  /** Arguments supporting the position */
  arguments: string[];
}

/**
 * Resolution of a disagreement
 */
export interface DisagreementResolution {
  /** Type of resolution reached */
  type: 'consensus' | 'compromise' | 'integration' | 'tabled';
  /** Description of the resolution */
  description: string;
}

/**
 * Disagreement data structure
 */
export interface DisagreementData {
  /** Topic of disagreement */
  topic: string;
  /** Different positions */
  positions: DisagreementPosition[];
  /** Resolution if reached */
  resolution?: DisagreementResolution;
}

/**
 * Complete collaborative reasoning session
 */
export interface CollaborativeSession {
  /** Topic being discussed */
  topic: string;
  /** Personas participating */
  personas: PersonaData[];
  /** All contributions made */
  contributions: ContributionData[];
  /** Current stage of the process */
  stage: 'problem-definition' | 'ideation' | 'critique' | 
         'integration' | 'decision' | 'reflection';
  /** Currently active persona ID */
  activePersonaId: string;
  /** Next persona ID if determined */
  nextPersonaId?: string;
  /** Points of consensus reached */
  consensusPoints?: string[];
  /** Active disagreements */
  disagreements?: DisagreementData[];
  /** Key insights discovered */
  keyInsights?: string[];
  /** Questions still open */
  openQuestions?: string[];
  /** Final recommendation if reached */
  finalRecommendation?: string;
  /** Session identifier */
  sessionId: string;
  /** Current iteration number */
  iteration: number;
  /** Suggested types for next contribution */
  suggestedContributionTypes?: ContributionData['type'][];
  /** Whether next contribution is needed */
  nextContributionNeeded: boolean;
}

// ============================================================================
// Decision Framework Types
// ============================================================================

/**
 * Option in a decision
 */
export interface DecisionOption {
  /** Unique identifier */
  id?: string;
  /** Name of the option */
  name: string;
  /** Description of the option */
  description: string;
}

/**
 * Criterion for evaluating options
 */
export interface DecisionCriterion {
  /** Unique identifier */
  id?: string;
  /** Name of the criterion */
  name: string;
  /** Description of the criterion */
  description: string;
  /** Weight (0.0-1.0) */
  weight: number;
  /** How to evaluate this criterion */
  evaluationMethod: 'quantitative' | 'qualitative' | 'boolean';
}

/**
 * Evaluation of a criterion for an option
 */
export interface CriterionEvaluation {
  /** ID of the criterion */
  criterionId: string;
  /** ID of the option */
  optionId: string;
  /** Score (0.0-1.0) */
  score: number;
  /** Justification for the score */
  justification: string;
}

/**
 * Possible outcome of a decision
 */
export interface PossibleOutcome {
  /** Unique identifier */
  id?: string;
  /** Description of the outcome */
  description: string;
  /** Probability (0.0-1.0) */
  probability: number;
  /** Utility value */
  value: number;
  /** Associated option ID */
  optionId: string;
  /** Confidence in the estimate (0.0-1.0) */
  confidenceInEstimate: number;
}

/**
 * Information gap in decision making
 */
export interface InformationGap {
  /** Description of what's missing */
  description: string;
  /** Impact on decision (0.0-1.0) */
  impact: number;
  /** How to research this gap */
  researchMethod: string;
}

/**
 * Complete decision framework data
 */
export interface DecisionData {
  /** Statement of the decision to be made */
  decisionStatement: string;
  /** Available options */
  options: DecisionOption[];
  /** Evaluation criteria */
  criteria?: DecisionCriterion[];
  /** Stakeholders involved */
  stakeholders?: string[];
  /** Constraints on the decision */
  constraints?: string[];
  /** Time horizon for the decision */
  timeHorizon?: string;
  /** Risk tolerance level */
  riskTolerance?: 'risk-averse' | 'risk-neutral' | 'risk-seeking';
  /** Possible outcomes */
  possibleOutcomes?: PossibleOutcome[];
  /** Criteria evaluations */
  criteriaEvaluations?: CriterionEvaluation[];
  /** Information gaps identified */
  informationGaps?: InformationGap[];
  /** Type of analysis being performed */
  analysisType: 'expected-utility' | 'multi-criteria' | 'maximin' | 
                'minimax-regret' | 'satisficing';
  /** Current stage of the process */
  stage: 'problem-definition' | 'options' | 'criteria' | 
         'evaluation' | 'analysis' | 'recommendation';
  /** Final recommendation */
  recommendation?: string;
  /** Sensitivity analysis insights */
  sensitivityInsights?: string[];
  /** Expected values for options */
  expectedValues?: Record<string, number>;
  /** Multi-criteria scores */
  multiCriteriaScores?: Record<string, number>;
  /** Decision session ID */
  decisionId: string;
  /** Current iteration */
  iteration: number;
  /** Suggested next stage */
  suggestedNextStage?: string;
  /** Whether next stage is needed */
  nextStageNeeded: boolean;
}

// ============================================================================
// Metacognitive Monitoring Types
// ============================================================================

/**
 * Assessment of knowledge in a domain
 */
export interface KnowledgeAssessment {
  /** Domain being assessed */
  domain: string;
  /** Level of knowledge */
  knowledgeLevel: 'expert' | 'proficient' | 'familiar' | 
                  'basic' | 'minimal' | 'none';
  /** Confidence score (0.0-1.0) */
  confidenceScore: number;
  /** Evidence supporting the assessment */
  supportingEvidence: string;
  /** Known limitations */
  knownLimitations: string[];
  /** Relevant training cutoff date */
  relevantTrainingCutoff?: string;
}

/**
 * Assessment of a claim
 */
export interface ClaimAssessment {
  /** The claim being assessed */
  claim: string;
  /** Status of the claim */
  status: 'fact' | 'inference' | 'speculation' | 'uncertain';
  /** Confidence score (0.0-1.0) */
  confidenceScore: number;
  /** Basis for the evidence */
  evidenceBasis: string;
  /** How the claim could be falsified */
  falsifiabilityCriteria?: string;
  /** Alternative interpretations */
  alternativeInterpretations?: string[];
}

/**
 * Assessment of reasoning
 */
export interface ReasoningAssessment {
  /** The reasoning step */
  step: string;
  /** Potential biases identified */
  potentialBiases: string[];
  /** Assumptions made */
  assumptions: string[];
  /** Logical validity (0.0-1.0) */
  logicalValidity: number;
  /** Inference strength (0.0-1.0) */
  inferenceStrength: number;
}

/**
 * Complete metacognitive monitoring data
 */
export interface MetacognitiveData {
  /** Task being monitored */
  task: string;
  /** Current stage */
  stage: 'knowledge-assessment' | 'planning' | 'execution' | 
         'monitoring' | 'evaluation' | 'reflection';
  /** Knowledge assessment */
  knowledgeAssessment?: KnowledgeAssessment;
  /** Claims made */
  claims?: ClaimAssessment[];
  /** Reasoning steps */
  reasoningSteps?: ReasoningAssessment[];
  /** Overall confidence (0.0-1.0) */
  overallConfidence: number;
  /** Areas of uncertainty */
  uncertaintyAreas: string[];
  /** Recommended approach */
  recommendedApproach: string;
  /** Monitoring session ID */
  monitoringId: string;
  /** Current iteration */
  iteration: number;
  /** Suggested assessments */
  suggestedAssessments?: ('knowledge' | 'claim' | 'reasoning' | 'overall')[];
  /** Whether next assessment is needed */
  nextAssessmentNeeded: boolean;
}

// ============================================================================
// Scientific Method Types
// ============================================================================

/**
 * Variable in scientific inquiry
 */
export interface Variable {
  /** Name of the variable */
  name: string;
  /** Type of variable */
  type: 'independent' | 'dependent' | 'controlled' | 'confounding';
  /** How the variable is operationalized */
  operationalization?: string;
}

/**
 * Hypothesis data
 */
export interface HypothesisData {
  /** The hypothesis statement */
  statement: string;
  /** Variables involved */
  variables: Variable[];
  /** Assumptions made */
  assumptions: string[];
  /** Hypothesis ID */
  hypothesisId: string;
  /** Confidence (0.0-1.0) */
  confidence: number;
  /** Domain of the hypothesis */
  domain: string;
  /** Current iteration */
  iteration: number;
  /** Alternative hypotheses */
  alternativeTo?: string[];
  /** If this refines another hypothesis */
  refinementOf?: string;
  /** Current status */
  status: 'proposed' | 'testing' | 'supported' | 'refuted' | 'refined';
}

/**
 * Prediction from hypothesis
 */
export interface Prediction {
  /** If condition */
  if: string;
  /** Then outcome */
  then: string;
  /** Else outcome */
  else?: string;
}

/**
 * Experiment data
 */
export interface ExperimentData {
  /** Experiment design */
  design: string;
  /** Methodology used */
  methodology: string;
  /** Predictions made */
  predictions: Prediction[];
  /** Experiment ID */
  experimentId: string;
  /** Associated hypothesis ID */
  hypothesisId: string;
  /** Control measures */
  controlMeasures: string[];
  /** Results obtained */
  results?: string;
  /** Whether outcome matched predictions */
  outcomeMatched?: boolean;
  /** Unexpected observations */
  unexpectedObservations?: string[];
  /** Limitations identified */
  limitations?: string[];
  /** Next steps */
  nextSteps?: string[];
}

/**
 * Scientific inquiry session (not in backup files but in current implementation)
 */
export interface ScientificInquiryData {
  /** Current stage */
  stage: 'observation' | 'question' | 'hypothesis' | 
         'experiment' | 'analysis' | 'conclusion' | 'iteration';
  /** Initial observation */
  observation?: string;
  /** Research question */
  question?: string;
  /** Hypothesis */
  hypothesis?: HypothesisData;
  /** Experiment */
  experiment?: ExperimentData;
  /** Analysis results */
  analysis?: string;
  /** Conclusions drawn */
  conclusion?: string;
  /** Inquiry ID */
  inquiryId: string;
  /** Current iteration */
  iteration: number;
  /** Whether next stage is needed */
  nextStageNeeded: boolean;
}

// ============================================================================
// Argumentation Types
// ============================================================================

/**
 * Argument data structure
 */
export interface ArgumentData {
  /** The main claim */
  claim: string;
  /** Supporting premises */
  premises: string[];
  /** Conclusion drawn */
  conclusion: string;
  /** Argument ID */
  argumentId?: string;
  /** Type of argument */
  argumentType: 'deductive' | 'inductive' | 'abductive' | 'analogical';
  /** Confidence (0.0-1.0) */
  confidence: number;
  /** What this responds to */
  respondsTo?: string;
  /** Arguments this supports */
  supports?: string[];
  /** Arguments this contradicts */
  contradicts?: string[];
  /** Identified strengths */
  strengths?: string[];
  /** Identified weaknesses */
  weaknesses?: string[];
  /** Relevance score (0.0-1.0) */
  relevance?: number;
  /** Session ID */
  sessionId: string;
  /** Current iteration */
  iteration: number;
  /** Suggested next argument types */
  suggestedNextTypes?: ArgumentData['argumentType'][];
  /** Whether next argument is needed */
  nextArgumentNeeded: boolean;
}

/**
 * Socratic method data (derived from structured argumentation)
 */
export interface SocraticData extends ArgumentData {
  /** Question being explored */
  question?: string;
  /** Method stage */
  stage?: 'clarification' | 'assumptions' | 'evidence' | 
          'perspectives' | 'implications' | 'questions';
}

// ============================================================================
// Creative Thinking Types
// ============================================================================

/**
 * Creative thinking data
 * Note: Not found in backup files but exists in current implementation
 */
export interface CreativeData {
  /** Creative prompt or challenge */
  prompt: string;
  /** Ideas generated */
  ideas: string[];
  /** Techniques used */
  techniques: string[];
  /** Connections made */
  connections: string[];
  /** Novel insights */
  insights: string[];
  /** Session ID */
  sessionId: string;
  /** Current iteration */
  iteration: number;
  /** Whether more creativity is needed */
  nextIdeaNeeded: boolean;
}

// ============================================================================
// Systems Thinking Types
// ============================================================================

/**
 * Systems thinking data
 * Note: Not found in backup files but exists in current implementation
 */
export interface SystemsData {
  /** System being analyzed */
  system: string;
  /** Components identified */
  components: string[];
  /** Relationships between components */
  relationships: Array<{
    from: string;
    to: string;
    type: string;
    strength?: number;
  }>;
  /** Feedback loops identified */
  feedbackLoops: Array<{
    components: string[];
    type: 'positive' | 'negative';
    description: string;
  }>;
  /** Emergent properties */
  emergentProperties: string[];
  /** Leverage points */
  leveragePoints: string[];
  /** Session ID */
  sessionId: string;
  /** Current iteration */
  iteration: number;
  /** Whether more analysis is needed */
  nextAnalysisNeeded: boolean;
}

// ============================================================================
// Visual Reasoning Types
// ============================================================================

/**
 * Visual element in a diagram
 */
export interface VisualElement {
  /** Element ID */
  id: string;
  /** Type of element */
  type: 'node' | 'edge' | 'container' | 'annotation';
  /** Element label */
  label?: string;
  /** Additional properties */
  properties: Record<string, any>;
  /** Source node (for edges) */
  source?: string;
  /** Target node (for edges) */
  target?: string;
  /** Contained elements (for containers) */
  contains?: string[];
}

/**
 * Visual reasoning operation data
 */
export interface VisualData {
  /** Operation being performed */
  operation: 'create' | 'update' | 'delete' | 'transform' | 'observe';
  /** Elements involved */
  elements?: VisualElement[];
  /** Type of transformation */
  transformationType?: 'rotate' | 'move' | 'resize' | 'recolor' | 'regroup';
  /** Diagram ID */
  diagramId: string;
  /** Type of diagram */
  diagramType: 'concept-map' | 'flowchart' | 'mind-map' | 'timeline' | 'custom';
  /** Current iteration */
  iteration: number;
  /** Observation made */
  observation?: string;
  /** Insight gained */
  insight?: string;
  /** Hypothesis formed */
  hypothesis?: string;
  /** Whether next operation is needed */
  nextOperationNeeded: boolean;
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Session export format for import/export functionality
 */
export interface SessionExport {
  /** Export format version */
  version: string;
  /** Export timestamp */
  timestamp: string;
  /** Session ID */
  sessionId: string;
  /** Type of thinking session */
  sessionType: 'sequential' | 'mental-model' | 'debugging' | 'collaborative' |
               'decision' | 'metacognitive' | 'scientific' | 'socratic' |
               'creative' | 'systems' | 'visual';
  /** Session data (varies by type) */
  data: ThoughtData | MentalModelData | DebuggingSession | CollaborativeSession |
        DecisionData | MetacognitiveData | ScientificInquiryData | SocraticData |
        CreativeData | SystemsData | VisualData;
  /** Session metadata */
  metadata?: {
    /** User who created the session */
    user?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Session description */
    description?: string;
    /** Custom metadata */
    custom?: Record<string, any>;
  };
}

/**
 * Result from processing a thinking operation
 */
export interface ProcessResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Content to return */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}