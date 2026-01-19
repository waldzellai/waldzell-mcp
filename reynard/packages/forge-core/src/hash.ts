import { createHash } from 'node:crypto';

/**
 * Deterministic serialization that sorts object keys recursively.
 * Ensures same object produces same string regardless of key insertion order.
 */
function deterministicStringify(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  const type = typeof obj;
  
  if (type === 'boolean' || type === 'number') {
    return String(obj);
  }
  
  if (type === 'string') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => deterministicStringify(item));
    return `[${items.join(',')}]`;
  }
  
  if (type === 'object') {
    const keys = Object.keys(obj as object).sort();
    const pairs = keys.map(key => {
      const value = (obj as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${deterministicStringify(value)}`;
    });
    return `{${pairs.join(',')}}`;
  }
  
  // Fallback for functions, symbols, etc.
  return String(obj);
}

/**
 * Hash an object deterministically.
 * Same object structure produces same hash regardless of key order.
 */
export function hashObject(obj: unknown): string {
  const serialized = deterministicStringify(obj);
  const h = createHash('sha256');
  h.update(serialized, 'utf8');
  return h.digest('hex');
}