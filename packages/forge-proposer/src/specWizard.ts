/** TODO: implement interactive Q&A or programmatic prompt to resolve ontology */
export interface TaskSpec {
  ioSchemas: { input: any; output: any }; // JSON Schemas
  tools: Array<{ id: string; sideEffect: 'none'|'idempotent'|'non-idempotent' }>;
  slas: { latencyMs: number };
  safety: { allowEgress: boolean; pii: boolean };
}
export async function runSpecWizard(initial?: Partial<TaskSpec>): Promise<TaskSpec> {
  // TODO: ask targeted questions if fields missing; exit non-zero if contradictions
  return {
    ioSchemas: { input: {}, output: {} },
    tools: [],
    slas: { latencyMs: 2000 },
    safety: { allowEgress: false, pii: false }
  };
}