import { GraphSpec } from '../types.js';

/** TODO: count LOC by scanning archive folder; stub with nodes+edge counts. */
export function sizePenalty(g: GraphSpec): number {
  const n = g.nodes.length;
  const e = g.edges.length;
  const normalized = Math.min(1, (n + e) / 50); // TODO: calibrate
  return normalized;
}