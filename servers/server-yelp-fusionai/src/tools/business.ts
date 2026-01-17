/**
 * Business Search and Details Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_SEARCH_TOOL = {
  name: 'yelp_search',
  description: `Search for businesses on Yelp by location and search term. Returns a list of businesses matching the search criteria with ratings, reviews, categories, and location information.

Use this to find restaurants, shops, services, and other businesses in a specific area.

Example queries:
- "pizza in New York"
- "coffee shops near me" (requires latitude/longitude)
- "best rated sushi in San Francisco"`,
  inputSchema: z.object({
    term: z.string().optional().describe('Search term (e.g., "food", "restaurants", "coffee")'),
    location: z.string().optional().describe('Location (e.g., "NYC", "350 5th Ave, New York, NY 10118")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    radius: z.number().max(40000).optional().describe('Search radius in meters (max 40000)'),
    categories: z.string().optional().describe('Category aliases to filter by (comma-separated)'),
    price: z.string().optional().describe('Price levels to filter (1-4, comma-separated)'),
    open_now: z.boolean().optional().describe('Only show businesses open now'),
    sort_by: z.enum(['best_match', 'rating', 'review_count', 'distance']).optional()
      .describe('Sort results by: best_match, rating, review_count, or distance'),
    limit: z.number().max(50).optional().describe('Number of results (max 50)'),
    offset: z.number().optional().describe('Offset for pagination'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_PHONE_SEARCH_TOOL = {
  name: 'yelp_phone_search',
  description: `Find a business by its phone number. Useful when you have a phone number and need to look up the business details.

The phone number should be in E.164 format (e.g., +14159083801).`,
  inputSchema: z.object({
    phone: z.string().describe('Phone number in E.164 format (e.g., +14159083801)'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_BUSINESS_MATCH_TOOL = {
  name: 'yelp_business_match',
  description: `Match a business to Yelp's database using its name and address. Useful when you have business details and want to find the corresponding Yelp listing.`,
  inputSchema: z.object({
    name: z.string().describe('Business name'),
    address1: z.string().describe('Street address'),
    city: z.string().describe('City'),
    state: z.string().describe('Two-letter state code'),
    country: z.string().describe('Two-letter country code'),
    postal_code: z.string().optional().describe('Postal/ZIP code'),
    phone: z.string().optional().describe('Phone number'),
    latitude: z.number().optional().describe('Latitude'),
    longitude: z.number().optional().describe('Longitude'),
    match_threshold: z.enum(['none', 'default', 'strict']).optional()
      .describe('Match strictness: none, default, or strict'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_BUSINESS_DETAILS_TOOL = {
  name: 'yelp_business_details',
  description: `Get detailed information about a specific business by its Yelp business ID.

Returns comprehensive details including hours, photos, reviews, special hours, and more.`,
  inputSchema: z.object({
    business_id: z.string().describe('Yelp business ID (e.g., "north-india-restaurant-san-francisco")'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerBusinessTools(server: McpServer, client: YelpClient): void {
  // Search businesses
  server.registerTool(
    YELP_SEARCH_TOOL.name,
    {
      description: YELP_SEARCH_TOOL.description,
      inputSchema: YELP_SEARCH_TOOL.inputSchema,
      annotations: YELP_SEARCH_TOOL.annotations,
    },
    async (args) => {
      const result = await client.searchBusinesses(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Phone search
  server.registerTool(
    YELP_PHONE_SEARCH_TOOL.name,
    {
      description: YELP_PHONE_SEARCH_TOOL.description,
      inputSchema: YELP_PHONE_SEARCH_TOOL.inputSchema,
      annotations: YELP_PHONE_SEARCH_TOOL.annotations,
    },
    async (args) => {
      const result = await client.searchByPhone(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Business match
  server.registerTool(
    YELP_BUSINESS_MATCH_TOOL.name,
    {
      description: YELP_BUSINESS_MATCH_TOOL.description,
      inputSchema: YELP_BUSINESS_MATCH_TOOL.inputSchema,
      annotations: YELP_BUSINESS_MATCH_TOOL.annotations,
    },
    async (args) => {
      const result = await client.matchBusiness(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Business details
  server.registerTool(
    YELP_BUSINESS_DETAILS_TOOL.name,
    {
      description: YELP_BUSINESS_DETAILS_TOOL.description,
      inputSchema: YELP_BUSINESS_DETAILS_TOOL.inputSchema,
      annotations: YELP_BUSINESS_DETAILS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getBusinessDetails(args.business_id, args.locale);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
