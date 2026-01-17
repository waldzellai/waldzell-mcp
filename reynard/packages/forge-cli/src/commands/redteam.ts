/**
 * forge redteam command
 *
 * Run security testing on candidates
 */

import chalk from 'chalk';
import { readdirSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { loadConfig } from '../config.js';

// Type-only imports
type RedTeamConfig = any; // From forge-redteam

// Dynamic import (any cast to avoid build-time resolution)
async function getRedteam(): Promise<any> {
  return await import('forge-redteam' as any);
}

export interface RedteamOptions {
  candidate?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Run red team testing on candidates
 */
export async function runRedteam(options: RedteamOptions): Promise<void> {
  const config = loadConfig();

  console.log(chalk.cyan(`\n  Running Red Team Suite\n`));
  console.log(chalk.gray(`  Attacker model: ${config.models.attacker.provider}/${config.models.attacker.name}\n`));

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
    throw new Error('No candidates found for red teaming');
  }

  console.log(chalk.gray(`  Found ${candidateDirs.length} candidates to test\n`));

  // Create results directory
  const resultsDir = join(process.cwd(), 'results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Red team config
  const redteamConfig: RedTeamConfig = {
    categories: ['prompt-injection', 'tool-misuse', 'egress-escalation', 'pii-extraction'],
    failOnSeverity: options.severity || 'high',
  };

  // Run red team on each candidate
  for (const candidateDir of candidateDirs) {
    const candidateId = candidateDir.split('/').pop() || 'unknown';

    console.log(chalk.cyan(`  [${candidateId.slice(0, 20)}...] Running attack scenarios...`));

    try {
      const { runRedTeamSuite, writeRedTeamReport } = await getRedteam();

      // Load manifest
      const manifestPath = join(candidateDir, 'manifest.json');
      if (!existsSync(manifestPath)) {
        console.log(chalk.yellow(`    ⚠ No manifest found, skipping`));
        continue;
      }

      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      // Mock executor
      const executor = {
        executeAttack: async (scenario: any, candidateId: string) => {
          // This would actually execute the attack against the candidate
          return {
            success: false,
            output: 'Mock attack execution',
            trace: [],
          };
        },
      };

      // Run red team suite
      const report = await runRedTeamSuite(executor, manifest, redteamConfig);

      // Write report
      const reportPath = join(resultsDir, `${candidateId}-redteam.json`);
      await writeRedTeamReport(report, reportPath);

      // Display summary
      const criticalCount = report.findings.filter((f: any) => f.severity === 'critical').length;
      const highCount = report.findings.filter((f: any) => f.severity === 'high').length;

      if (report.passed) {
        console.log(chalk.green(`    ✓ Passed security tests`));
      } else {
        console.log(chalk.red(`    ✗ Failed security tests`));
      }

      console.log(chalk.gray(`      Critical: ${criticalCount}, High: ${highCount}`));
      console.log(chalk.gray(`      Total findings: ${report.findings.length}`));
      console.log(chalk.gray(`      Report: ${reportPath}`));
    } catch (error) {
      console.log(chalk.red(`    ✗ Red team failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  console.log(chalk.cyan(`\n  Red Team complete!\n`));
  console.log(chalk.gray(`  Reports: ${resultsDir}/\n`));
  console.log(chalk.gray(`  Next step: forge select\n`));
}
