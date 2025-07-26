import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

function buildTree(question: string, depth: number): any {
  if (depth === 0) {
    return { question, sub_questions: [] };
  }
  return {
    question,
    sub_questions: [
      buildTree(`${question} sub1`, depth - 1),
      buildTree(`${question} sub2`, depth - 1)
    ]
  };
}

export function registerIssueTree(server: McpServer, _sessionState: SessionState) {
  server.tool(
    'issue_tree',
    'Break down a question into hierarchical sub-issues',
    {
      problem: z.string(),
      depth: z.number().int().optional()
    },
    async ({ problem, depth }) => {
      const d = depth ?? 1;
      const tree = buildTree(problem, d);
      return {
        content: [
          { type: 'text', text: JSON.stringify({ tree }, null, 2) }
        ]
      };
    }
  );
}
