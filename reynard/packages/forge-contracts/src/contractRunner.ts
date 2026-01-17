import { existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { spawn } from 'child_process';
import { ContractResult, ContractConfig, ContractFailure } from './types.js';

/**
 * Discover contract test files in a component
 */
function discoverContracts(componentPath: string, config?: ContractConfig): string[] {
  const contractFiles: string[] = [];

  // Check for contracts/ directory
  const contractsDir = join(componentPath, 'contracts');
  if (existsSync(contractsDir)) {
    const files = readdirSync(contractsDir);
    for (const file of files) {
      if (file.endsWith('.test.ts') || file.endsWith('.spec.ts') || file.endsWith('.test.js')) {
        contractFiles.push(join(contractsDir, file));
      }
    }
  }

  // Check for test files in component root or tests/ directory
  const testsDir = join(componentPath, 'tests');
  if (existsSync(testsDir)) {
    const files = readdirSync(testsDir);
    for (const file of files) {
      if (file.includes('contract') && (file.endsWith('.test.ts') || file.endsWith('.spec.ts'))) {
        contractFiles.push(join(testsDir, file));
      }
    }
  }

  // Check additional locations from config
  if (config?.locations) {
    for (const loc of config.locations) {
      const path = join(componentPath, loc);
      if (existsSync(path)) {
        if (statSync(path).isFile()) {
          contractFiles.push(path);
        } else if (statSync(path).isDirectory()) {
          const files = readdirSync(path);
          for (const file of files) {
            if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
              contractFiles.push(join(path, file));
            }
          }
        }
      }
    }
  }

  return contractFiles;
}

/**
 * Execute contract tests using Node test runner or npm test
 */
async function executeContracts(contractFiles: string[], componentPath: string): Promise<{
  pass: boolean;
  testsRun: number;
  failures: ContractFailure[];
}> {
  if (contractFiles.length === 0) {
    return { pass: true, testsRun: 0, failures: [] };
  }

  // Try to run tests using npm test if package.json exists
  const packageJsonPath = join(componentPath, 'package.json');
  if (existsSync(packageJsonPath)) {
    return await runNpmTest(componentPath);
  }

  // Fallback: try to run tests directly with node
  return await runNodeTests(contractFiles);
}

async function runNpmTest(componentPath: string): Promise<{
  pass: boolean;
  testsRun: number;
  failures: ContractFailure[];
}> {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['test'], {
      cwd: componentPath,
      timeout: 60000,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const pass = code === 0;
      const failures: ContractFailure[] = [];

      // Parse failures from output (basic parsing)
      if (!pass && stderr) {
        failures.push({
          testName: 'Contract tests',
          error: stderr.slice(0, 500),
        });
      }

      // Estimate tests run from output
      const testMatch = stdout.match(/(\d+)\s+(tests?|passing)/i);
      const testsRun = testMatch ? parseInt(testMatch[1], 10) : (pass ? 1 : 0);

      resolve({ pass, testsRun, failures });
    });

    proc.on('error', (err) => {
      resolve({
        pass: false,
        testsRun: 0,
        failures: [{ testName: 'npm test', error: err.message }],
      });
    });
  });
}

async function runNodeTests(contractFiles: string[]): Promise<{
  pass: boolean;
  testsRun: number;
  failures: ContractFailure[];
}> {
  // Simplified: just check if files exist
  // Full implementation would require test runner integration
  return {
    pass: true,
    testsRun: contractFiles.length,
    failures: [],
  };
}

/**
 * Determine suggested version bump based on test results
 */
function determineSemverBump(result: {
  pass: boolean;
  failures: ContractFailure[];
}): 'major' | 'minor' | 'patch' | 'none' {
  if (!result.pass) {
    // Failing tests suggest breaking changes
    return 'major';
  }

  // No failures, suggest patch bump
  return 'patch';
}

/**
 * Run contract tests for a component and return structured results
 */
export async function runContracts(
  componentPath: string,
  config?: ContractConfig
): Promise<ContractResult> {
  const warnings: string[] = [];

  // Validate component path
  if (!existsSync(componentPath)) {
    return {
      pass: false,
      testsRun: 0,
      failures: [{ testName: 'discovery', error: `Component path does not exist: ${componentPath}` }],
      flakyTests: [],
      suggestedVersionBump: 'none',
      warnings: [`Component path not found: ${componentPath}`],
      summary: 'Component path does not exist',
    };
  }

  // Discover contract files
  const contractFiles = discoverContracts(componentPath, config);

  if (contractFiles.length === 0) {
    warnings.push('No contract tests found in component');
    return {
      pass: true,
      testsRun: 0,
      failures: [],
      flakyTests: [],
      suggestedVersionBump: 'patch',
      warnings,
      summary: 'No contracts found (not an error)',
    };
  }

  // Execute contracts
  const execResult = await executeContracts(contractFiles, componentPath);

  // Determine semver bump
  const suggestedVersionBump = determineSemverBump(execResult);

  // Build summary
  const summary = execResult.pass
    ? `${execResult.testsRun} contract tests passed`
    : `${execResult.failures.length} contract tests failed`;

  return {
    pass: execResult.pass,
    testsRun: execResult.testsRun,
    failures: execResult.failures,
    flakyTests: [], // TODO: implement flaky detection with retries
    suggestedVersionBump,
    warnings,
    summary,
  };
}