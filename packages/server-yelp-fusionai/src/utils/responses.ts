/**
 * Standardized response utilities
 */

export interface CallToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, context: string): CallToolResult {
  console.error(`Error in ${context}:`, error);
  return {
    content: [{
      type: 'text',
      text: `Error in ${context}: ${error instanceof Error ? error.message : String(error)}`
    }],
    isError: true
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(text: string): CallToolResult {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}