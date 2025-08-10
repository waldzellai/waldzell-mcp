export interface Metrics {
  accuracy: number;
  latencyP95: number;
  errorRate: number;
  chaosDivergence: number;
  idempotencyPassRate: number;
  retryHygieneScore: number;
}