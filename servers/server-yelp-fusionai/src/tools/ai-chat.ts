/**
 * AI Chat Tool
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_AI_CHAT_TOOL = {
  name: 'yelp_ai_chat',
  description: `Have a conversation with Yelp's AI assistant about local businesses. The AI can help find businesses, answer questions about them, and provide recommendations.

This is a conversational interface - you can ask follow-up questions by providing the same conversation_id.

Example queries:
- "What's a good Italian restaurant for a date night in the Marina?"
- "Tell me more about their menu" (with conversation_id from previous response)
- "Are there any good coffee shops near Union Square that have outdoor seating?"`,
  inputSchema: z.object({
    query: z.string().describe('Your question or request about local businesses'),
    location: z.string().optional().describe('Location context (e.g., "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude for location context'),
    longitude: z.number().optional().describe('Longitude for location context'),
    conversation_id: z.string().optional()
      .describe('Conversation ID from a previous response for follow-up questions'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: false },
};

export const YELP_AI_CHAT_STREAM_TOOL = {
  name: 'yelp_ai_chat_stream',
  description: `Have a streaming conversation with Yelp's AI assistant. Same as yelp_ai_chat but returns responses in chunks as they're generated.

Use this for longer responses or when you want to start processing the response before it's complete.`,
  inputSchema: z.object({
    query: z.string().describe('Your question or request about local businesses'),
    location: z.string().optional().describe('Location context (e.g., "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude for location context'),
    longitude: z.number().optional().describe('Longitude for location context'),
    conversation_id: z.string().optional()
      .describe('Conversation ID from a previous response for follow-up questions'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: false },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerAIChatTools(server: McpServer, client: YelpClient): void {
  // Non-streaming AI Chat
  server.registerTool(
    YELP_AI_CHAT_TOOL.name,
    {
      description: YELP_AI_CHAT_TOOL.description,
      inputSchema: YELP_AI_CHAT_TOOL.inputSchema,
      annotations: YELP_AI_CHAT_TOOL.annotations,
    },
    async (args) => {
      const result = await client.chat(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Streaming AI Chat
  server.registerTool(
    YELP_AI_CHAT_STREAM_TOOL.name,
    {
      description: YELP_AI_CHAT_STREAM_TOOL.description,
      inputSchema: YELP_AI_CHAT_STREAM_TOOL.inputSchema,
      annotations: YELP_AI_CHAT_STREAM_TOOL.annotations,
    },
    async (args) => {
      // Collect streaming response into a single result
      const chunks: string[] = [];
      const businesses: unknown[] = [];
      let conversationId = '';

      for await (const chunk of client.chatStream(args)) {
        switch (chunk.type) {
          case 'text':
            if (chunk.content) {
              chunks.push(chunk.content);
            }
            break;
          case 'business':
            if (chunk.business) {
              businesses.push(chunk.business);
            }
            break;
          case 'end':
            if (chunk.conversation_id) {
              conversationId = chunk.conversation_id;
            }
            break;
        }
      }

      const result = {
        response: chunks.join(''),
        conversation_id: conversationId,
        businesses: businesses.length > 0 ? businesses : undefined,
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
