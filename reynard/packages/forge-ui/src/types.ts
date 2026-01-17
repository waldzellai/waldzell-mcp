/**
 * UI-specific types for Forge UI
 * 
 * These types are derived from or compatible with core forge types
 * but optimized for display and interaction
 */

export interface Run {
  id: string;
  candidateId: string;
  timestamp: string;
  status: 'running' | 'complete' | 'failed';
  metrics: RunMetrics;
  duration?: number;
}

export interface RunMetrics {
  functional?: {
    accuracy: number;
    errorRate: number;
    testsPassed: number;
    testsFailed: number;
  };
  chaos?: {
    latencyP95: number;
    chaosDivergence: number;
    retryHygieneScore: number;
  };
  idempotency?: {
    idempotencyViolations: number;
    correctReplays: number;
  };
  overall?: {
    score: number;
    passed: boolean;
  };
}

export interface Candidate {
  id: string;
  version: string;
  createdAt: string;
  parentId?: string;
  manifest: CandidateManifest;
  metrics?: RunMetrics;
  redteamFindings?: Finding[];
}

export interface CandidateManifest {
  id: string;
  modelPins: {
    planner: ModelPin;
    coder: ModelPin;
    grader: ModelPin;
    attacker: ModelPin;
  };
  budgets: {
    maxNodes: number;
    maxLOC: number;
    maxToolKinds: number;
  };
  notes?: string;
}

export interface ModelPin {
  provider: string;
  name: string;
  temperature: number;
}

export interface TraceNode {
  nodeId: string;
  kind: 'tool' | 'llm' | 'router' | 'critic';
  timestamp: string;
  durationMs: number;
  input: any;
  output: any;
  error?: string;
}

export interface Trace {
  runId: string;
  candidateId: string;
  nodes: TraceNode[];
  totalDurationMs: number;
}

export interface Finding {
  id: string;
  category: 'prompt-injection' | 'tool-misuse' | 'egress-escalation' | 'pii-extraction';
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: number;
  description: string;
  scenario: string;
  evidence: string[];
}

export interface ComparisonData {
  candidates: [Candidate, Candidate];
  metricsDiff: {
    field: string;
    value1: number;
    value2: number;
    diff: number;
  }[];
  findingsDiff: {
    onlyIn1: Finding[];
    onlyIn2: Finding[];
    common: Finding[];
  };
}
