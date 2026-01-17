import type { CandidateManifest, GraphSpec, ModelPin } from '../../forge-core/src/types.js';
import { generateUUID } from '../../forge-core/src/utils.js';
import type { TaskSpec } from './specWizard.js';

export interface ManifestOptions {
  parentId?: string;
  seed?: number;
  plannerModel?: ModelPin;
  coderModel?: ModelPin;
  graderModel?: ModelPin;
  attackerModel?: ModelPin;
  notes?: string;
}

/**
 * Generate a candidate manifest from graph and spec
 */
export function generateManifest(
  graph: GraphSpec,
  spec: TaskSpec,
  options?: ManifestOptions
): CandidateManifest {
  const defaultModel: ModelPin = {
    provider: 'openai',
    name: 'gpt-4',
    temperature: 0.7,
  };

  const manifest: CandidateManifest = {
    id: graph.id,
    parentId: options?.parentId,
    createdAt: new Date().toISOString(),
    modelPins: {
      planner: options?.plannerModel || defaultModel,
      coder: options?.coderModel || defaultModel,
      grader: { ...defaultModel, temperature: 0.2 },
      attacker: { ...defaultModel, temperature: 0.8 },
    },
    tools: spec.tools.map(t => ({
      id: t.id,
      version: '1.0.0',
      allowNetwork: spec.safety.allowEgress,
      allowFilesystem: true,
      sideEffect: t.sideEffect,
      egressAllowlist: spec.safety.allowEgress ? ['*'] : [],
    })),
    sandbox: {
      driver: 'docker',
      cpuMsLimit: spec.slas.latencyMs,
      memMB: 512,
      fsReadonly: true,
      writableMounts: ['/tmp/working', '/ledger'],
      networkEgress: spec.safety.allowEgress ? 'allowlist' : 'blocked',
      egressAllowlist: spec.safety.allowEgress ? ['*'] : [],
      envAllowlist: ['NODE_ENV', 'LOG_LEVEL'],
    },
    seeds: {
      planner: options?.seed ?? Math.floor(Math.random() * 1000000),
      coder: options?.seed ? options.seed + 1 : Math.floor(Math.random() * 1000000),
    },
    containers: {
      main: 'node:20-slim',
    },
    datasets: [],
    budgets: {
      maxNodes: spec.budgets?.maxNodes ?? 20,
      maxLOC: spec.budgets?.maxLOC ?? 1000,
      maxToolKinds: spec.budgets?.maxToolKinds ?? 5,
    },
    notes: options?.notes || `Generated from TaskSpec: ${spec.name}`,
  };

  return manifest;
}
