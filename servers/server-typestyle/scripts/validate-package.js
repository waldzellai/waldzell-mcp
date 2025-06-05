#!/usr/bin/env node

/**
 * Validates the package before publishing 
 * Run with: node scripts/validate-package.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Check required files
const requiredFiles = [
  'package.json',
  'README.md',
  'LICENSE',
  'index.ts',
  'typestyle_mcp_config.template.ts'
];

console.log('Validating package...');

// Check for required files
console.log('\nChecking required files:');
for (const file of requiredFiles) {
  const filePath = path.join(rootDir, file);
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    console.log(`✅ ${file} exists`);
  } catch (err) {
    console.error(`❌ ${file} is missing!`);
    process.exit(1);
  }
}

// Read package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check package.json fields
console.log('\nChecking package.json fields:');
const requiredFields = [
  'name', 'version', 'description', 'license', 'author', 
  'main', 'files', 'scripts', 'dependencies'
];

for (const field of requiredFields) {
  if (packageJson[field]) {
    console.log(`✅ ${field} defined`);
  } else {
    console.error(`❌ ${field} is missing!`);
    process.exit(1);
  }
}

// Check index.ts for version match
console.log('\nChecking version consistency:');
const indexTsPath = path.join(rootDir, 'index.ts');
const indexTsContent = fs.readFileSync(indexTsPath, 'utf8');
const packageVersion = packageJson.version;
const versionMatch = indexTsContent.match(/version:\s*["']([^"']+)/);

if (versionMatch) {
  const indexVersion = versionMatch[1];
  
  if (indexVersion === packageVersion) {
    console.log(`✅ Versions match: ${packageVersion}`);
  } else {
    console.error(`❌ Version mismatch: package.json=${packageVersion}, index.ts=${indexVersion}`);
    process.exit(1);
  }
} else {
  console.error('❌ Could not find version in index.ts');
  process.exit(1);
}

console.log('\n✅ Package validation successful!');