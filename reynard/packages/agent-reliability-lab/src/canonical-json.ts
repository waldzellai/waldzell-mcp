import { createHash } from "node:crypto";

function unsupported(description: string): never {
  throw new TypeError(`Unsupported canonical JSON value: ${description}`);
}

function serialize(value: unknown, ancestors: Set<object>): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) {
        return unsupported("non-finite number");
      }
      return JSON.stringify(value);
    case "undefined":
    case "function":
    case "symbol":
    case "bigint":
      return unsupported(typeof value);
    case "object":
      break;
  }

  if (ancestors.has(value)) {
    throw new TypeError("Canonical JSON cannot contain a cycle");
  }

  const prototype = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return unsupported("non-plain object");
  }

  if (Object.getOwnPropertySymbols(value).length > 0) {
    return unsupported("symbol-keyed property");
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const items: string[] = [];
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, index);
        if (descriptor === undefined) {
          return unsupported("sparse array element");
        }
        if (descriptor.get !== undefined || descriptor.set !== undefined) {
          return unsupported("accessor array element");
        }
        items.push(serialize(descriptor.value, ancestors));
      }
      return `[${items.join(",")}]`;
    }

    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(record, key);
        if (descriptor?.get !== undefined || descriptor?.set !== undefined) {
          return unsupported("accessor property");
        }
        return `${JSON.stringify(key)}:${serialize(record[key], ancestors)}`;
      });
    return `{${entries.join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value: unknown): string {
  return serialize(value, new Set());
}

export function sha256(value: string | Uint8Array): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
