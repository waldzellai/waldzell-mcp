import { z } from 'zod';

// ModelPin schema
export const ModelPinSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'local']),
  name: z.string().min(1),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1).optional(),
});

// ToolSpec schema
export const ToolSpecSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  allowNetwork: z.boolean(),
  allowFilesystem: z.boolean(),
  sideEffect: z.enum(['none', 'idempotent', 'non-idempotent']),
  egressAllowlist: z.array(z.string()).optional().default([]),
});

// SandboxPolicy schema
export const SandboxPolicySchema = z.object({
  driver: z.enum(['docker', 'gvisor', 'firecracker']),
  cpuMsLimit: z.number().positive(),
  memMB: z.number().positive(),
  fsReadonly: z.boolean(),
  writableMounts: z.array(z.string()).default([]),
  networkEgress: z.enum(['blocked', 'allowlist']),
  egressAllowlist: z.array(z.string()).default([]),
  envAllowlist: z.array(z.string()).default([]),
});

// NodeSpec schemas (discriminated union)
const BaseNodeSpecSchema = z.object({
  id: z.string().min(1),
});

const ToolNodeSpecSchema = BaseNodeSpecSchema.extend({
  kind: z.literal('tool'),
  toolId: z.string().min(1),
  config: z.record(z.unknown()).optional(),
  timeout: z.number().positive().optional(),
});

const LLMNodeSpecSchema = BaseNodeSpecSchema.extend({
  kind: z.literal('llm'),
  modelPin: ModelPinSchema,
  promptTemplate: z.string().min(1),
  maxTokens: z.number().positive().optional(),
});

const RouterNodeSpecSchema = BaseNodeSpecSchema.extend({
  kind: z.literal('router'),
  condition: z.string().min(1),
  routes: z.record(z.string()),
});

const CriticNodeSpecSchema = BaseNodeSpecSchema.extend({
  kind: z.literal('critic'),
  verdictSchema: z.object({
    pass: z.boolean(),
    score: z.number().optional(),
    feedback: z.string().optional(),
    action: z.enum(['continue', 'retry', 'abort']),
  }),
  retryLimit: z.number().int().nonnegative().optional(),
});

export const NodeSpecSchema = z.discriminatedUnion('kind', [
  ToolNodeSpecSchema,
  LLMNodeSpecSchema,
  RouterNodeSpecSchema,
  CriticNodeSpecSchema,
]);

// EdgeSpec schema
export const EdgeSpecSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  condition: z.string().optional(),
});

// GraphSpec schema
export const GraphSpecSchema = z.object({
  id: z.string().uuid(),
  version: z.string().min(1),
  nodes: z.array(NodeSpecSchema).min(1),
  edges: z.array(EdgeSpecSchema),
  contracts: z.array(z.string()).default([]),
});

// CandidateManifest schema
export const CandidateManifestSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  modelPins: z.object({
    planner: ModelPinSchema,
    coder: ModelPinSchema,
    grader: ModelPinSchema,
    attacker: ModelPinSchema,
  }),
  tools: z.array(ToolSpecSchema).default([]),
  sandbox: SandboxPolicySchema,
  seeds: z.record(z.number()).default({}),
  containers: z.record(z.string()).default({}),
  datasets: z.array(z.string()).default([]),
  budgets: z.object({
    maxNodes: z.number().int().positive(),
    maxLOC: z.number().int().positive(),
    maxToolKinds: z.number().int().positive(),
  }),
  notes: z.string().optional(),
});

// BehaviorTrace schema
export const BehaviorTraceSchema = z.object({
  candidateId: z.string().uuid(),
  inputHash: z.string(),
  steps: z.array(z.object({
    t: z.number(),
    nodeId: z.string(),
    action: z.enum(['tool', 'llm', 'branch', 'merge']),
    requestHash: z.string(),
    responseHash: z.string(),
    error: z.string().optional(),
  })),
});

// EvalResult schema
export const EvalResultSchema = z.object({
  candidateId: z.string().uuid(),
  suiteId: z.string().min(1),
  metrics: z.object({
    accuracy: z.number().min(0).max(1).optional(),
    latencyP95: z.number().nonnegative().optional(),
    errorRate: z.number().min(0).max(1).optional(),
    chaosDivergence: z.number().nonnegative().optional(),
    idempotencyPassRate: z.number().min(0).max(1).optional(),
    retryHygieneScore: z.number().min(0).max(1).optional(),
  }),
  pass: z.boolean(),
});

// NoveltyResult schema
export const NoveltyResultSchema = z.object({
  candidateId: z.string().uuid(),
  structuralDelta: z.number().nonnegative(),
  sizePenalty: z.number().nonnegative(),
  behavioralDistance: z.number().nonnegative(),
  pass: z.boolean(),
});

// Validation error with field path
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldPath: string,
    public readonly issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  static fromZodError(error: z.ZodError, context: string = ''): ValidationError {
    const fieldPath = error.issues[0]?.path.join('.') || 'root';
    const message = `${context ? context + ': ' : ''}Validation failed at "${fieldPath}": ${error.issues[0]?.message}`;
    return new ValidationError(message, fieldPath, error.issues);
  }
}
