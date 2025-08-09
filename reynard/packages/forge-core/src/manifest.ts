import { CandidateManifest } from './types.js';
import { hashObject } from './hash.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeManifest(path: string, m: CandidateManifest) {
  // TODO: validate schema with zod
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(m, null, 2), 'utf8');
}

export async function readManifest(path: string): Promise<CandidateManifest> {
  const raw = await readFile(path, 'utf8');
  // TODO: validate schema with zod
  return JSON.parse(raw);
}

export function manifestHash(m: CandidateManifest): string {
  return hashObject(m);
}