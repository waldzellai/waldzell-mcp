import { z } from "zod";

// Base validation schemas with proper error messages
export const ConfidenceSchema = z.number()
  .min(0, { message: "Confidence must be at least 0" })
  .max(1, { message: "Confidence must be at most 1" })
  .describe("Confidence must be a number between 0 and 1");

export const ThoughtNumberSchema = z.number()
  .int({ message: "Thought number must be an integer" })
  .positive({ message: "Thought number must be positive" })
  .describe("Thought number must be a positive integer");

export const ProbabilitySchema = z.number()
  .min(0, { message: "Probability must be at least 0" })
  .max(1, { message: "Probability must be at most 1" })
  .describe("Probability must be a number between 0 and 1");

// Helper for creating enum schemas with better error messages
export const EnumSchema = <T extends readonly string[]>(values: T, fieldName?: string) =>
  z.enum(values as any).describe(
    `${fieldName || 'Value'} must be one of: ${values.join(', ')}`
  );

// Sequential Thinking Schema
export const ThoughtDataSchema = z.object({
  thought: z.string()
    .min(1, { message: "Thought content is required and must be non-empty" })
    .describe("Thought content is required and must be non-empty"),
  thoughtNumber: ThoughtNumberSchema,
  totalThoughts: ThoughtNumberSchema,
  nextThoughtNeeded: z.boolean()
    .describe("nextThoughtNeeded must be true or false"),
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
  problem: z.string().min(1, { message: "Problem description cannot be empty" })
    .describe("Problem description cannot be empty"),
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
  issue: z.string().min(1, { message: "Issue description cannot be empty" })
    .describe("Issue description cannot be empty"),
  steps: z.array(z.string().min(1)).default([]),
  findings: z.string().default(""),
  resolution: z.string().default("")
});