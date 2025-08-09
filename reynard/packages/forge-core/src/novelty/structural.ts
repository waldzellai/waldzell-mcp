import { GraphSpec } from '../types.js';

/** TODO: implement proper graph edit distance. For now, crude normalized diff. */
export function structuralDelta(a: GraphSpec, b?: GraphSpec): number {
  if (!b) return 1;
  const nodeDelta = jaccard(a.nodes.map(n=>n.id), b.nodes.map(n=>n.id));
  const edgeDelta = jaccard(a.edges.map(e=>`${e.from}->${e.to}`), b.edges.map(e=>`${e.from}->${e.to}`));
  return (nodeDelta + edgeDelta) / 2;
}

function jaccard(a: string[], b: string[]): number {
  const A = new Set(a); const B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return 1 - (inter / (union || 1));
}