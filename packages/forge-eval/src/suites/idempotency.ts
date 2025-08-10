/** TODO: run same side-effecting flow multiple times; verify ledger enforces idempotency/compensation */
export async function runIdempotencySuite(): Promise<{ idempotencyPassRate: number }> {
  return { idempotencyPassRate: 1 };
}