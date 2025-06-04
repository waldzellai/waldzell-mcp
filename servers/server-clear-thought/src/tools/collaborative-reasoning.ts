import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { CollaborativeSession, PersonaData, ContributionData } from '../types/index.js';

const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  expertise: z.array(z.string()),
  background: z.string(),
  perspective: z.string(),
  biases: z.array(z.string()),
  communication: z.object({
    style: z.enum(['formal', 'casual', 'technical', 'creative']),
    tone: z.enum(['analytical', 'supportive', 'challenging', 'neutral'])
  })
});

const ContributionSchema = z.object({
  personaId: z.string(),
  content: z.string(),
  type: z.enum(['observation', 'question', 'insight', 'concern', 'suggestion', 'challenge', 'synthesis']),
  confidence: z.number().min(0).max(1),
  referenceIds: z.array(z.string()).optional()
});

export function registerCollaborativeReasoning(server: McpServer, sessionState: SessionState) {
  server.tool(
    'collaborativereasoning',
    'Facilitate collaborative reasoning with multiple perspectives and personas',
    {
      topic: z.string(),
      personas: z.array(PersonaSchema),
      contributions: z.array(ContributionSchema),
      stage: z.enum(['problem-definition', 'ideation', 'critique', 'integration', 'decision', 'reflection']),
      activePersonaId: z.string(),
      sessionId: z.string(),
      iteration: z.number(),
      nextContributionNeeded: z.boolean()
    },
    async (args) => {
      const collaborativeData: CollaborativeSession = {
        topic: args.topic,
        personas: args.personas,
        contributions: args.contributions,
        stage: args.stage,
        activePersonaId: args.activePersonaId,
        sessionId: args.sessionId,
        iteration: args.iteration,
        nextContributionNeeded: args.nextContributionNeeded
      };
      
      sessionState.addCollaborativeSession(collaborativeData);
      
      // Get session context
      const stats = sessionState.getStats();
      const recentCollaborative = sessionState.getCollaborativeSessions().slice(-2);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            topic: args.topic,
            stage: args.stage,
            activePersonaId: args.activePersonaId,
            contributionsCount: args.contributions.length,
            nextContributionNeeded: args.nextContributionNeeded,
            status: 'success',
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalCollaborativeSessions: stats.stores.collaborative.count || 0,
              recentSessions: recentCollaborative.map((c: CollaborativeSession) => ({
                topic: c.topic,
                stage: c.stage,
                contributionsCount: c.contributions.length
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}