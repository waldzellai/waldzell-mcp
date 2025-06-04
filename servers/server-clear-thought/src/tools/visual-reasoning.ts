import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { VisualData } from '../types/index.js';

export function registerVisualReasoning(server: McpServer, sessionState: SessionState) {
  server.tool(
    'visualreasoning',
    'Process visual reasoning and diagram operations',
    {
      operation: z.string(),
      diagramId: z.string(),
      diagramType: z.string(),
      iteration: z.number(),
      nextOperationNeeded: z.boolean()
    },
    async (args) => {
      const visualData: VisualData = {
        operation: args.operation as VisualData['operation'],
        diagramId: args.diagramId,
        diagramType: args.diagramType as VisualData['diagramType'],
        iteration: args.iteration,
        nextOperationNeeded: args.nextOperationNeeded
      };
      
      sessionState.addVisualOperation(visualData);
      
      // Get session context
      const stats = sessionState.getStats();
      const recentVisuals = sessionState.getVisualOperations();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            diagramId: args.diagramId,
            diagramType: args.diagramType,
            operation: args.operation,
            iteration: args.iteration,
            nextOperationNeeded: args.nextOperationNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalOperations: stats.totalOperations,
              visualStoreStats: stats.stores.visual,
              recentOperations: recentVisuals.slice(-3).map((v: VisualData) => ({
                diagramId: v.diagramId,
                operation: v.operation,
                iteration: v.iteration
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}