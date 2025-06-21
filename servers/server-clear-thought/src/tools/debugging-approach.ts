import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';
import type { DebuggingApproachData } from '../types/index.js';

export function registerDebuggingApproach(server: McpServer, sessionState: SessionState) {
  server.tool(
    'debuggingapproach',
    'Apply systematic debugging approaches to identify and resolve issues',
    {
      approachName: z.enum([
        'binary_search',
        'reverse_engineering',
        'divide_conquer',
        'backtracking',
        'cause_elimination',
        'program_slicing',
        'log_analysis',
        'static_analysis',
        'root_cause_analysis',
        'delta_debugging',
        'fuzzing',
        'incremental_testing'
      ]).describe('Debugging approach'),
      issue: z.string().describe('Description of the issue being debugged'),
      steps: z.array(z.string()).describe('Steps taken to debug'),
      findings: z.string().describe('Findings discovered during debugging'),
      resolution: z.string().describe('How the issue was resolved')
    },
    async (args) => {
      const debugData: DebuggingApproachData = {
        approachName: args.approachName,
        issue: args.issue,
        steps: args.steps,
        findings: args.findings,
        resolution: args.resolution
      };
      
      sessionState.addDebuggingSession(debugData);
      
      // Get session context
      const stats = sessionState.getStats();
      const recentDebugging = sessionState.getDebuggingSessions().slice(-3);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...debugData,
            status: 'success',
            hasSteps: args.steps.length > 0,
            hasResolution: !!args.resolution,
            sessionContext: {
              sessionId: sessionState.sessionId,
              totalDebuggingApproaches: stats.stores.debugging.count || 0,
              recentApproaches: recentDebugging.map(d => ({
                approachName: d.approachName,
                resolved: !!d.resolution
              }))
            }
          }, null, 2)
        }]
      };
    }
  );
}