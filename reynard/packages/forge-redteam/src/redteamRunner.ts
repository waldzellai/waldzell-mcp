import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { AttackScenario, Finding, RedTeamReport, RedTeamConfig, Severity } from './types.js';
import { getEnabledScenarios, BUILT_IN_SCENARIOS } from './scenarios.js';
import {
  detectPromptInjection,
  detectToolMisuse,
  detectEgressEscalation,
  detectPIIExtraction,
} from './detectors.js';

/**
 * Executor interface for running attacks
 */
export interface RedTeamExecutor {
  execute(input: Record<string, unknown>): Promise<{
    output: string;
    error?: string;
    trace?: any;
  }>;
}

/**
 * Run red team suite against a candidate
 */
export async function runRedTeamSuite(
  candidateId: string,
  executor?: RedTeamExecutor,
  config?: RedTeamConfig
): Promise<RedTeamReport> {
  const timestamp = new Date().toISOString();
  const scenarios = config?.scenarios ?? BUILT_IN_SCENARIOS;
  const enabled = getEnabledScenarios(scenarios);
  const findings: Finding[] = [];

  console.log(`Running ${enabled.length} red team scenarios against candidate ${candidateId}`);

  // Execute each attack scenario
  for (const scenario of enabled) {
    try {
      if (!executor) {
        // No executor - simulate with warning
        console.warn(`No executor provided - skipping scenario ${scenario.id}`);
        continue;
      }

      // Execute the attack
      const result = await executor.execute(scenario.input);

      // Run detectors based on category
      let finding: Finding | null = null;

      switch (scenario.category) {
        case 'prompt-injection':
          finding = detectPromptInjection(scenario, result.output);
          break;

        case 'tool-misuse':
          finding = detectToolMisuse(scenario, result.trace);
          break;

        case 'egress-escalation':
          finding = detectEgressEscalation(scenario, result.error);
          break;

        case 'pii-extraction':
          finding = detectPIIExtraction(scenario, result.output);
          break;
      }

      if (finding) {
        findings.push(finding);
        console.log(`⚠️  Finding: ${finding.title} (${finding.severity})`);
      } else {
        console.log(`✅ Passed: ${scenario.name}`);
      }
    } catch (err) {
      console.error(`Error executing scenario ${scenario.id}:`, err);
      // Error executing scenario - this itself might be a finding
      findings.push({
        scenarioId: scenario.id,
        category: scenario.category,
        severity: 'low',
        likelihood: 0.3,
        title: 'Scenario Execution Error',
        description: `Failed to execute scenario: ${err instanceof Error ? err.message : String(err)}`,
        reproSteps: ['Scenario failed to execute - investigate'],
      });
    }
  }

  // Count findings by severity
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;
  const lowCount = findings.filter(f => f.severity === 'low').length;

  // Determine pass/fail
  const failOnSeverity = config?.failOnSeverity ?? 'high';
  const pass = !shouldFail(findings, failOnSeverity);

  // Generate summary
  const summary = generateSummary(enabled.length, findings, criticalCount, highCount, mediumCount, lowCount);

  const report: RedTeamReport = {
    candidateId,
    timestamp,
    scenariosRun: enabled.length,
    findings,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    pass,
    summary,
  };

  return report;
}

/**
 * Determine if candidate should fail based on findings
 */
function shouldFail(findings: Finding[], failOnSeverity: Severity): boolean {
  const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
  const threshold = severityOrder[failOnSeverity];

  return findings.some(f => severityOrder[f.severity] >= threshold);
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  totalScenarios: number,
  findings: Finding[],
  critical: number,
  high: number,
  medium: number,
  low: number
): string {
  const lines: string[] = [];

  lines.push(`Red Team Assessment: ${totalScenarios} scenarios executed`);

  if (findings.length === 0) {
    lines.push('✅ No security findings detected');
  } else {
    lines.push(`⚠️  ${findings.length} security findings:`);
    if (critical > 0) lines.push(`   - ${critical} CRITICAL`);
    if (high > 0) lines.push(`   - ${high} HIGH`);
    if (medium > 0) lines.push(`   - ${medium} MEDIUM`);
    if (low > 0) lines.push(`   - ${low} LOW`);
  }

  return lines.join('\n');
}

/**
 * Write red team report to file
 */
export async function writeRedTeamReport(path: string, report: RedTeamReport): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(report, null, 2), 'utf-8');
}

/**
 * Format report for CLI display
 */
export function formatReport(report: RedTeamReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(70));
  lines.push('RED TEAM REPORT');
  lines.push('='.repeat(70));
  lines.push('');
  lines.push(`Candidate: ${report.candidateId}`);
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push(`Scenarios: ${report.scenariosRun}`);
  lines.push(`Status: ${report.pass ? '✅ PASS' : '❌ FAIL'}`);
  lines.push('');
  lines.push(report.summary);
  lines.push('');

  if (report.findings.length > 0) {
    lines.push('FINDINGS:');
    lines.push('-'.repeat(70));

    for (const finding of report.findings) {
      lines.push('');
      lines.push(`[${finding.severity.toUpperCase()}] ${finding.title}`);
      lines.push(`Category: ${finding.category}`);
      lines.push(`Likelihood: ${(finding.likelihood * 100).toFixed(0)}%`);
      lines.push(`Description: ${finding.description}`);

      if (finding.reproSteps.length > 0) {
        lines.push('Reproduction:');
        for (const step of finding.reproSteps) {
          lines.push(`  ${step}`);
        }
      }

      if (finding.mitigation) {
        lines.push(`Mitigation: ${finding.mitigation}`);
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(70));

  return lines.join('\n');
}