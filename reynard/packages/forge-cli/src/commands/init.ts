/**
 * forge init command
 *
 * Scaffolds a new Reynard Forge project with configuration and datasets
 */

import chalk from 'chalk';
import { mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import {
  createDefaultConfig,
  saveConfig,
  configExists,
  CONFIG_FILENAME,
  type ReynardConfig,
} from '../config';

export interface InitOptions {
  name?: string;
  template?: 'mcp-server' | 'langgraph' | 'blank';
  force?: boolean;
}

/**
 * Initialize a new Reynard Forge project
 */
export async function initProject(options: InitOptions): Promise<void> {
  const projectDir = process.cwd();
  const projectName = options.name || basename(projectDir);

  console.log(chalk.cyan(`\n  Initializing Reynard Forge project: ${projectName}\n`));

  // Check for existing configuration
  if (configExists(projectDir) && !options.force) {
    console.log(chalk.yellow(`  ⚠ Configuration already exists: ${CONFIG_FILENAME}`));
    console.log(chalk.gray(`    Use --force to overwrite\n`));
    return;
  }

  // Create configuration
  const config = createDefaultConfig(projectName);

  // Apply template-specific modifications
  if (options.template) {
    applyTemplate(config, options.template);
    console.log(chalk.gray(`  📋 Applied template: ${options.template}`));
  }

  // Save configuration
  saveConfig(config, projectDir);
  console.log(chalk.green(`  ✓ Created ${CONFIG_FILENAME}`));

  // Create directory structure
  const directories = [
    'specs',           // Specification files
    'proposals',       // Generated proposals
    'ledger',          // State persistence
    'datasets',        // Demo/test datasets
    'prompts',         // Custom prompt templates
  ];

  for (const dir of directories) {
    const dirPath = join(projectDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      console.log(chalk.green(`  ✓ Created ${dir}/`));
    } else {
      console.log(chalk.gray(`  · ${dir}/ already exists`));
    }
  }

  // Create .gitignore entries if needed
  await createGitignore(projectDir);

  // Print next steps
  console.log(chalk.cyan(`\n  Project initialized! Next steps:\n`));
  console.log(chalk.white(`    1. Set environment variables:`));
  console.log(chalk.gray(`       export OPENAI_API_KEY=sk-...`));
  console.log(chalk.gray(`       export ANTHROPIC_API_KEY=sk-ant-...`));
  console.log(chalk.white(`\n    2. Create a specification:`));
  console.log(chalk.gray(`       forge spec "Build an MCP server for weather data"`));
  console.log(chalk.white(`\n    3. Generate proposals:`));
  console.log(chalk.gray(`       forge propose --num 3`));
  console.log();
}

/**
 * Apply template-specific configuration
 */
function applyTemplate(config: ReynardConfig, template: 'mcp-server' | 'langgraph' | 'blank'): void {
  switch (template) {
    case 'mcp-server':
      // MCP server template: focus on tool generation
      config.budgets.maxToolKinds = 10;
      config.budgets.maxNodes = 12;
      config.noveltyThresholds.behavioralDistanceMin = 0.15;
      break;

    case 'langgraph':
      // LangGraph template: focus on workflow complexity
      config.budgets.maxNodes = 25;
      config.budgets.maxLOC = 3500;
      config.models.coder.temperature = 0.4; // More creative coding
      break;

    case 'blank':
      // Blank template: use defaults
      break;
  }
}

/**
 * Create .gitignore entries for Reynard-specific files
 */
async function createGitignore(projectDir: string): Promise<void> {
  const gitignorePath = join(projectDir, '.gitignore');
  const entries = [
    '',
    '# Reynard Forge',
    'ledger/',
    'proposals/*',
    '!proposals/.gitkeep',
    '.forge-cache/',
  ].join('\n');

  // For now, just note what should be added
  // In a full implementation, we'd merge with existing .gitignore
  console.log(chalk.gray(`  · Consider adding to .gitignore: ledger/, proposals/*`));
}
