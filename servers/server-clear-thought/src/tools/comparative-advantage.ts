import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerComparativeAdvantage(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'comparative_advantage',
    'Map tasks to the skill holder with highest capability',
    {
      skills: z.record(z.number()),
      tasks: z.record(z.array(z.string()))
    },
    async ({ skills, tasks }) => {
      const advantage_map = Object.keys(tasks).map((task) => {
        const best = Object.entries(skills).reduce((a, b) => (b[1] > a[1] ? b : a));
        return { task, assignee: best[0] };
      });
      return {
        content: [
          { type: 'text', text: JSON.stringify({ advantage_map }, null, 2) }
        ]
      };
    }
  );
}
