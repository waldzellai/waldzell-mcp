import { z } from "zod/v4";

export class ValidationError extends Error {
  constructor(
    public context: string,
    public zodError: z.core.$ZodError,
    public prettyError: string
  ) {
    super(`Validation failed in ${context}: ${prettyError}`);
    this.name = 'ValidationError';
  }
}

export function validateInput<T>(
  schema: z.ZodType<T>,
  input: unknown,
  context: string
): T {
  const result = schema.safeParse(input);
  
  if (!result.success) {
    const prettyError = z.prettifyError(result.error);
    throw new ValidationError(context, result.error, prettyError);
  }
  
  return result.data;
}

export function getFieldError(
  error: z.core.$ZodError,
  fieldPath: string
): string | undefined {
  const tree = z.treeifyError(error);
  // Navigate tree structure to get specific field error
  const pathParts = fieldPath.split('.');
  let current: any = tree;
  
  for (const part of pathParts) {
    if (!current?.properties?.[part]) return undefined;
    current = current.properties[part];
  }
  
  return current?.errors?.[0];
}

// Common result type for all server operations
export interface ProcessResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}