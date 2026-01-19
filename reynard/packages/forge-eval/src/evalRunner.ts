import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { runFunctionalSuite } from './suites/functional.js';
import { runChaosSuite } from './suites/chaos.js';
import { runIdempotencySuite, type TestLedger } from './suites/idempotency.js';
import type { EvalConfig, AggregatedMetrics, ChaosConfig } from './types.js';

export interface RunAllSuitesOptions {
  config?: EvalConfig;
  executor?: (input: Record<string, unknown>) => Promise<{ output: unknown; error?: string }>;
  ledger?: TestLedger;
  chaosConfig?: ChaosConfig;
  outputPath?: string; // Path to write eval.json
}

/**
 * Run all evaluation suites and aggregate results
 */
export async function runAllSuites(options?: RunAllSuitesOptions): Promise<AggregatedMetrics> {
  const functional = await runFunctionalSuite(options?.config, options?.executor);
  const chaos = await runChaosSuite(options?.chaosConfig, 
    options?.executor ? async (input) => (await options.executor!(input)).output : undefined
  );
  const idempotency = await runIdempotencySuite(options?.ledger);

  const metrics: AggregatedMetrics = {
    accuracy: functional.metrics.accuracy,
    errorRate: functional.metrics.errorRate,
    latencyP95: chaos.metrics.latencyP95,
    chaosDivergence: chaos.metrics.chaosDivergence,
    retryHygieneScore: chaos.metrics.retryHygieneScore,
    idempotencyPassRate: idempotency.metrics.idempotencyPassRate,
    suites: [functional, chaos, idempotency],
    overallPass: functional.pass && chaos.pass && idempotency.pass,
  };

  // Write output if path provided
  if (options?.outputPath) {
    await writeMetrics(options.outputPath, metrics);
  }

  return metrics;
}

/**
 * Write metrics to JSON file
 */
async function writeMetrics(path: string, metrics: AggregatedMetrics): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(metrics, null, 2), 'utf-8');
}

/**
 * Format metrics for CLI display
 */
export function formatMetrics(metrics: AggregatedMetrics): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('EVALUATION RESULTS');
  lines.push('='.repeat(60));
  lines.push('');
  
  for (const suite of metrics.suites) {
    const status = suite.pass ? '✅ PASS' : '❌ FAIL';
    lines.push(`${status} ${suite.suiteName.toUpperCase()}`);
    lines.push('-'.repeat(60));
    
    for (const [key, value] of Object.entries(suite.metrics)) {
      lines.push(`  ${key}: ${typeof value === 'number' ? value.toFixed(3) : value}`);
    }
    
    if (suite.errors.length > 0) {
      lines.push('  Errors:');
      for (const error of suite.errors) {
        lines.push(`    - ${error}`);
      }
    }
    
    lines.push('');
  }
  
  lines.push('='.repeat(60));
  lines.push(`OVERALL: ${metrics.overallPass ? '✅ PASS' : '❌ FAIL'}`);
  lines.push('='.repeat(60));
  
  return lines.join('\n');
}