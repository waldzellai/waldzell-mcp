import { TaskSpec } from './specWizard.js';
import type { GraphSpec } from '../../forge-core/src/types.js';

/** TODO: call model (planner) with pinned prompt to emit graph plan */
export async function planGraph(spec: TaskSpec): Promise<GraphSpec> {
  return { id: cryptoRandom(), version: '0.1.0', nodes: [], edges: [], contracts: [] };
}
function cryptoRandom() { return Math.random().toString(36).slice(2); } // TODO: replace with uuid