import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { SessionState } from '../state/SessionState.js';

export function registerSessionManagement(server: McpServer, sessionState: SessionState) {
  // Session Info Tool
  server.tool(
    'session_info',
    'Get information about the current session including statistics and recent activity',
    {},
    async () => {
      const stats = sessionState.getStats();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sessionId: stats.sessionId,
            createdAt: stats.createdAt,
            lastAccessedAt: stats.lastAccessedAt,
            stats,
            status: 'success'
          }, null, 2)
        }]
      };
    }
  );

  // Session Export Tool
  server.tool(
    'session_export',
    'Export the entire session state for backup or sharing',
    {
      format: z.enum(['json', 'summary']).optional().describe('Export format (default: json)')
    },
    async (args) => {
      const format = args.format || 'json';
      
      if (format === 'json') {
        const exportData = sessionState.export();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(exportData, null, 2)
          }]
        };
      } else {
        // Summary format
        const stats = sessionState.getStats();
        let summary = `Session Summary: ${sessionState.sessionId}\n`;
        summary += `Created: ${stats.createdAt.toISOString()}\n`;
        summary += `Last Activity: ${stats.lastAccessedAt.toISOString()}\n\n`;
        summary += `Statistics:\n`;
        summary += `- Total Thoughts: ${stats.thoughtCount}\n`;
        summary += `- Tools Used: ${stats.toolsUsed.join(', ')}\n`;
        summary += `- Total Operations: ${stats.totalOperations}\n`;
        summary += `- Remaining Thoughts: ${stats.remainingThoughts}\n`;
        summary += `- Active: ${stats.isActive}\n\n`;
        summary += `Store Statistics:\n`;
        summary += `- Thoughts: ${JSON.stringify(stats.stores.thoughts)}\n`;
        summary += `- Mental Models: ${JSON.stringify(stats.stores.mentalModels)}\n`;
        summary += `- Debugging: ${JSON.stringify(stats.stores.debugging)}\n`;
        summary += `- Collaborative: ${JSON.stringify(stats.stores.collaborative)}\n`;
        summary += `- Decisions: ${JSON.stringify(stats.stores.decisions)}\n`;
        summary += `- Metacognitive: ${JSON.stringify(stats.stores.metacognitive)}\n`;
        summary += `- Scientific: ${JSON.stringify(stats.stores.scientific)}\n`;
        summary += `- Creative: ${JSON.stringify(stats.stores.creative)}\n`;
        summary += `- Systems: ${JSON.stringify(stats.stores.systems)}\n`;
        summary += `- Visual: ${JSON.stringify(stats.stores.visual)}\n`;
        
        return {
          content: [{
            type: 'text',
            text: summary
          }]
        };
      }
    }
  );

  // Session Import Tool
  server.tool(
    'session_import',
    'Import a previously exported session state',
    {
      sessionData: z.string().describe('JSON string of exported session data'),
      merge: z.boolean().optional().describe('Whether to merge with existing session data (default: false)')
    },
    async (args) => {
      try {
        const importData = JSON.parse(args.sessionData);
        const merge = args.merge || false;
        
        if (!merge) {
          // Clear existing data before import
          sessionState.cleanup();
        }
        
        sessionState.import(importData);
        
        const stats = sessionState.getStats();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              message: merge ? 'Session data merged successfully' : 'Session data imported successfully',
              sessionId: sessionState.sessionId,
              stats
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to import session data'
            }, null, 2)
          }]
        };
      }
    }
  );
}