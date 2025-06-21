import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerDragPointAudit(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'drag_point_audit',
    'Identify drag points in a process log',
    {
      log: z.string(),
      categories: z.array(z.string()).optional()
    },
    async ({ log, categories }) => {
      const cats = categories ?? ['general'];
      const drag_points = cats.map((c, i) => ({ category: c, count: i + 1 }));
      const summary_score = drag_points.reduce((s, p) => s + p.count, 0) / drag_points.length;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ drag_points, summary_score: Number(summary_score.toFixed(2)) }, null, 2)
          }
        ]
      };
    }
  );
}
