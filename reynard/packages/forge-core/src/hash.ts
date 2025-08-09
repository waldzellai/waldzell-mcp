import { createHash } from 'node:crypto';

export function hashObject(obj: unknown): string {
  const h = createHash('sha256');
  h.update(JSON.stringify(obj));
  return h.digest('hex');
}