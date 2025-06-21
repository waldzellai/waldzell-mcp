import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerValueOfInformation(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'value_of_information',
    'Calculate the value of information for a decision',
    {
      decision_options: z.array(z.string()),
      uncertainties: z.array(z.string()),
      payoffs: z.array(z.number())
    },
    async ({ decision_options, uncertainties, payoffs }) => {
      const voi_score = payoffs.reduce((s, p) => s + p, 0) / (uncertainties.length || 1);
      const high_impact_questions = uncertainties.map((u) => `Resolve ${u}?`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ voi_score: Number(voi_score.toFixed(2)), high_impact_questions }, null, 2)
          }
        ]
      };
    }
  );
}
