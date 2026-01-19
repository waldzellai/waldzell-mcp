#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initProject } from './commands/init.js';
import { generateSpec } from './commands/spec.js';
import { generateProposals } from './commands/propose.js';
import { runEval } from './commands/eval.js';
import { runRedteam } from './commands/redteam.js';
import { selectWinners } from './commands/select.js';
import { reproduceCandidate } from './commands/reproduce.js';
import { launchUI } from './commands/ui.js';
import { loadConfig, configExists } from './config.js';

const program = new Command();

program.name('forge').description('Reynard Forge CLI').version('0.2.0');

// init command
program.command('init')
  .description('scaffold config & datasets')
  .option('-n, --name <name>', 'project name')
  .option('-t, --template <template>', 'project template (mcp-server, langgraph, blank)')
  .option('-f, --force', 'overwrite existing configuration')
  .action(async (options) => {
    try {
      await initProject(options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// spec command
program.command('spec')
  .description('run SpecWizard → TaskSpec.json')
  .argument('<description>', 'natural language description of what to build')
  .option('-o, --output <file>', 'output file path', 'spec.json')
  .action(async (description, options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await generateSpec(description, options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// propose command
program.command('propose')
  .option('-n, --num <int>', 'number of candidates', '5')
  .option('-s, --spec <file>', 'specification file path', 'spec.json')
  .description('generate N candidates from spec')
  .action(async (options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await generateProposals(options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// eval command
program.command('eval')
  .option('--project <name>', 'dataset project', 'demo')
  .option('--smoke', 'run smoke subset', false)
  .option('--candidate <id>', 'evaluate specific candidate')
  .description('run functional+chaos+idempotency suites')
  .action(async (options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await runEval(options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// redteam command
program.command('redteam')
  .option('--candidate <id>', 'test specific candidate')
  .option('--severity <level>', 'fail on severity level (critical/high/medium/low)', 'high')
  .description('run attacker suite')
  .action(async (options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await runRedteam(options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// select command
program.command('select')
  .option('--max <number>', 'maximum winners', '3')
  .description('Pareto select winners (performance vs novelty vs complexity)')
  .action(async (options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await selectWinners({ maxWinners: parseInt(options.max) });
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// reproduce command
program.command('reproduce')
  .requiredOption('--manifest <path>', 'path to manifest.json')
  .description('re-run a candidate deterministically')
  .action(async (options) => {
    try {
      if (!configExists()) {
        console.log(chalk.yellow('\n  ⚠ No configuration found. Run "forge init" first.\n'));
        process.exit(1);
      }
      await reproduceCandidate(options);
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

// ui command
program.command('ui')
  .option('-p, --port <number>', 'port number', '5173')
  .description('launch operator UI')
  .action(async (options) => {
    try {
      await launchUI({ port: parseInt(options.port) });
    } catch (error) {
      console.error(chalk.red(`\n  Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

program.parse();