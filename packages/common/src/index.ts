dimport { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mental Model Types
export interface MentalModelData {
  modelName: string;
  problem: string;
  steps: string[];
  reasoning: string;
  conclusion: string;
}

export type MentalModelName = 
  | 'first_principles'
  | 'opportunity_cost'
  | 'error_propagation'
  | 'rubber_duck'
  | 'pareto_principle'
  | 'occams_razor';

// Debugging Approach Types
export interface DebuggingApproachData {
  approachName: string;
  issue: string;
  steps: string[];
  findings: string;
  resolution: string;
}

export type DebuggingApproachName =
  | 'binary_search'
  | 'reverse_engineering'
  | 'divide_conquer'
  | 'backtracking'
  | 'cause_elimination'
  | 'program_slicing';

// Sequential Thinking Types
export interface SequentialThought {
  thought: string;
  thoughtNumber: number;
  isRevision: boolean;
  revisesThought?: number;
  branchFromThought?: number;
  branchId?: string;
}

export interface ThinkingSession {
  thoughts: SequentialThought[];
  totalThoughts: number;
  needsMoreThoughts: boolean;
}

// Shared Utilities
export function validateModelName(name: string): asserts name is MentalModelName {
  const validNames = [
    'first_principles',
    'opportunity_cost',
    'error_propagation',
    'rubber_duck',
    'pareto_principle',
    'occams_razor'
  ];
  
  if (!validNames.includes(name)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid mental model name: ${name}. Must be one of: ${validNames.join(', ')}`
    );
  }
}

export function validateApproachName(name: string): asserts name is DebuggingApproachName {
  const validNames = [
    'binary_search',
    'reverse_engineering',
    'divide_conquer',
    'backtracking',
    'cause_elimination',
    'program_slicing'
  ];
  
  if (!validNames.includes(name)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid debugging approach name: ${name}. Must be one of: ${validNames.join(', ')}`
    );
  }
}

export function validateThoughtNumber(num: number, maxThoughts: number): void {
  if (num < 1 || num > maxThoughts) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Thought number must be between 1 and ${maxThoughts}`
    );
  }
}

// Schema Utilities
export const mentalModelSchema = {
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
} as const;

export const debuggingApproachSchema = {
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
} as const;

export const sequentialThinkingSchema = {
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
  required: [
    "thought",
    "nextThoughtNeeded",
    "thoughtNumber",
    "totalThoughts"
  ]
} as const;
