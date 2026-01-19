/**
 * Reynard Forge Configuration System
 *
 * Handles loading and validation of reynard.config.yaml
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse, stringify } from 'yaml';
import { join } from 'path';

/**
 * Model configuration for a specific role
 */
export interface ModelConfig {
  provider: 'openai' | 'anthropic';
  name: string;
  temperature: number;
}

/**
 * Sandbox configuration for code execution
 */
export interface SandboxConfig {
  driver: 'docker';
  cpuMsLimit: number;
  memMB: number;
  fsReadonly: boolean;
  writableMounts: string[];
  networkEgress: 'allowlist' | 'deny';
  egressAllowlist: string[];
}

/**
 * Budget constraints for proposals
 */
export interface BudgetConfig {
  maxNodes: number;
  maxToolKinds: number;
  maxLOC: number;
}

/**
 * Novelty thresholds for quality-diversity
 */
export interface NoveltyThresholds {
  behavioralDistanceMin: number;
  structuralDeltaMin: number;
  sizePenaltyMax: number;
}

/**
 * Stability configuration
 */
export interface StabilityConfig {
  seedVariants: number;
  maxMetricVariance: number;
}

/**
 * Complete Reynard configuration
 */
export interface ReynardConfig {
  project: string;
  models: {
    planner: ModelConfig;
    coder: ModelConfig;
    grader: ModelConfig;
    attacker: ModelConfig;
  };
  sandbox: SandboxConfig;
  budgets: BudgetConfig;
  noveltyThresholds: NoveltyThresholds;
  stability: StabilityConfig;
}

/**
 * Default configuration values
 */
export function createDefaultConfig(projectName: string): ReynardConfig {
  return {
    project: projectName,
    models: {
      planner: { provider: 'openai', name: 'gpt-4.1', temperature: 0.2 },
      coder: { provider: 'openai', name: 'gpt-4.1', temperature: 0.3 },
      grader: { provider: 'openai', name: 'gpt-4o-mini', temperature: 0.0 },
      attacker: { provider: 'anthropic', name: 'claude-3-haiku', temperature: 0.7 }
    },
    sandbox: {
      driver: 'docker',
      cpuMsLimit: 20000,
      memMB: 2048,
      fsReadonly: true,
      writableMounts: ['/tmp/working', '/ledger'],
      networkEgress: 'allowlist',
      egressAllowlist: ['api.github.com']
    },
    budgets: {
      maxNodes: 18,
      maxToolKinds: 6,
      maxLOC: 2500
    },
    noveltyThresholds: {
      behavioralDistanceMin: 0.18,
      structuralDeltaMin: 0.12,
      sizePenaltyMax: 0.35
    },
    stability: {
      seedVariants: 3,
      maxMetricVariance: 0.05
    }
  };
}

/**
 * Configuration file name
 */
export const CONFIG_FILENAME = 'reynard.config.yaml';

/**
 * Load configuration from file
 */
export function loadConfig(dir: string = process.cwd()): ReynardConfig {
  const configPath = join(dir, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    throw new Error(
      `Configuration file not found: ${configPath}\n` +
      `Run 'forge init' to create a new project configuration.`
    );
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = parse(content) as ReynardConfig;
    return validateConfig(config);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: ReynardConfig, dir: string = process.cwd()): void {
  const configPath = join(dir, CONFIG_FILENAME);
  const content = stringify(config, { indent: 2 });
  writeFileSync(configPath, content, 'utf-8');
}

/**
 * Check if configuration exists
 */
export function configExists(dir: string = process.cwd()): boolean {
  return existsSync(join(dir, CONFIG_FILENAME));
}

/**
 * Validate configuration structure
 */
function validateConfig(config: unknown): ReynardConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }

  const c = config as Record<string, unknown>;

  // Validate required fields
  if (typeof c.project !== 'string' || !c.project) {
    throw new Error('Configuration must have a "project" name');
  }

  if (!c.models || typeof c.models !== 'object') {
    throw new Error('Configuration must have a "models" section');
  }

  // Return with defaults merged for any missing optional fields
  const defaults = createDefaultConfig(c.project);

  return {
    project: c.project,
    models: {
      planner: validateModelConfig(c.models, 'planner', defaults.models.planner),
      coder: validateModelConfig(c.models, 'coder', defaults.models.coder),
      grader: validateModelConfig(c.models, 'grader', defaults.models.grader),
      attacker: validateModelConfig(c.models, 'attacker', defaults.models.attacker),
    },
    sandbox: (c.sandbox as SandboxConfig) || defaults.sandbox,
    budgets: (c.budgets as BudgetConfig) || defaults.budgets,
    noveltyThresholds: (c.noveltyThresholds as NoveltyThresholds) || defaults.noveltyThresholds,
    stability: (c.stability as StabilityConfig) || defaults.stability,
  };
}

/**
 * Validate a single model configuration
 */
function validateModelConfig(
  models: unknown,
  role: string,
  defaultConfig: ModelConfig
): ModelConfig {
  if (!models || typeof models !== 'object') {
    return defaultConfig;
  }

  const m = (models as Record<string, unknown>)[role];
  if (!m || typeof m !== 'object') {
    return defaultConfig;
  }

  const mc = m as Record<string, unknown>;
  return {
    provider: (mc.provider as 'openai' | 'anthropic') || defaultConfig.provider,
    name: (mc.name as string) || defaultConfig.name,
    temperature: typeof mc.temperature === 'number' ? mc.temperature : defaultConfig.temperature,
  };
}
