import { z } from "zod";

export class ValidationError extends Error {
  constructor(
    public context: string,
    public zodError: z.ZodError,
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
    const prettyError = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new ValidationError(context, result.error, prettyError);
  }
  
  return result.data as T;
}

export function getFieldError(
  error: z.ZodError,
  fieldPath: string
): string | undefined {
  const pathArray = fieldPath.split('.');
  const issue = error.issues.find(
    issue => JSON.stringify(issue.path) === JSON.stringify(pathArray)
  );
  return issue?.message;
}

// Common result type for all server operations
export interface ProcessResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}