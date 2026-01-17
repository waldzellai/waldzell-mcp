/**
 * MCP Server Factory
 * Creates configured MCP server instances with all Yelp tools registered
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { YelpClient } from './yelp-client/index.js';
import { registerAllTools } from './tools/index.js';

export interface CreateServerOptions {
  /** Yelp API key */
  apiKey: string;
  /** Optional timeout for API requests (default: 30000ms) */
  timeout?: number;
}

/**
 * Create a new MCP server configured with Yelp Fusion API tools
 */
export async function createMcpServer(options: CreateServerOptions): Promise<McpServer> {
  const { apiKey, timeout } = options;

  // Create the MCP server
  const server = new McpServer({
    name: 'yelp-fusionai',
    version: '0.1.0',
  });

  // Create the Yelp API client
  const client = new YelpClient({ apiKey, timeout });

  // Register all tools
  registerAllTools(server, client);

  return server;
}
