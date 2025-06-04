import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { DecisionData } from '../types/index.js';

export function registerDecisionFramework(server: McpServer, sessionState: SessionState) {
  server.tool(
    'decisionframework',
    'Apply structured decision-making frameworks',
    {
      decisionStatement: z.string(),
      options: z.array(z.object({
        name: z.string(),
        description: z.string()
      })),
      analysisType: z.string(),
      stage: z.string(),
      decisionId: z.string(),
      iteration: z.number(),
      nextStageNeeded: z.boolean()
    },
    async (args) => {
      const decisionData: DecisionData = {
        decisionStatement: args.decisionStatement,
        options: args.options,
        analysisType: args.analysisType as DecisionData['analysisType'],
        stage: args.stage as DecisionData['stage'],
        decisionId: args.decisionId,
        iteration: args.iteration,
        nextStageNeeded: args.nextStageNeeded
      };
      
      sessionState.addDecision(decisionData);
      
      // Get session context
      const stats = sessionState.getStats();
      const recentDecisions = sessionState.getDecisions();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            decisionId: args.decisionId,
            stage: args.stage,
            analysisType: args.analysisType,
            optionsCount: args.options.length,
            nextStageNeeded: args.nextStageNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalOperations: stats.totalOperations,
              decisionStoreStats: stats.stores.decisions,
              recentDecisions: recentDecisions.slice(-3).map((d: DecisionData) => ({
                decisionId: d.decisionId,
                stage: d.stage,
                iteration: d.iteration
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}