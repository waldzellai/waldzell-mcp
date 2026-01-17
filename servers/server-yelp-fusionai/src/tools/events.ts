/**
 * Events Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_EVENTS_TOOL = {
  name: 'yelp_events',
  description: `Search for events on Yelp. Find concerts, festivals, food & drink events, and more happening in a specific area.`,
  inputSchema: z.object({
    location: z.string().optional().describe('Location (e.g., "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    radius: z.number().optional().describe('Search radius in meters'),
    categories: z.string().optional().describe('Event categories (comma-separated)'),
    is_free: z.boolean().optional().describe('Only show free events'),
    start_date: z.number().optional().describe('Events starting after this Unix timestamp'),
    end_date: z.number().optional().describe('Events starting before this Unix timestamp'),
    sort_by: z.enum(['desc', 'asc']).optional().describe('Sort direction'),
    sort_on: z.enum(['popularity', 'time_start']).optional().describe('Sort by popularity or start time'),
    limit: z.number().max(50).optional().describe('Number of results (max 50)'),
    offset: z.number().optional().describe('Offset for pagination'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_EVENT_DETAILS_TOOL = {
  name: 'yelp_event_details',
  description: `Get detailed information about a specific event by its Yelp event ID.`,
  inputSchema: z.object({
    event_id: z.string().describe('Yelp event ID'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_FEATURED_EVENT_TOOL = {
  name: 'yelp_featured_event',
  description: `Get the featured event for a location. Yelp highlights notable upcoming events in each area.`,
  inputSchema: z.object({
    location: z.string().optional().describe('Location (e.g., "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerEventsTools(server: McpServer, client: YelpClient): void {
  // Search events
  server.registerTool(
    YELP_EVENTS_TOOL.name,
    {
      description: YELP_EVENTS_TOOL.description,
      inputSchema: YELP_EVENTS_TOOL.inputSchema,
      annotations: YELP_EVENTS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.searchEvents(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Event details
  server.registerTool(
    YELP_EVENT_DETAILS_TOOL.name,
    {
      description: YELP_EVENT_DETAILS_TOOL.description,
      inputSchema: YELP_EVENT_DETAILS_TOOL.inputSchema,
      annotations: YELP_EVENT_DETAILS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getEventDetails(args.event_id, args.locale);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Featured event
  server.registerTool(
    YELP_FEATURED_EVENT_TOOL.name,
    {
      description: YELP_FEATURED_EVENT_TOOL.description,
      inputSchema: YELP_FEATURED_EVENT_TOOL.inputSchema,
      annotations: YELP_FEATURED_EVENT_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getFeaturedEvent(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
