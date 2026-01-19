/**
 * Task specification for candidate generation
 */
export interface TaskSpec {
  name: string;
  description: string;
  ioSchemas: { input: any; output: any }; // JSON Schemas
  tools: Array<{ id: string; sideEffect: 'none'|'idempotent'|'non-idempotent' }>;
  slas: { latencyMs: number };
  safety: { allowEgress: boolean; pii: boolean };
  budgets?: {
    maxNodes?: number;
    maxLOC?: number;
    maxToolKinds?: number;
  };
}

/**
 * Validation error for task specs
 */
export class TaskSpecValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'TaskSpecValidationError';
  }
}

/**
 * Validate a task specification
 */
function validateTaskSpec(spec: Partial<TaskSpec>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required fields
  if (!spec.name || spec.name.trim().length === 0) {
    errors.push('Task name is required');
  }

  if (!spec.description || spec.description.trim().length === 0) {
    errors.push('Task description is required');
  }

  // Check for contradictions
  if (spec.safety?.pii && !spec.safety.allowEgress) {
    errors.push('Contradiction: PII handling typically requires egress (for logging/monitoring)');
  }

  if (spec.tools && spec.tools.some(t => t.sideEffect === 'non-idempotent') && !spec.tools.some(t => t.id === 'ledger')) {
    console.warn('Warning: Non-idempotent tools without ledger may cause issues');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Apply defaults to incomplete task spec
 */
function applyDefaults(spec: Partial<TaskSpec>): TaskSpec {
  return {
    name: spec.name || 'unnamed-task',
    description: spec.description || 'No description provided',
    ioSchemas: spec.ioSchemas || { input: {}, output: {} },
    tools: spec.tools || [],
    slas: spec.slas || { latencyMs: 2000 },
    safety: {
      allowEgress: spec.safety?.allowEgress ?? false,
      pii: spec.safety?.pii ?? false,
    },
    budgets: {
      maxNodes: spec.budgets?.maxNodes ?? 20,
      maxLOC: spec.budgets?.maxLOC ?? 1000,
      maxToolKinds: spec.budgets?.maxToolKinds ?? 5,
    },
  };
}

/**
 * Run spec wizard to complete and validate task specification
 * 
 * @param initial - Partial spec to start with
 * @returns Complete, validated TaskSpec
 * @throws TaskSpecValidationError if validation fails
 */
export async function runSpecWizard(initial?: Partial<TaskSpec>): Promise<TaskSpec> {
  const spec = initial || {};

  // Apply defaults
  const completed = applyDefaults(spec);

  // Validate
  const validation = validateTaskSpec(completed);

  if (!validation.valid) {
    const errorMessage = `TaskSpec validation failed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`;
    throw new TaskSpecValidationError(errorMessage);
  }

  // Log completion
  console.log(`✓ TaskSpec validated: ${completed.name}`);
  console.log(`  Description: ${completed.description}`);
  console.log(`  Tools: ${completed.tools.length}`);
  console.log(`  SLA: ${completed.slas.latencyMs}ms`);

  return completed;
}