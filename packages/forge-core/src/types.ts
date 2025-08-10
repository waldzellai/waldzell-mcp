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

export interface NodeSpec { id: string; kind: 'tool'|'llm'|'router'|'critic'; /* TODO: define detail */ }
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