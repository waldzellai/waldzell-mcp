import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerConceptMap(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'concept_map',
    'Depict nodes and annotated relationships',
    {
      main_concept: z.string(),
      related_concepts: z.array(z.string()).optional()
    },
    async ({ main_concept, related_concepts }) => {
      const related = related_concepts ?? Array.from({ length: 3 }, (_, i) => `${main_concept} sub${i + 1}`);
      const nodes = [main_concept, ...related];
      const links = related.map((r) => ({ from: main_concept, to: r, relation: `${main_concept}->${r}` }));
      return {
        content: [
          { type: 'text', text: JSON.stringify({ nodes, links }, null, 2) }
        ]
      };
    }
  );
}
