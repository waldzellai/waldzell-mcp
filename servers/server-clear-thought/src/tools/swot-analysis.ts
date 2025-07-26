import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerSwotAnalysis(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'swot_analysis',
    'Categorize strengths, weaknesses, opportunities, threats',
    {
      subject: z.string()
    },
    async ({ subject }) => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                strengths: [`${subject} strength 1`, `${subject} strength 2`],
                weaknesses: [`${subject} weakness 1`, `${subject} weakness 2`],
                opportunities: [`${subject} opportunity 1`, `${subject} opportunity 2`],
                threats: [`${subject} threat 1`, `${subject} threat 2`]
              },
              null,
              2
            )
          }
        ]
      };
    }
  );
}
