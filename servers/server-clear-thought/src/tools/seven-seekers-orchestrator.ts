import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerSevenSeekersOrchestrator(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'seven_seekers_orchestrator',
    'Orchestrate a set of seeker tools and combine their results',
    {
      query: z.string(),
      downstream_tools: z.array(z.string()).optional()
    },
    async ({ query, downstream_tools }) => {
      const tools = downstream_tools ?? Array.from({ length: 7 }, (_, i) => `tool_${i}`);
      const seeker_results = tools.map((t) => ({ tool: t, result: `${query} -> ${t}` }));
      const resonance_map = Object.fromEntries(tools.map((t) => [t, 1.0]));
      const synthesis = seeker_results.map((r) => r.result).join('; ');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ seeker_results, resonance_map, synthesis }, null, 2)
          }
        ]
      };
    }
  );
}
