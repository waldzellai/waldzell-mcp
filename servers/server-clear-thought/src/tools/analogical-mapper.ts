import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerAnalogicalMapper(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'analogical_mapper',
    'Generate analogies from seed domains and suggest prompts',
    {
      problem: z.string(),
      seed_domains: z.array(z.string()).optional(),
      k: z.number().int().optional()
    },
    async (args) => {
      const k = args.k ?? 3;
      const domains = (args.seed_domains ?? ['math', 'biology', 'art']).slice(0, k);
      const analogies = domains.map((d) => ({ domain: d, analogy: `${args.problem} ~ ${d}` }));
      const suggested_prompts = analogies.map((a) => `How would ${a.domain} approach it?`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ analogies, suggested_prompts }, null, 2)
          }
        ]
      };
    }
  );
}
