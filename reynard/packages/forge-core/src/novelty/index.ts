import { GraphSpec, BehaviorTrace, NoveltyResult } from '../types.js';
import { structuralDelta } from './structural.js';
import { sizePenalty } from './sizePenalty.js';
import { behavioralDistance } from './behavioral.js';

export interface NoveltyThresholds {
  behavioralDistanceMin: number;
  structuralDeltaMin: number;
  sizePenaltyMax: number;
}

export function scoreNovelty(
  graph: GraphSpec,
  traces: BehaviorTrace[],
  archive: { graph: GraphSpec; traces: BehaviorTrace[] }[],
  thresholds: NoveltyThresholds
): NoveltyResult {
  // Handle empty archive: first candidate is always novel
  if (archive.length === 0) {
    const sp = sizePenalty(graph);
    return {
      candidateId: graph.id,
      structuralDelta: 1.0,
      sizePenalty: sp,
      behavioralDistance: 1.0,
      pass: sp <= thresholds.sizePenaltyMax
    };
  }

  // Find nearest neighbor by behavioral distance
  let nearestIdx = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < archive.length; i++) {
    const dist = behavioralDistance(traces, archive[i].traces);
    if (dist < minDistance) {
      minDistance = dist;
      nearestIdx = i;
    }
  }

  const nearest = archive[nearestIdx];
  const sd = structuralDelta(graph, nearest.graph);
  const sp = sizePenalty(graph);
  const bd = minDistance;

  const pass = bd >= thresholds.behavioralDistanceMin &&
               sd >= thresholds.structuralDeltaMin &&
               sp <= thresholds.sizePenaltyMax;

  return { candidateId: graph.id, structuralDelta: sd, sizePenalty: sp, behavioralDistance: bd, pass };
}