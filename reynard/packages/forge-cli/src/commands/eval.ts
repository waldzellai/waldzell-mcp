/**
 * forge eval command
 *
 * Run evaluation suites on candidates
 */

import chalk from 'chalk';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config.js';

// Type-only imports
type EvalConfig = any; // From forge-eval

// Dynamic import (any cast to avoid build-time resolution)
async function getEval(): Promise<any> {
  return await import('forge-eval' as any);
}

export interface EvalOptions {
  project: string;
  smoke: boolean;
  candidate?: string;
}

/**
 * Run evaluation on candidates
 */
export async function runEval(options: EvalOptions): Promise<void> {
  const config = loadConfig();

  console.log(chalk.cyan(`\n  Running evaluation for: ${options.project}\n`));
  console.log(chalk.gray(`  Mode: ${options.smoke ? 'smoke (quick)' : 'full'}\n`));

  // Find candidates
  const proposalsDir = join(process.cwd(), 'proposals');
  if (!existsSync(proposalsDir)) {
    throw new Error(
      `No proposals directory found. Run 'forge propose' first.`
    );
  }

  let candidateDirs: string[];
  if (options.candidate) {
    candidateDirs = [join(proposalsDir, options.candidate)];
  } else {
    candidateDirs = readdirSync(proposalsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name.startsWith('candidate-'))
      .map(d => join(proposalsDir, d.name));
  }

  if (candidateDirs.length === 0) {
    throw new Error('No candidates found to evaluate');
  }

  console.log(chalk.gray(`  Found ${candidateDirs.length} candidates to evaluate\n`));

  // Create results directory
  const resultsDir = join(process.cwd(), 'results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Evaluation config
  const evalConfig: EvalConfig = {
    smokeMode: options.smoke,
    goldensPath: join(process.cwd(), 'datasets', `${options.project}-goldens.jsonl`),
    chaosConfig: {
      errorRate: 0.1,
      timeoutRate: 0.05,
      jitterMs: 50,
    },
  };

  // Run evaluation on each candidate
  for (const candidateDir of candidateDirs) {
    const candidateId = candidateDir.split('/').pop() || 'unknown';

    console.log(chalk.cyan(`  [${candidateId.slice(0, 20)}...] Running suites...`));

    try {
      const { runAllSuites, writeMetrics } = await getEval();

      // Mock executor function (in production, this would use forge-exec)
      const executor = async (input: any) => {
        // This would actually execute the candidate's graph
        return { output: 'mock-output', success: true };
      };

      // Mock ledger for idempotency tests
      const mockLedger = {
        recordPrepare: async () => 'intent-id',
        recordCommit: async () => {},
        findByKey: async () => undefined,
      };

      // Run all suites
      const aggregatedMetrics = await runAllSuites(executor, evalConfig, mockLedger as any);

      // Write results
      const resultsPath = join(resultsDir, `${candidateId}-metrics.json`);
      await writeMetrics(aggregatedMetrics, resultsPath);

      // Display summary
      console.log(chalk.green(`    ✓ Evaluation complete`));
      console.log(chalk.gray(`      Overall Score: ${(aggregatedMetrics.overall?.score ?? 0).toFixed(2)}`));
      console.log(chalk.gray(`      Results: ${resultsPath}`));
    } catch (error) {
      console.log(chalk.red(`    ✗ Evaluation failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  console.log(chalk.cyan(`\n  Evaluation complete!\n`));
  console.log(chalk.gray(`  Results: ${resultsDir}/\n`));
  console.log(chalk.gray(`  Next step: forge redteam\n`));
}
