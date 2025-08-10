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
  // TODO: nearest neighbor search over archive by behavioral distance
  const sd = structuralDelta(graph, archive[0]?.graph);
  const sp = sizePenalty(graph);
  const bd = behavioralDistance(traces, archive[0]?.traces ?? []);
  const pass = bd >= thresholds.behavioralDistanceMin &&
               sd >= thresholds.structuralDeltaMin &&
               sp <= thresholds.sizePenaltyMax;
  return { candidateId: graph.id, structuralDelta: sd, sizePenalty: sp, behavioralDistance: bd, pass };
}