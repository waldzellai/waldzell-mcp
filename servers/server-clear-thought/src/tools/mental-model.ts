import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { MentalModelData } from '../types/index.js';

export function registerMentalModel(server: McpServer, sessionState: SessionState) {
  server.tool(
    'mentalmodel',
    'Apply mental models to analyze problems systematically',
    {
      modelName: z.enum(['first_principles', 'opportunity_cost', 'error_propagation', 'rubber_duck', 'pareto_principle', 'occams_razor']).describe('Name of the mental model'),
      problem: z.string().describe('The problem being analyzed'),
      steps: z.array(z.string()).describe('Steps to apply the model'),
      reasoning: z.string().describe('Reasoning process'),
      conclusion: z.string().describe('Conclusions drawn')
    },
    async (args) => {
      const modelData: MentalModelData = {
        modelName: args.modelName,
        problem: args.problem,
        steps: args.steps,
        reasoning: args.reasoning,
        conclusion: args.conclusion
      };
      
      sessionState.addMentalModel(modelData);
      
      // Get session context
      const stats = sessionState.getStats();
      const allModels = sessionState.getMentalModels();
      const recentModels = allModels.slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            modelName: args.modelName,
            status: 'success',
            hasSteps: args.steps.length > 0,
            hasConclusion: !!args.conclusion,
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalMentalModels: allModels.length,
              recentModels: recentModels.map(m => ({
                modelName: m.modelName,
                problem: m.problem
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}