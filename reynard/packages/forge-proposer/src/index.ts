export * from './specWizard.js';
export * from './planner.js';
export * from './coder.js';
export * from './manifestGenerator.js';
export * from './providers/index.js';

import { runSpecWizard, type TaskSpec } from './specWizard.js';
import { planGraph } from './planner.js';
import { realizeGraph } from './coder.js';
import { generateManifest, type ManifestOptions } from './manifestGenerator.js';
import type { LLMProvider } from './providers/types.js';

/**
 * Complete proposal pipeline: spec → plan → code
 */
export async function generateCandidate(
  spec: Partial<TaskSpec>,
  outputDir: string,
  options?: {
    provider?: LLMProvider;
    model?: string;
    temperature?: number;
    seed?: number;
    manifestOptions?: ManifestOptions;
  }
): Promise<{ candidateId: string; manifestPath: string; outDir: string }> {
  console.log('=== Starting Candidate Generation ===');

  // Step 1: Complete and validate spec
  console.log('\n1. Running SpecWizard...');
  const validatedSpec = await runSpecWizard(spec);

  // Step 2: Plan graph
  console.log('\n2. Planning graph...');
  const graph = await planGraph(validatedSpec, options?.provider, {
    model: options?.model,
    temperature: options?.temperature,
    seed: options?.seed,
  });

  // Step 3: Generate manifest
  console.log('\n3. Generating manifest...');
  const manifest = generateManifest(graph, validatedSpec, options?.manifestOptions);

  // Step 4: Realize code
  console.log('\n4. Realizing code...');
  const result = await realizeGraph(graph, outputDir, manifest);

  console.log('\n=== Candidate Generation Complete ===');
  console.log(`Candidate ID: ${manifest.id}`);
  console.log(`Output: ${result.outDir}`);
  console.log(`Manifest: ${result.manifestPath}`);

  return {
    candidateId: manifest.id,
    manifestPath: result.manifestPath,
    outDir: result.outDir,
  };
}