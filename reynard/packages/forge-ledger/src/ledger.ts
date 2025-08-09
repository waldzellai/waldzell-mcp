import { Ledger } from './toolAdapter.js';

/** TODO: back with sqlite/flatfile; ensure atomicity */
export class FileLedger implements Ledger {
  async recordPrepare(toolId: string, inputHash: string) { return `${toolId}:${inputHash}:${Date.now()}`; }
  async recordCommit(_intentId: string) { /* TODO */ }
  async recordCompensate(_intentId: string) { /* TODO */ }
  async findByKey(_toolId: string, _inputHash: string) { return null; }
}