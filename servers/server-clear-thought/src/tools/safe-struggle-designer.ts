import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerSafeStruggleDesigner(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'safe_struggle_designer',
    'Design a safe skill improvement plan',
    {
      skill: z.string(),
      current_level: z.number(),
      target_level: z.number(),
      constraints: z.record(z.any()).optional()
    },
    async ({ skill, current_level, target_level }) => {
      const scaffold_steps = [] as string[];
      for (let lvl = current_level; lvl <= target_level; lvl++) {
        scaffold_steps.push(`Practice ${skill} at level ${lvl}`);
      }
      const safety_measures = ['Take breaks', 'Monitor progress'];
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ scaffold_steps, safety_measures, review_intervals: 'weekly' }, null, 2)
          }
        ]
      };
    }
  );
}
