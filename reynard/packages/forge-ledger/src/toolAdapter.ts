export interface ToolContext { ledger: Ledger; dryRun: boolean; }

export interface ToolAdapter<I,O> {
  id: string;
  version: string;
  prepare(input: I, ctx: ToolContext): Promise<{ intentId: string }>;
  commit(intentId: string, ctx: ToolContext): Promise<O>;
  compensate(intentId: string, ctx: ToolContext): Promise<void>;
}
export interface Ledger {
  recordPrepare(toolId: string, inputHash: string): Promise<string>; // returns intentId
  recordCommit(intentId: string): Promise<void>;
  recordCompensate(intentId: string): Promise<void>;
  findByKey(toolId: string, inputHash: string): Promise<string | null>;
}