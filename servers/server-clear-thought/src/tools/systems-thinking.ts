import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { SystemsData } from '../types/index.js';

export function registerSystemsThinking(server: McpServer, sessionState: SessionState) {
  server.tool(
    'systemsthinking',
    'Analyze complex systems and their interactions',
    {
      system: z.string().describe('System being analyzed'),
      components: z.array(z.string()).describe('Components identified'),
      relationships: z.array(z.object({
        from: z.string(),
        to: z.string(),
        type: z.string(),
        strength: z.number().optional()
      })).describe('Relationships between components'),
      feedbackLoops: z.array(z.object({
        components: z.array(z.string()),
        type: z.enum(['positive', 'negative']),
        description: z.string()
      })).describe('Feedback loops identified'),
      emergentProperties: z.array(z.string()).describe('Emergent properties'),
      leveragePoints: z.array(z.string()).describe('Leverage points'),
      sessionId: z.string().describe('Session ID'),
      iteration: z.number().describe('Current iteration'),
      nextAnalysisNeeded: z.boolean().describe('Whether more analysis is needed')
    },
    async (args) => {
      const systemsData: SystemsData = {
        system: args.system,
        components: args.components,
        relationships: args.relationships,
        feedbackLoops: args.feedbackLoops,
        emergentProperties: args.emergentProperties,
        leveragePoints: args.leveragePoints,
        sessionId: args.sessionId,
        iteration: args.iteration,
        nextAnalysisNeeded: args.nextAnalysisNeeded
      };
      
      sessionState.addSystemsAnalysis(systemsData);
      
      // Get session context
      const stats = sessionState.getStats();
      const systemsAnalyses = sessionState.getSystemsAnalyses();
      const recentAnalyses = systemsAnalyses.slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            system: args.system,
            componentsCount: args.components.length,
            relationshipsCount: args.relationships.length,
            feedbackLoops: args.feedbackLoops,
            emergentProperties: args.emergentProperties,
            leveragePoints: args.leveragePoints,
            nextAnalysisNeeded: args.nextAnalysisNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalSystemsAnalyses: systemsAnalyses.length,
              recentAnalyses: recentAnalyses.map(a => ({
                system: a.system,
                componentsCount: a.components.length,
                iteration: a.iteration
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}