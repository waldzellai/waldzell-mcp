import { BehaviorTrace } from '../types.js';

/**
 * Calculate behavioral distance between two sets of traces.
 * Uses action sequence similarity and timing patterns.
 * Returns normalized distance in [0, 1] where:
 * - 0 = identical behavior
 * - 1 = completely different behavior
 */
export function behavioralDistance(cand: BehaviorTrace[], base: BehaviorTrace[]): number {
  if (base.length === 0) return 1.0;
  if (cand.length === 0) return 1.0;

  // Compare action sequences using shingling
  const candActions = extractActionSequences(cand);
  const baseActions = extractActionSequences(base);
  const actionDist = jaccardDistance(candActions, baseActions);

  // Compare step counts (normalized difference)
  const avgSteps = (traces: BehaviorTrace[]) => 
    traces.reduce((sum, t) => sum + t.steps.length, 0) / traces.length;
  const candAvg = avgSteps(cand);
  const baseAvg = avgSteps(base);
  const stepDist = Math.min(1, Math.abs(candAvg - baseAvg) / Math.max(candAvg, baseAvg, 1));

  // Compare node usage patterns
  const candNodes = extractNodeUsage(cand);
  const baseNodes = extractNodeUsage(base);
  const nodeDist = jaccardDistance(candNodes, baseNodes);

  // Weighted combination
  return (actionDist * 0.5) + (stepDist * 0.2) + (nodeDist * 0.3);
}

function extractActionSequences(traces: BehaviorTrace[]): Set<string> {
  const sequences = new Set<string>();
  for (const trace of traces) {
    // Create 3-grams (shingles) of action sequences
    for (let i = 0; i <= trace.steps.length - 3; i++) {
      const shingle = trace.steps.slice(i, i + 3)
        .map(s => `${s.nodeId}:${s.action}`)
        .join('->');
      sequences.add(shingle);
    }
  }
  return sequences;
}

function extractNodeUsage(traces: BehaviorTrace[]): Set<string> {
  const nodes = new Set<string>();
  for (const trace of traces) {
    for (const step of trace.steps) {
      nodes.add(`${step.nodeId}:${step.action}`);
    }
  }
  return nodes;
}

function jaccardDistance(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return 1 - (intersection.size / union.size);
}