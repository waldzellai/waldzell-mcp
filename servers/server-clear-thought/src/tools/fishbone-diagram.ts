import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerFishboneDiagram(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'fishbone_diagram',
    'Group potential causes of a problem',
    {
      problem: z.string(),
      categories: z.array(z.string()).optional()
    },
    async ({ problem, categories }) => {
      const cats = categories ?? ['materials', 'methods', 'people', 'environment'];
      const causes_map = cats.map((c) => ({
        category: c,
        causes: [`${c} cause 1`, `${c} cause 2`]
      }));
      return {
        content: [
          { type: 'text', text: JSON.stringify({ causes_map }, null, 2) }
        ]
      };
    }
  );
}
