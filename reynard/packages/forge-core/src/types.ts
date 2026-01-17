export type UUID = string;

export interface ModelPin {
  provider: 'openai'|'anthropic'|'local';
  name: string;
  temperature: number;
  topP?: number;
}

export interface ToolSpec {
  id: string;
  version: string;
  allowNetwork: boolean;
  allowFilesystem: boolean;
  sideEffect: 'none'|'idempotent'|'non-idempotent';
  egressAllowlist?: string[];
}

export interface SandboxPolicy {
  driver: 'docker'|'gvisor'|'firecracker';
  cpuMsLimit: number;
  memMB: number;
  fsReadonly: boolean;
  writableMounts: string[];
  networkEgress: 'blocked'|'allowlist';
  egressAllowlist: string[];
  envAllowlist: string[];
}

export interface CandidateManifest {
  id: UUID;
  parentId?: UUID;
  createdAt: string;
  modelPins: Record<'planner'|'coder'|'grader'|'attacker', ModelPin>;
  tools: ToolSpec[];
  sandbox: SandboxPolicy;
  seeds: Record<string, number>;
  containers: Record<string, string>;
  datasets: string[];
  budgets: { maxNodes: number; maxLOC: number; maxToolKinds: number };
  notes?: string;
}

export interface BaseNodeSpec {
  id: string;
  kind: 'tool' | 'llm' | 'router' | 'critic';
}

export interface ToolNodeSpec extends BaseNodeSpec {
  kind: 'tool';
  toolId: string;
  config?: Record<string, unknown>;
  timeout?: number;
}

export interface LLMNodeSpec extends BaseNodeSpec {
  kind: 'llm';
  modelPin: ModelPin;
  promptTemplate: string;
  maxTokens?: number;
}

export interface RouterNodeSpec extends BaseNodeSpec {
  kind: 'router';
  condition: string; // JavaScript expression evaluated at runtime
  routes: Record<string, string>; // condition result -> nodeId
}

export interface CriticNodeSpec extends BaseNodeSpec {
  kind: 'critic';
  verdictSchema: {
    pass: boolean;
    score?: number;
    feedback?: string;
    action: 'continue' | 'retry' | 'abort';
  };
  retryLimit?: number;
}

export type NodeSpec = ToolNodeSpec | LLMNodeSpec | RouterNodeSpec | CriticNodeSpec;

export interface EdgeSpec { from: string; to: string; condition?: string; }

export interface GraphSpec {
  id: UUID;
  version: string;
  nodes: NodeSpec[];
  edges: EdgeSpec[];
  contracts: string[];
}

export interface BehaviorTrace {
  candidateId: UUID;
  inputHash: string;
  steps: Array<{ t: number; nodeId: string; action: 'tool'|'llm'|'branch'|'merge'; requestHash: string; responseHash: string; error?: string; }>;
}

export interface EvalResult {
  candidateId: UUID;
  suiteId: string;
  metrics: {
    accuracy?: number;
    latencyP95?: number;
    errorRate?: number;
    chaosDivergence?: number;
    idempotencyPassRate?: number;
    retryHygieneScore?: number;
  };
  pass: boolean;
}

export interface NoveltyResult {
  candidateId: UUID;
  structuralDelta: number;
  sizePenalty: number;
  behavioralDistance: number;
  pass: boolean;
}