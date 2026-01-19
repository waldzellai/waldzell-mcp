import { CandidateManifest } from './types.js';
import { hashObject } from './hash.js';
import { CandidateManifestSchema, ValidationError } from './validation.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ZodError } from 'zod';

export async function writeManifest(path: string, m: CandidateManifest): Promise<void> {
  try {
    // Validate before writing
    const validated = CandidateManifestSchema.parse(m);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(validated, null, 2), 'utf8');
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error, 'writeManifest');
    }
    throw error;
  }
}

export async function readManifest(path: string): Promise<CandidateManifest> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    // Validate and apply defaults
    const validated = CandidateManifestSchema.parse(parsed);
    return validated as CandidateManifest;
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error, `readManifest(${path})`);
    }
    throw error;
  }
}

export function manifestHash(m: CandidateManifest): string {
  return hashObject(m);
}