import { BehaviorTrace } from '../types.js';

/** TODO: implement DTW on timings + shingled action sequences; stub returns 0. */
export function behavioralDistance(cand: BehaviorTrace[], base: BehaviorTrace[]): number {
  if (base.length === 0) return 1;
  // Placeholder: difference in step counts averaged
  const avgSteps = (x: BehaviorTrace[]) => x.reduce((s,t)=>s + t.steps.length,0) / (x.length||1);
  const diff = Math.abs(avgSteps(cand) - avgSteps(base));
  return Math.min(1, diff / 10);
}