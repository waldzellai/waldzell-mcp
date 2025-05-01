/**
 * Response formatting utilities
 */

/**
 * Format a successful response for MCP tools
 */
export function formatSuccess(text: string) {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}