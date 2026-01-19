import { GraphSpec } from '../types.js';

/**
 * Calculate size penalty based on graph complexity.
 * Higher penalty for larger/more complex graphs.
 * Normalized to [0, 1] range.
 */
export function sizePenalty(g: GraphSpec): number {
  const nodeCount = g.nodes.length;
  const edgeCount = g.edges.length;
  
  // Complexity score: weighted sum of nodes and edges
  // Edges have lower weight as they're expected to connect nodes
  const complexity = nodeCount + (edgeCount * 0.5);
  
  // Normalize: assume reasonable graphs have 5-20 nodes
  // Penalize graphs with >30 nodes significantly
  const normalized = Math.min(1, complexity / 30);
  
  return normalized;
}