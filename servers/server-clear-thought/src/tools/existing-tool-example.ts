import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerExistingToolExample(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'existing_tool_example',
    'Echo back provided text',
    {
      text: z.string()
    },
    async ({ text }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ echoed: text }, null, 2)
          }
        ]
      };
    }
  );
}
