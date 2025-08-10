import type { GraphSpec } from '../../forge-core/src/types.js';
type RunCtx = { maxSteps: number; stepCount: number; cancelled: boolean };

export async function runGraph(g: GraphSpec, input: any, ctx: RunCtx) {
  // TODO: enforce step budget, backpressure tokens, cancellation propagation
  if (ctx.cancelled) throw new Error('Cancelled');
  ctx.stepCount++;
  // TODO: execute nodes; collect BehaviorTrace
  return { output: input, trace: { steps: [] } };
}