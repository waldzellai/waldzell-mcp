/**
 * Factory functions for MCP tool registration
 */

// @ts-expect-error - Import SDK
import { McpServer } from '@modelcontextprotocol/sdk';
import { z } from 'zod';
import { handleApiError } from './errors.js';

export interface CallToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Registers a tool with standardized error handling
 * @param server The MCP server instance
 * @param name Tool name
 * @param description Tool description
 * @param schema Tool input schema
 * @param handler Function to execute when tool is called
 */
export function registerTool(
  server: McpServer, 
  name: string, 
  description: string, 
  schema: z.ZodTypeAny, 
  handler: (args: Record<string, any>) => Promise<CallToolResult>
): void {
  server.tool(
    name, 
    description, 
    schema, 
    async (args: Record<string, any>): Promise<CallToolResult> => {
      try {
        return await handler(args);
      } catch (error) {
        return handleApiError(error, name);
      }
    }
  );
}

/**
 * Formats a successful response
 * @param text The formatted text response
 * @returns Structured MCP response
 */
export function formatSuccess(text: string): CallToolResult {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}