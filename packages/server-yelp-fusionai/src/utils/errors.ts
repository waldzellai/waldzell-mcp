/**
 * Error handling utilities for MCP server
 */

/**
 * Standard error response format for MCP tools
 */
export function handleApiError(error: unknown, context: string) {
  console.error(`Error in ${context}:`, error);
  return {
    content: [{ 
      type: 'text', 
      text: `Error in ${context}: ${formatError(error)}` 
    }],
    isError: true
  };
}

/**
 * Format any error to a string
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}