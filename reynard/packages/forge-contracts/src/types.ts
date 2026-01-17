export interface ContractFailure {
  testName: string;
  error: string;
  stack?: string;
}

export interface ContractResult {
  pass: boolean;
  testsRun: number;
  failures: ContractFailure[];
  coverage?: number;
  flakyTests: string[];
  suggestedVersionBump: 'major' | 'minor' | 'patch' | 'none';
  warnings: string[];
  summary: string;
}

export interface ContractConfig {
  locations?: string[]; // additional paths to scan for contracts
  fuzzRuns?: number; // number of fuzz iterations
  retries?: number; // number of retries to detect flaky tests
}
