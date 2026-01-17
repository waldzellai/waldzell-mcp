/**
 * forge select command
 *
 * Select winning candidates using Pareto frontier
 */

import chalk from 'chalk';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config.js';

export interface SelectOptions {
  maxWinners?: number;
}

interface CandidateScore {
  id: string;
  performance: number;
  novelty: number;
  complexity: number;
  dominated: boolean;
}

/**
 * Select winning candidates
 */
export async function selectWinners(options: SelectOptions): Promise<void> {
  const config = loadConfig();
  const maxWinners = options.maxWinners || 3;

  console.log(chalk.cyan(`\n  Selecting winners using Pareto frontier\n`));
  console.log(chalk.gray(`  Max winners: ${maxWinners}\n`));

  // Load all candidate metrics
  const resultsDir = join(process.cwd(), 'results');
  if (!existsSync(resultsDir)) {
    throw new Error('No results directory found. Run evaluation first.');
  }

  const metricFiles = readdirSync(resultsDir)
    .filter(f => f.endsWith('-metrics.json'));

  if (metricFiles.length === 0) {
    throw new Error('No evaluation results found');
  }

  console.log(chalk.gray(`  Found ${metricFiles.length} evaluated candidates\n`));

  // Load and score candidates
  const candidates: CandidateScore[] = [];

  for (const metricFile of metricFiles) {
    const candidateId = metricFile.replace('-metrics.json', '');
    const metricsPath = join(resultsDir, metricFile);
    const metrics = JSON.parse(readFileSync(metricsPath, 'utf-8'));

    // Calculate performance score (from eval metrics)
    const performance = metrics.overall?.score ?? 0;

    // Calculate novelty score (mock - would use scoreNovelty from forge-core)
    const novelty = Math.random() * 0.5 + 0.3; // Mock score

    // Calculate complexity (higher is worse)
    const complexity = 0.5; // Mock - would calculate from manifest

    candidates.push({
      id: candidateId,
      performance,
      novelty,
      complexity,
      dominated: false,
    });
  }

  // Apply Pareto frontier selection
  for (let i = 0; i < candidates.length; i++) {
    for (let j = 0; j < candidates.length; j++) {
      if (i === j) continue;

      const c1 = candidates[i];
      const c2 = candidates[j];

      // c2 dominates c1 if it's better in all objectives
      if (
        c2.performance >= c1.performance &&
        c2.novelty >= c1.novelty &&
        c2.complexity <= c1.complexity &&
        (c2.performance > c1.performance || c2.novelty > c1.novelty || c2.complexity < c1.complexity)
      ) {
        candidates[i].dominated = true;
        break;
      }
    }
  }

  // Get non-dominated candidates (Pareto frontier)
  const paretoFrontier = candidates
    .filter(c => !c.dominated)
    .sort((a, b) => b.performance - a.performance)
    .slice(0, maxWinners);

  // Display results
  console.log(chalk.cyan(`  Pareto Frontier (${paretoFrontier.length} candidates):\n`));

  paretoFrontier.forEach((candidate, idx) => {
    console.log(chalk.white(`    ${idx + 1}. ${candidate.id.slice(0, 24)}...`));
    console.log(chalk.gray(`       Performance: ${candidate.performance.toFixed(3)}`));
    console.log(chalk.gray(`       Novelty:     ${candidate.novelty.toFixed(3)}`));
    console.log(chalk.gray(`       Complexity:  ${candidate.complexity.toFixed(3)}\n`));
  });

  // Write winners to file
  const winnersPath = join(process.cwd(), 'winners.json');
  writeFileSync(
    winnersPath,
    JSON.stringify(
      {
        selected: paretoFrontier.map(c => ({
          id: c.id,
          scores: {
            performance: c.performance,
            novelty: c.novelty,
            complexity: c.complexity,
          },
        })),
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(chalk.green(`\n  ✓ Selected ${paretoFrontier.length} winners\n`));
  console.log(chalk.gray(`  Winners file: ${winnersPath}\n`));
}
