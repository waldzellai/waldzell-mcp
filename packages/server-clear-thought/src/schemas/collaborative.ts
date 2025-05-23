import { z } from "zod/v4";
import { ConfidenceSchema, EnumSchema } from "./core.js";

// Persona Schema with enhanced validation
export const PersonaSchema = z.object({
  id: z.string().min(1, { error: "Persona ID cannot be empty" }),
  name: z.string().min(1).max(100, {
    error: "Persona name must be 1-100 characters"
  }),
  expertise: z.array(z.string().min(1)).min(1).max(10, {
    error: "Expertise list must have 1-10 non-empty items"
  }),
  background: z.string().min(10).max(500, {
    error: "Background must be 10-500 characters"
  }),
  perspective: z.string().min(10).max(200, {
    error: "Perspective must be 10-200 characters"
  }),
  biases: z.array(z.string().min(1)).max(5, {
    error: "Biases list can have at most 5 items"
  }),
  communication: z.object({
    style: EnumSchema(["formal", "casual", "technical", "creative"], "Communication style"),
    tone: EnumSchema(["analytical", "supportive", "challenging", "neutral"], "Communication tone")
  })
});

// Contribution Schema
export const ContributionSchema = z.object({
  personaId: z.string().min(1),
  content: z.string().min(1, {
    error: "Contribution content cannot be empty"
  }),
  type: EnumSchema([
    "observation", "question", "insight", "concern", 
    "suggestion", "challenge", "synthesis"
  ], "Contribution type"),
  confidence: ConfidenceSchema,
  referenceIds: z.array(z.string()).optional()
});

// Disagreement Schemas
export const DisagreementPositionSchema = z.object({
  personaId: z.string().min(1),
  position: z.string().min(1),
  arguments: z.array(z.string().min(1))
});

export const DisagreementResolutionSchema = z.object({
  type: EnumSchema(["consensus", "compromise", "integration", "tabled"], "Resolution type"),
  description: z.string().min(1)
});

export const DisagreementSchema = z.object({
  topic: z.string().min(1),
  positions: z.array(DisagreementPositionSchema).min(1),
  resolution: DisagreementResolutionSchema.optional()
});

// Main Collaborative Reasoning Schema
export const CollaborativeReasoningSchema = z.object({
  topic: z.string().min(1, {
    error: "Topic cannot be empty"
  }),
  personas: z.array(PersonaSchema).min(1, {
    error: "At least one persona is required"
  }),
  contributions: z.array(ContributionSchema),
  stage: EnumSchema([
    "problem-definition", "ideation", "critique", 
    "integration", "decision", "reflection"
  ], "Collaboration stage"),
  activePersonaId: z.string().min(1),
  nextPersonaId: z.string().optional(),
  consensusPoints: z.array(z.string()).default([]),
  disagreements: z.array(DisagreementSchema).default([]),
  keyInsights: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  finalRecommendation: z.string().optional(),
  sessionId: z.string().min(1, {
    error: "Session ID is required"
  }),
  iteration: z.number().int().min(0),
  suggestedContributionTypes: z.array(EnumSchema([
    "observation", "question", "insight", "concern", 
    "suggestion", "challenge", "synthesis"
  ])).default([]),
  nextContributionNeeded: z.boolean()
});