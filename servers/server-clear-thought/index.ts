#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

  // Export a function that creates the server for Smithery HTTP deployment
export default function({ sessionId, config }: { sessionId: string, config?: any }) {
  // Create a new server instance for each session
  const sessionServer = new McpServer({
    name: 'clear-thought',
    version: '0.0.5'
  });

  // Register all tools for this session
  // Sequential Thinking Tool
  sessionServer.tool(
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
      const { thoughtNumber, totalThoughts, nextThoughtNeeded } = args;
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            thoughtNumber,
            totalThoughts,
            status: 'success',
            nextThoughtNeeded,
            message: `Processed thought ${thoughtNumber}/${totalThoughts}`
          }, null, 2)
        }]
      };
    }
  );

  // Mental Model Tool
  sessionServer.tool(
  'mentalmodel',
  'Apply mental models to analyze problems systematically',
  {
    modelName: z.enum(['first_principles', 'opportunity_cost', 'error_propagation', 'rubber_duck', 'pareto_principle', 'occams_razor']).describe('Name of the mental model'),
    steps: z.array(z.string()).describe('Steps to apply the model'),
    conclusion: z.string().describe('Conclusions drawn')
  },
  async ({ modelName, steps, conclusion }) => {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          modelName,
          status: 'success',
          hasSteps: steps.length > 0,
          hasConclusion: !!conclusion
        }, null, 2)
      }]
    };
  }
  );

  // Debugging Approach Tool
  sessionServer.tool(
    'debuggingapproach',
    'Apply systematic debugging approaches to identify and resolve issues',
    {
      approachName: z.enum(['binary_search', 'reverse_engineering', 'divide_conquer', 'backtracking', 'cause_elimination', 'program_slicing']).describe('Debugging approach'),
      steps: z.array(z.string()).describe('Steps taken to debug'),
      resolution: z.string().describe('How the issue was resolved')
    },
    async ({ approachName, steps, resolution }) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            approachName,
            status: 'success',
            hasSteps: steps.length > 0,
            hasResolution: !!resolution
          }, null, 2)
        }]
      };
    }
  );

  // Collaborative Reasoning Tool
  sessionServer.tool(
    'collaborativereasoning',
    'Facilitate collaborative reasoning with multiple perspectives and personas',
    {
      topic: z.string(),
      personas: z.array(z.object({
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
      })),
      contributions: z.array(z.object({
        personaId: z.string(),
        content: z.string(),
        type: z.enum(['observation', 'question', 'insight', 'concern', 'suggestion', 'challenge', 'synthesis']),
        confidence: z.number().min(0).max(1),
        referenceIds: z.array(z.string()).optional()
      })),
      stage: z.enum(['problem-definition', 'ideation', 'critique', 'integration', 'decision', 'reflection']),
      activePersonaId: z.string(),
      sessionId: z.string(),
      iteration: z.number(),
      nextContributionNeeded: z.boolean()
    },
    async (args) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            topic: args.topic,
            stage: args.stage,
            activePersonaId: args.activePersonaId,
            contributionsCount: args.contributions.length,
            nextContributionNeeded: args.nextContributionNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Decision Framework Tool
  sessionServer.tool(
    'decisionframework',
    'Apply structured decision-making frameworks',
    {
      decisionStatement: z.string(),
      options: z.array(z.object({})),
      analysisType: z.string(),
      stage: z.string(),
      decisionId: z.string(),
      iteration: z.number(),
      nextStageNeeded: z.boolean()
    },
    async (args) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            decisionId: args.decisionId,
            stage: args.stage,
            analysisType: args.analysisType,
            optionsCount: args.options.length,
            nextStageNeeded: args.nextStageNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Metacognitive Monitoring Tool
  sessionServer.tool(
    'metacognitivemonitoring',
    'Monitor and assess thinking processes and knowledge',
    {
      task: z.string(),
      stage: z.string(),
      overallConfidence: z.number(),
      uncertaintyAreas: z.array(z.string()),
      recommendedApproach: z.string(),
      monitoringId: z.string(),
      iteration: z.number(),
      nextAssessmentNeeded: z.boolean()
    },
    async (args) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            task: args.task,
            stage: args.stage,
            overallConfidence: args.overallConfidence,
            uncertaintyCount: args.uncertaintyAreas.length,
            nextAssessmentNeeded: args.nextAssessmentNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Scientific Method Tool
  sessionServer.tool(
    'scientificmethod',
    'Apply scientific method for systematic inquiry',
    {
      stage: z.string(),
      inquiryId: z.string(),
      iteration: z.number(),
      nextStageNeeded: z.boolean()
    },
    async (args) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            inquiryId: args.inquiryId,
            stage: args.stage,
            iteration: args.iteration,
            nextStageNeeded: args.nextStageNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Structured Argumentation Tool
  sessionServer.tool(
    'structuredargumentation',
    'Construct and analyze structured arguments',
    {
      claim: z.string(),
      premises: z.array(z.string()),
      conclusion: z.string(),
      argumentType: z.string(),
      confidence: z.number(),
      nextArgumentNeeded: z.boolean()
    },
    async (args) => {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            claim: args.claim,
            premisesCount: args.premises.length,
            argumentType: args.argumentType,
            confidence: args.confidence,
            nextArgumentNeeded: args.nextArgumentNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Visual Reasoning Tool
  sessionServer.tool(
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
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            diagramId: args.diagramId,
            diagramType: args.diagramType,
            operation: args.operation,
            iteration: args.iteration,
            nextOperationNeeded: args.nextOperationNeeded,
            status: 'success'
          }, null, 2)
        }]
      };
    }
    );
  
    return sessionServer;
  }
  
