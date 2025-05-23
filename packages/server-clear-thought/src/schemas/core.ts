import { z } from "zod/v4";

// Base validation schemas with proper V4 patterns
export const ConfidenceSchema = z.number({
  error: "Confidence must be a number between 0 and 1"
}).min(0).max(1);

export const ThoughtNumberSchema = z.number({
  error: "Thought number must be a positive integer"
}).int().positive();

export const ProbabilitySchema = z.number({
  error: "Probability must be a number between 0 and 1"
}).min(0).max(1);

// Helper for creating enum schemas with better error messages
export const EnumSchema = <T extends readonly string[]>(values: T, fieldName?: string) =>
  z.enum(values as any, {
    error: `${fieldName || 'Value'} must be one of: ${values.join(', ')}`
  });

// Sequential Thinking Schema
export const ThoughtDataSchema = z.object({
  thought: z.string({
    error: "Thought content is required and must be non-empty"
  }).min(1),
  thoughtNumber: ThoughtNumberSchema,
  totalThoughts: ThoughtNumberSchema,
  nextThoughtNeeded: z.boolean({
    error: "nextThoughtNeeded must be true or false"
  }),
  isRevision: z.boolean().optional(),
  revisesThought: ThoughtNumberSchema.optional(),
  branchFromThought: ThoughtNumberSchema.optional(),
  branchId: z.string().optional(),
  needsMoreThoughts: z.boolean().optional(),
});

// Mental Model Schema
export const MentalModelSchema = z.object({
  modelName: EnumSchema([
    "first_principles", "opportunity_cost", "error_propagation",
    "rubber_duck", "pareto_principle", "occams_razor"
  ], "Model name"),
  problem: z.string().min(1, {
    error: "Problem description cannot be empty"
  }),
  steps: z.array(z.string().min(1)).default([]),
  reasoning: z.string().default(""),
  conclusion: z.string().default("")
});

// Debugging Approach Schema
export const DebuggingApproachSchema = z.object({
  approachName: EnumSchema([
    "binary_search", "reverse_engineering", "divide_conquer",
    "backtracking", "cause_elimination", "program_slicing"
  ], "Debugging approach"),
  issue: z.string().min(1, {
    error: "Issue description cannot be empty"
  }),
  steps: z.array(z.string().min(1)).default([]),
  findings: z.string().default(""),
  resolution: z.string().default("")
});