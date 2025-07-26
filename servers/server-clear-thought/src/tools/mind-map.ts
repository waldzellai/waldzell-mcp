import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerMindMap(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'mind_map',
    'Outline branches around a central topic',
    {
      topic: z.string(),
      num_branches: z.number().int().optional()
    },
    async ({ topic, num_branches }) => {
      const n = num_branches ?? 3;
      const map = Array.from({ length: n }, (_, i) => ({
        branch: `${topic} aspect ${i + 1}`,
        subtopics: [`${topic} aspect ${i + 1}.1`, `${topic} aspect ${i + 1}.2`]
      }));
      return {
        content: [
          { type: 'text', text: JSON.stringify({ map }, null, 2) }
        ]
      };
    }
  );
}
