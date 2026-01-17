export interface GoldenTestCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutput: unknown;
  description?: string;
}

export interface EvalConfig {
  project: string;
  datasetPath: string;
  smoke?: boolean; // Run subset for quick testing
  chaosConfig?: ChaosConfig;
}

export interface ChaosConfig {
  timeoutMs?: number;
  jitterMs?: number;
  errorRate?: number; // 0-1, probability of injecting 429/500
  retryLimit?: number;
}

export interface SuiteResult {
  suiteName: string;
  pass: boolean;
  metrics: Record<string, number>;
  details: string[];
  errors: string[];
}

export interface AggregatedMetrics {
  // Functional
  accuracy?: number;
  errorRate?: number;
  
  // Chaos
  latencyP95?: number;
  chaosDivergence?: number;
  retryHygieneScore?: number;
  
  // Idempotency
  idempotencyPassRate?: number;
  
  // Meta
  suites: SuiteResult[];
  overallPass: boolean;
}
