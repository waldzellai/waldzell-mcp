import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { ScientificInquiryData } from '../types/index.js';

export function registerScientificMethod(server: McpServer, sessionState: SessionState) {
  server.tool(
    'scientificmethod',
    'Apply scientific method for systematic inquiry',
    {
      stage: z.enum(['observation', 'question', 'hypothesis', 'experiment', 'analysis', 'conclusion', 'iteration']).describe('Current stage'),
      observation: z.string().optional().describe('Initial observation'),
      question: z.string().optional().describe('Research question'),
      hypothesis: z.object({
        statement: z.string(),
        variables: z.array(z.object({
          name: z.string(),
          type: z.enum(['independent', 'dependent', 'controlled', 'confounding']),
          operationalization: z.string().optional()
        })),
        assumptions: z.array(z.string()),
        hypothesisId: z.string(),
        confidence: z.number(),
        domain: z.string(),
        iteration: z.number(),
        alternativeTo: z.array(z.string()).optional(),
        refinementOf: z.string().optional(),
        status: z.enum(['proposed', 'testing', 'supported', 'refuted', 'refined'])
      }).optional().describe('Hypothesis data'),
      experiment: z.object({
        design: z.string(),
        methodology: z.string(),
        predictions: z.array(z.object({
          if: z.string(),
          then: z.string(),
          else: z.string().optional()
        })),
        experimentId: z.string(),
        hypothesisId: z.string(),
        controlMeasures: z.array(z.string()),
        results: z.string().optional(),
        outcomeMatched: z.boolean().optional(),
        unexpectedObservations: z.array(z.string()).optional(),
        limitations: z.array(z.string()).optional(),
        nextSteps: z.array(z.string()).optional()
      }).optional().describe('Experiment data'),
      analysis: z.string().optional().describe('Analysis results'),
      conclusion: z.string().optional().describe('Conclusions drawn'),
      inquiryId: z.string().describe('Inquiry ID'),
      iteration: z.number().describe('Current iteration'),
      nextStageNeeded: z.boolean().describe('Whether next stage is needed')
    },
    async (args) => {
      const scientificData: ScientificInquiryData = {
        stage: args.stage,
        observation: args.observation,
        question: args.question,
        hypothesis: args.hypothesis,
        experiment: args.experiment,
        analysis: args.analysis,
        conclusion: args.conclusion,
        inquiryId: args.inquiryId,
        iteration: args.iteration,
        nextStageNeeded: args.nextStageNeeded
      };
      
      sessionState.addScientificInquiry(scientificData);
      
      // Get session context
      const stats = sessionState.getStats();
      const inquiries = sessionState.getScientificInquiries();
      const recentInquiries = inquiries.slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            inquiryId: args.inquiryId,
            stage: args.stage,
            iteration: args.iteration,
            nextStageNeeded: args.nextStageNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalScientificInquiries: inquiries.length,
              recentInquiries: recentInquiries.map(s => ({
                inquiryId: s.inquiryId,
                stage: s.stage,
                iteration: s.iteration
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}