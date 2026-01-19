/**
 * forge propose command
 *
 * Generate N candidate agents from a specification
 */

import chalk from 'chalk';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config.js';

// Type-only imports
type TaskSpec = any; // From forge-proposer

// Dynamic import (any cast to avoid build-time resolution)
async function getProposer(): Promise<any> {
  return await import('forge-proposer' as any);
}

export interface ProposeOptions {
  num: string;
  spec?: string;
}

/**
 * Generate candidate proposals
 */
export async function generateProposals(options: ProposeOptions): Promise<void> {
  const config = loadConfig();
  const numCandidates = parseInt(options.num, 10);

  if (isNaN(numCandidates) || numCandidates <= 0) {
    throw new Error('Number of candidates must be a positive integer');
  }

  console.log(chalk.cyan(`\n  Generating ${numCandidates} candidates for: ${config.project}\n`));

  // Load specification
  const specPath = options.spec || 'spec.json';
  if (!existsSync(specPath)) {
    throw new Error(
      `Specification file not found: ${specPath}\n` +
      `Run 'forge spec "your description"' to create one.`
    );
  }

  const specContent = readFileSync(specPath, 'utf-8');
  const spec: TaskSpec = JSON.parse(specContent);

  console.log(chalk.gray(`  Loaded spec: ${spec.name}`));
  console.log(chalk.gray(`  Planner model: ${config.models.planner.provider}/${config.models.planner.name}\n`));

  // Create output directory
  const proposalsDir = join(process.cwd(), 'proposals');
  if (!existsSync(proposalsDir)) {
    mkdirSync(proposalsDir, { recursive: true });
  }

  const { generateCandidate, createProvider } = await getProposer();

  // Create provider
  const provider = createProvider({
    provider: config.models.planner.provider,
    apiKey: process.env[`${config.models.planner.provider.toUpperCase()}_API_KEY`],
  });

  // Generate candidates
  const results: string[] = [];

  for (let i = 0; i < numCandidates; i++) {
    const candidateNum = i + 1;
    console.log(chalk.cyan(`  [${candidateNum}/${numCandidates}] Generating candidate...`));

    try {
      const seed = Date.now() + i; // Simple seed generation
      const outputDir = join(proposalsDir, `candidate-${seed}`);

      const result = await generateCandidate(spec, outputDir, {
        provider,
        model: config.models.planner.name,
        temperature: config.models.planner.temperature,
        seed,
        manifestOptions: {
          seed,
          plannerModel: {
            provider: config.models.planner.provider,
            name: config.models.planner.name,
            temperature: config.models.planner.temperature,
          },
          coderModel: {
            provider: config.models.coder.provider,
            name: config.models.coder.name,
            temperature: config.models.coder.temperature,
          },
          graderModel: {
            provider: config.models.grader.provider,
            name: config.models.grader.name,
            temperature: config.models.grader.temperature,
          },
          attackerModel: {
            provider: config.models.attacker.provider,
            name: config.models.attacker.name,
            temperature: config.models.attacker.temperature,
          },
        },
      });

      results.push(result.candidateId);
      console.log(chalk.green(`    ✓ Candidate ${candidateNum}: ${result.candidateId.slice(0, 12)}...`));
      console.log(chalk.gray(`      Location: ${result.outDir}`));
    } catch (error) {
      console.log(chalk.red(`    ✗ Candidate ${candidateNum} failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  // Summary
  console.log(chalk.cyan(`\n  Summary:\n`));
  console.log(chalk.white(`    Generated: ${results.length}/${numCandidates} candidates`));
  console.log(chalk.gray(`    Location: ${proposalsDir}/\n`));
  console.log(chalk.gray(`  Next step: forge eval\n`));
}
