import { randomUUID } from 'node:crypto';

/**
 * Generate a cryptographically random UUID v4.
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Time-safe JSON stringify with deterministic key ordering.
 * Useful for hashing and comparison.
 */
export function deterministicStringify(obj: unknown, space?: number): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Sort object keys
      const sorted: Record<string, unknown> = {};
      Object.keys(value).sort().forEach(k => {
        sorted[k] = value[k];
      });
      return sorted;
    }
    return value;
  }, space);
}
