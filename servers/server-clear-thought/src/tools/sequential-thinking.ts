import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { ThoughtData } from '../types/index.js';

export function registerSequentialThinking(server: McpServer, sessionState: SessionState) {
  server.tool(
    'sequentialthinking',
    'Process sequential thoughts with branching, revision, and memory management capabilities',
    {
      thought: z.string().describe('The thought content'),
      thoughtNumber: z.number().describe('Current thought number in sequence'),
      totalThoughts: z.number().describe('Total expected thoughts in sequence'),
      nextThoughtNeeded: z.boolean().describe('Whether the next thought is needed'),
      isRevision: z.boolean().optional().describe('Whether this is a revision of a previous thought'),
      revisesThought: z.number().optional().describe('Which thought number this revises'),
      branchFromThought: z.number().optional().describe('Which thought this branches from'),
      branchId: z.string().optional().describe('Unique identifier for this branch'),
      needsMoreThoughts: z.boolean().optional().describe('Whether more thoughts are needed')
    },
    async (args) => {
      const thoughtData: ThoughtData = {
        thought: args.thought,
        thoughtNumber: args.thoughtNumber,
        totalThoughts: args.totalThoughts,
        nextThoughtNeeded: args.nextThoughtNeeded,
        isRevision: args.isRevision,
        revisesThought: args.revisesThought,
        branchFromThought: args.branchFromThought,
        branchId: args.branchId,
        needsMoreThoughts: args.needsMoreThoughts
      };
      
      const added = sessionState.addThought(thoughtData);
      
      // Get session context for the response
      const stats = sessionState.getStats();
      const allThoughts = sessionState.getThoughts();
      const recentThoughts = allThoughts.slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...thoughtData,
            status: added ? 'success' : 'limit_reached',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalThoughts: allThoughts.length,
              remainingThoughts: sessionState.getRemainingThoughts(),
              recentThoughts: recentThoughts.map(t => ({
                thoughtNumber: t.thoughtNumber,
                isRevision: t.isRevision
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}