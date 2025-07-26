import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

import { registerReasoningToolset } from '../toolsets/reasoning.js';
import { registerVisualizationToolset } from '../toolsets/visualization.js';
import { registerUtilityToolset } from '../toolsets/utility.js';
import { registerSessionToolset } from '../toolsets/session.js';

/**
 * Registers all Clear Thought toolsets with the provided MCP server instance
 * @param server - The MCP server instance
 * @param sessionState - The session state manager
 */
export function registerTools(server: McpServer, sessionState: SessionState): void {
  registerReasoningToolset(server, sessionState);
  registerVisualizationToolset(server, sessionState);
  registerUtilityToolset(server, sessionState);
  registerSessionToolset(server, sessionState);
}
