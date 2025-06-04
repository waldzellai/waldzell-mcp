import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { CreativeData } from '../types/index.js';

export function registerCreativeThinking(server: McpServer, sessionState: SessionState) {
  server.tool(
    'creativethinking',
    'Engage in creative and lateral thinking approaches',
    {
      prompt: z.string().describe('Creative prompt or challenge'),
      ideas: z.array(z.string()).describe('Ideas generated'),
      techniques: z.array(z.string()).describe('Techniques used'),
      connections: z.array(z.string()).describe('Connections made'),
      insights: z.array(z.string()).describe('Novel insights'),
      sessionId: z.string().describe('Session identifier'),
      iteration: z.number().describe('Current iteration'),
      nextIdeaNeeded: z.boolean().describe('Whether more creativity is needed')
    },
    async (args) => {
      const creativeData: CreativeData = {
        prompt: args.prompt,
        ideas: args.ideas,
        techniques: args.techniques,
        connections: args.connections,
        insights: args.insights,
        sessionId: args.sessionId,
        iteration: args.iteration,
        nextIdeaNeeded: args.nextIdeaNeeded
      };
      
      sessionState.addCreativeSession(creativeData);
      
      // Get session context
      const stats = sessionState.getStats();
      const creativeSessions = sessionState.getCreativeSessions();
      const recentSessions = creativeSessions.slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            prompt: args.prompt,
            ideasGenerated: args.ideas.length,
            techniquesUsed: args.techniques,
            connectionsFound: args.connections.length,
            insights: args.insights,
            nextIdeaNeeded: args.nextIdeaNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalCreativeSessions: creativeSessions.length,
              recentPrompts: recentSessions.map(s => ({
                prompt: s.prompt,
                ideasCount: s.ideas.length,
                iteration: s.iteration
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}