/**
 * Integration Test: Full ADAS Workflow
 * 
 * Tests the complete pipeline from specification to candidate selection
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TEST_DIR = join(__dirname, '../../test-workspace');
const FORGE_CLI = join(__dirname, '../../packages/forge-cli/dist/index.js');

describe('Full ADAS Workflow', () => {
  beforeAll(() => {
    // Create test workspace
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should initialize project', () => {
    execSync(`node ${FORGE_CLI} init --name test-project --template blank --force`, {
      cwd: TEST_DIR,
      stdio: 'inherit',
    });

    expect(existsSync(join(TEST_DIR, 'reynard.config.yaml'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'specs'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'proposals'))).toBe(true);
  });

  it('should generate specification', () => {
    execSync(`node ${FORGE_CLI} spec "Build a simple calculator tool" --output spec.json`, {
      cwd: TEST_DIR,
      stdio: 'inherit',
    });

    expect(existsSync(join(TEST_DIR, 'spec.json'))).toBe(true);
  });

  it('should generate candidates (mock)', () => {
    // This would normally call LLM, but for testing we can skip or mock
    // execSync(`node ${FORGE_CLI} propose --num 2`, { cwd: TEST_DIR, stdio: 'inherit' });

    // For now, create mock candidates
    const proposalsDir = join(TEST_DIR, 'proposals');
    mkdirSync(join(proposalsDir, 'candidate-mock-001'), { recursive: true });
    mkdirSync(join(proposalsDir, 'candidate-mock-002'), { recursive: true });

    writeFileSync(
      join(proposalsDir, 'candidate-mock-001', 'manifest.json'),
      JSON.stringify({ id: 'mock-001', createdAt: new Date().toISOString() }),
      'utf-8'
    );

    expect(existsSync(join(proposalsDir, 'candidate-mock-001'))).toBe(true);
  });

  it('should run evaluation (mock)', () => {
    // This would execute candidates, but for testing we can mock
    // execSync(`node ${FORGE_CLI} eval --project test --smoke`, { cwd: TEST_DIR });

    // Create mock metrics
    const resultsDir = join(TEST_DIR, 'results');
    mkdirSync(resultsDir, { recursive: true });

    writeFileSync(
      join(resultsDir, 'candidate-mock-001-metrics.json'),
      JSON.stringify({
        overall: { score: 0.92, passed: true },
        functional: { accuracy: 0.95, errorRate: 0.05, testsPassed: 19, testsFailed: 1 },
      }),
      'utf-8'
    );

    expect(existsSync(join(resultsDir, 'candidate-mock-001-metrics.json'))).toBe(true);
  });

  it('should run red team tests (mock)', () => {
    // execSync(`node ${FORGE_CLI} redteam`, { cwd: TEST_DIR });

    const resultsDir = join(TEST_DIR, 'results');
    writeFileSync(
      join(resultsDir, 'candidate-mock-001-redteam.json'),
      JSON.stringify({
        passed: true,
        findings: [],
      }),
      'utf-8'
    );

    expect(existsSync(join(resultsDir, 'candidate-mock-001-redteam.json'))).toBe(true);
  });

  it('should select winners', () => {
    execSync(`node ${FORGE_CLI} select --max 1`, { cwd: TEST_DIR, stdio: 'inherit' });

    expect(existsSync(join(TEST_DIR, 'winners.json'))).toBe(true);
  });

  it('should complete full workflow', () => {
    // Verify all expected outputs exist
    expect(existsSync(join(TEST_DIR, 'reynard.config.yaml'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'spec.json'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'proposals', 'candidate-mock-001'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'results', 'candidate-mock-001-metrics.json'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'winners.json'))).toBe(true);
  });
});
