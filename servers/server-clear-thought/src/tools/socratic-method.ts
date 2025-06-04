import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { SocraticData } from '../types/index.js';

export function registerSocraticMethod(server: McpServer, sessionState: SessionState) {
  server.tool(
    'socraticmethod',
    'Guide inquiry through systematic questioning',
    {
      claim: z.string().describe('The main claim or topic being explored'),
      premises: z.array(z.string()).describe('Supporting premises or assumptions'),
      conclusion: z.string().describe('Conclusion or insight reached'),
      question: z.string().describe('Socratic question being asked'),
      stage: z.enum(['clarification', 'assumptions', 'evidence', 'perspectives', 'implications', 'questions']).describe('Method stage'),
      argumentType: z.enum(['deductive', 'inductive', 'abductive', 'analogical']).describe('Type of argument'),
      confidence: z.number().min(0).max(1).describe('Confidence level (0.0-1.0)'),
      sessionId: z.string().describe('Session identifier'),
      iteration: z.number().describe('Current iteration'),
      nextArgumentNeeded: z.boolean().describe('Whether next argument is needed')
    },
    async (args) => {
      // Create socratic data as a special type of argument
      const socraticData: SocraticData = {
        claim: args.claim,
        premises: args.premises,
        conclusion: args.conclusion,
        question: args.question,
        stage: args.stage,
        argumentType: args.argumentType,
        confidence: args.confidence,
        sessionId: args.sessionId,
        iteration: args.iteration,
        nextArgumentNeeded: args.nextArgumentNeeded
      };
      
      sessionState.addArgumentation(socraticData);
      
      // Get session context
      const stats = sessionState.getStats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            question: args.question,
            stage: args.stage,
            claim: args.claim,
            premises: args.premises,
            conclusion: args.conclusion,
            argumentType: args.argumentType,
            confidence: args.confidence,
            nextArgumentNeeded: args.nextArgumentNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              iteration: args.iteration,
              totalOperations: stats.totalOperations
            }
          }, null, 2)
        }]
      };
    }
  );
}