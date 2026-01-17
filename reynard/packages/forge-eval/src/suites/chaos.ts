import type { ChaosConfig, SuiteResult } from '../types.js';

/**
 * Chaos injector that wraps operations with failures
 */
export class ChaosInjector {
  constructor(private config: ChaosConfig) {}

  /**
   * Inject chaos into an operation
   */
  async inject<T>(operation: () => Promise<T>): Promise<{ result?: T; injected: boolean; error?: string; latency: number }> {
    const startTime = Date.now();
    const injected = Math.random() < (this.config.errorRate ?? 0.1);

    // Inject jitter
    if (this.config.jitterMs) {
      await new Promise(resolve => setTimeout(resolve, Math.random() * this.config.jitterMs!));
    }

    // Inject timeout or error
    if (injected) {
      const latency = Date.now() - startTime;
      const errorTypes = ['timeout', '429', '500'];
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      return {
        injected: true,
        error: `Chaos injected: ${errorType}`,
        latency,
      };
    }

    // Execute normal operation
    try {
      const result = await operation();
      const latency = Date.now() - startTime;
      return { result, injected: false, latency };
    } catch (err) {
      const latency = Date.now() - startTime;
      return {
        injected: false,
        error: err instanceof Error ? err.message : String(err),
        latency,
      };
    }
  }
}

/**
 * Run chaos test suite
 */
export async function runChaosSuite(
  config?: ChaosConfig,
  executor?: (input: Record<string, unknown>) => Promise<unknown>
): Promise<SuiteResult> {
  const details: string[] = [];
  const errors: string[] = [];
  const latencies: number[] = [];

  const chaosConfig = config ?? { errorRate: 0.2, jitterMs: 100 };
  const injector = new ChaosInjector(chaosConfig);

  details.push(`Chaos config: errorRate=${chaosConfig.errorRate}, jitter=${chaosConfig.jitterMs}ms`);

  // Run test cases with chaos injection
  const testCases = [
    { id: 'chaos-1', input: { test: 1 } },
    { id: 'chaos-2', input: { test: 2 } },
    { id: 'chaos-3', input: { test: 3 } },
  ];

  let successfulRuns = 0;
  let retriesObserved = 0;

  for (const testCase of testCases) {
    const results = await injector.inject(async () => {
      if (!executor) {
        return { simulated: true };
      }
      return await executor(testCase.input);
    });

    latencies.push(results.latency);

    if (results.error) {
      details.push(`${testCase.id}: Failed with ${results.error} (${results.latency}ms)`);
      if (results.injected) {
        // This would trigger retries in a real system
        retriesObserved++;
      }
    } else {
      successfulRuns++;
      details.push(`${testCase.id}: Success (${results.latency}ms)`);
    }
  }

  // Calculate metrics
  latencies.sort((a, b) => a - b);
  const latencyP95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const chaosDivergence = 1 - (successfulRuns / testCases.length); // Higher = more divergence
  const retryHygieneScore = retriesObserved > 0 ? 1.0 : 0.8; // Simplified

  const pass = latencyP95 < 5000 && chaosDivergence < 0.5;

  return {
    suiteName: 'chaos',
    pass,
    metrics: { latencyP95, chaosDivergence, retryHygieneScore },
    details,
    errors,
  };
}