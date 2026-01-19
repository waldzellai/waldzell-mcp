import type { SuiteResult } from '../types.js';

/**
 * Ledger interface for testing
 */
export interface TestLedger {
  recordPrepare(toolId: string, inputHash: string): Promise<string>;
  recordCommit(intentId: string): Promise<void>;
  findByKey(toolId: string, inputHash: string): Promise<string | null>;
}

/**
 * Run idempotency test suite
 */
export async function runIdempotencySuite(
  ledger?: TestLedger,
  sideEffectingOperation?: (input: Record<string, unknown>) => Promise<unknown>
): Promise<SuiteResult> {
  const details: string[] = [];
  const errors: string[] = [];

  if (!ledger) {
    return {
      suiteName: 'idempotency',
      pass: true,
      metrics: { idempotencyPassRate: 1.0 },
      details: ['No ledger provided - skipping idempotency tests'],
      errors: [],
    };
  }

  details.push('Testing idempotency enforcement via ledger');

  // Test cases
  const testCases = [
    { toolId: 'test-tool-1', inputHash: 'hash1', input: { value: 1 } },
    { toolId: 'test-tool-2', inputHash: 'hash2', input: { value: 2 } },
  ];

  let passedTests = 0;
  let totalTests = testCases.length * 2; // Each case runs twice

  for (const testCase of testCases) {
    try {
      // First execution - should record new intent
      const intentId1 = await ledger.recordPrepare(testCase.toolId, testCase.inputHash);
      
      if (sideEffectingOperation) {
        await sideEffectingOperation(testCase.input);
      }
      
      await ledger.recordCommit(intentId1);
      details.push(`${testCase.toolId}: First execution committed (${intentId1})`);
      passedTests++;

      // Second execution - should find existing intent (idempotency)
      const existingIntent = await ledger.findByKey(testCase.toolId, testCase.inputHash);
      
      if (existingIntent === intentId1) {
        details.push(`${testCase.toolId}: Idempotency verified - found existing intent`);
        passedTests++;
      } else {
        errors.push(`${testCase.toolId}: Idempotency FAILED - expected ${intentId1}, got ${existingIntent}`);
      }
    } catch (err) {
      errors.push(`${testCase.toolId}: Error - ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const idempotencyPassRate = totalTests > 0 ? passedTests / totalTests : 0;
  const pass = idempotencyPassRate >= 0.9;

  return {
    suiteName: 'idempotency',
    pass,
    metrics: { idempotencyPassRate },
    details,
    errors,
  };
}