/**
 * forge spec command
 *
 * Generate a TaskSpec from natural language description
 */

import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { loadConfig } from '../config.js';

// Type-only imports to avoid build issues
type TaskSpec = any; // From forge-proposer
type RunSpecWizard = (spec?: Partial<TaskSpec>) => Promise<TaskSpec>;

// Dynamic import for runtime (any cast to avoid build-time resolution)
async function getProposer(): Promise<any> {
  return await import('forge-proposer' as any);
}

export interface SpecOptions {
  output: string;
}

/**
 * Generate specification from description
 */
export async function generateSpec(description: string, options: SpecOptions): Promise<void> {
  const config = loadConfig();

  console.log(chalk.cyan(`\n  Generating specification: ${config.project}\n`));
  console.log(chalk.gray(`  Description: ${description}`));
  console.log(chalk.gray(`  Model: ${config.models.planner.provider}/${config.models.planner.name}\n`));

  try {
    const { runSpecWizard } = await getProposer();

    // Create partial spec from description
    const partialSpec: Partial<TaskSpec> = {
      name: config.project,
      description,
      budgets: config.budgets,
      safety: {
        allowEgress: config.sandbox.networkEgress === 'allowlist',
        pii: false,
      },
    };

    // Run SpecWizard to complete and validate
    const spec = await runSpecWizard(partialSpec);

    // Write to file
    writeFileSync(options.output, JSON.stringify(spec, null, 2), 'utf-8');

    console.log(chalk.green(`\n  ✓ Specification written to: ${options.output}\n`));
    console.log(chalk.gray(`  Next step: forge propose --num 5\n`));
  } catch (error) {
    throw new Error(
      `Failed to generate specification: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
