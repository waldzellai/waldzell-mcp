import type { GraphSpec } from '../../forge-core/src/types.js';

/**
 * Detect cycles in a directed graph using DFS
 */
export function hasCycle(g: GraphSpec): boolean {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Build adjacency list
  for (const node of g.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of g.edges) {
    adjacency.get(edge.from)?.push(edge.to);
  }

  // DFS helper
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        // Back edge found - cycle detected
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check each component
  for (const node of g.nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}