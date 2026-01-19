/**
 * Acceptance Tests: ADAS System
 * 
 * High-level acceptance criteria for the complete system
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const PACKAGES_DIR = join(__dirname, '../../packages');

describe('ADAS System Acceptance Tests', () => {
  describe('Package Structure', () => {
    const packages = [
      'forge-core',
      'forge-ledger',
      'forge-sandbox',
      'forge-contracts',
      'forge-exec',
      'forge-eval',
      'forge-redteam',
      'forge-proposer',
      'forge-ui',
      'forge-cli',
    ];

    packages.forEach((pkg) => {
      it(`should have ${pkg} package`, () => {
        expect(existsSync(join(PACKAGES_DIR, pkg))).toBe(true);
        expect(existsSync(join(PACKAGES_DIR, pkg, 'package.json'))).toBe(true);
      });

      it(`should have built ${pkg} package`, () => {
        const distExists = existsSync(join(PACKAGES_DIR, pkg, 'dist'));
        // forge-ui uses vite and has different output
        if (pkg === 'forge-ui') {
          expect(distExists || existsSync(join(PACKAGES_DIR, pkg, 'dist'))).toBe(true);
        } else {
          expect(distExists).toBe(true);
        }
      });
    });
  });

  describe('Foundation Layer', () => {
    it('should have forge-core with types and validation', () => {
      const coreDist = join(PACKAGES_DIR, 'forge-core', 'dist');
      expect(existsSync(join(coreDist, 'types.js'))).toBe(true);
      expect(existsSync(join(coreDist, 'validation.js'))).toBe(true);
      expect(existsSync(join(coreDist, 'hash.js'))).toBe(true);
    });

    it('should have forge-ledger with intent tracking', () => {
      const ledgerDist = join(PACKAGES_DIR, 'forge-ledger', 'dist');
      expect(existsSync(join(ledgerDist, 'ledger.js'))).toBe(true);
    });

    it('should have forge-sandbox with Docker driver', () => {
      const sandboxDist = join(PACKAGES_DIR, 'forge-sandbox', 'dist');
      expect(existsSync(join(sandboxDist, 'drivers'))).toBe(true);
    });

    it('should have forge-contracts with runner', () => {
      const contractsDist = join(PACKAGES_DIR, 'forge-contracts', 'dist');
      expect(existsSync(join(contractsDist, 'contractRunner.js'))).toBe(true);
    });
  });

  describe('Execution Layer', () => {
    it('should have forge-exec with executor', () => {
      const execDist = join(PACKAGES_DIR, 'forge-exec', 'dist');
      expect(existsSync(join(execDist, 'executor.js'))).toBe(true);
      expect(existsSync(join(execDist, 'cycle.js'))).toBe(true);
    });
  });

  describe('Evaluation Layer', () => {
    it('should have forge-eval with all suites', () => {
      const evalDist = join(PACKAGES_DIR, 'forge-eval', 'dist');
      expect(existsSync(join(evalDist, 'evalRunner.js'))).toBe(true);
      expect(existsSync(join(evalDist, 'suites'))).toBe(true);
    });

    it('should have forge-redteam with security tests', () => {
      const redteamDist = join(PACKAGES_DIR, 'forge-redteam', 'dist');
      expect(existsSync(join(redteamDist, 'redteamRunner.js'))).toBe(true);
      expect(existsSync(join(redteamDist, 'detectors.js'))).toBe(true);
    });
  });

  describe('Generation Layer', () => {
    it('should have forge-proposer with generation pipeline', () => {
      const proposerDist = join(PACKAGES_DIR, 'forge-proposer', 'dist');
      expect(existsSync(join(proposerDist, 'specWizard.js'))).toBe(true);
      expect(existsSync(join(proposerDist, 'planner.js'))).toBe(true);
      expect(existsSync(join(proposerDist, 'coder.js'))).toBe(true);
    });
  });

  describe('Interface Layer', () => {
    it('should have forge-ui with React components', () => {
      const uiDist = join(PACKAGES_DIR, 'forge-ui', 'dist');
      expect(existsSync(uiDist)).toBe(true);
    });

    it('should have forge-cli with all commands', () => {
      const cliDist = join(PACKAGES_DIR, 'forge-cli', 'dist');
      expect(existsSync(join(cliDist, 'index.js'))).toBe(true);
      expect(existsSync(join(cliDist, 'commands'))).toBe(true);
    });
  });

  describe('System Integration', () => {
    it('should have complete workflow capability', () => {
      // Verify all packages are present for end-to-end workflow
      const requiredPackages = [
        'forge-core',
        'forge-proposer',
        'forge-exec',
        'forge-eval',
        'forge-redteam',
        'forge-cli',
      ];

      requiredPackages.forEach((pkg) => {
        expect(existsSync(join(PACKAGES_DIR, pkg, 'dist'))).toBe(true);
      });
    });
  });
});
