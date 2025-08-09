#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

// TODO: wire actual implementations from packages
const program = new Command();

program.name('forge').description('Reynard Forge CLI').version('0.2.0');

program.command('init')
  .description('scaffold config & datasets')
  .action(async () => {
    // TODO: copy demo datasets, write baseline manifests
    console.log(chalk.gray('[init] TODO: implement scaffolding'));
  });

program.command('spec')
  .description('run SpecWizard → TaskSpec.json')
  .action(async () => {
    // TODO: call forge-proposer/specWizard
    console.log(chalk.gray('[spec] TODO: call SpecWizard'));
  });

program.command('propose')
  .option('-n, --num <int>', 'number of candidates', '5')
  .description('generate N candidates from spec')
  .action(async (opts) => {
    // TODO: call proposer planner+coder; write archives
    console.log(chalk.gray(`[propose] TODO: generate ${opts.num} candidates`));
  });

program.command('eval')
  .option('--project <name>', 'dataset project', 'demo')
  .option('--smoke', 'run smoke subset', false)
  .description('run functional+chaos+idempotency suites')
  .action(async (opts) => {
    // TODO: call forge-eval/evalRunner
    console.log(chalk.gray(`[eval] TODO: run eval for project=${opts.project}, smoke=${opts.smoke}`));
  });

program.command('redteam')
  .description('run attacker suite')
  .action(async () => {
    // TODO: call forge-redteam
    console.log(chalk.gray('[redteam] TODO: run attacker suite'));
  });

program.command('select')
  .description('Pareto select winners (performance vs novelty vs complexity)')
  .action(async () => {
    // TODO: implement Pareto and thresholds
    console.log(chalk.gray('[select] TODO: choose winners'));
  });

program.command('reproduce')
  .requiredOption('--manifest <path>', 'path to manifest.json')
  .description('re-run a candidate deterministically')
  .action(async (opts) => {
    // TODO: invoke sandbox and eval using pinned manifest
    console.log(chalk.gray(`[reproduce] TODO: reproduce from ${opts.manifest}`));
  });

program.command('ui')
  .description('launch operator UI')
  .action(async () => {
    // TODO: launch vite dev server/build
    console.log(chalk.gray('[ui] TODO: start operator UI'));
  });

program.parse();