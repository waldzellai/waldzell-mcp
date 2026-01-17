/**
 * Autocomplete Tool
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_AUTOCOMPLETE_TOOL = {
  name: 'yelp_autocomplete',
  description: `Get autocomplete suggestions for search terms, businesses, and categories. Useful for building search interfaces or suggesting completions.

Returns three types of suggestions:
- terms: Search term completions
- businesses: Matching business names
- categories: Matching category names`,
  inputSchema: z.object({
    text: z.string().describe('Text to autocomplete'),
    latitude: z.number().optional().describe('Latitude for location-based results'),
    longitude: z.number().optional().describe('Longitude for location-based results'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerAutocompleteTools(server: McpServer, client: YelpClient): void {
  server.registerTool(
    YELP_AUTOCOMPLETE_TOOL.name,
    {
      description: YELP_AUTOCOMPLETE_TOOL.description,
      inputSchema: YELP_AUTOCOMPLETE_TOOL.inputSchema,
      annotations: YELP_AUTOCOMPLETE_TOOL.annotations,
    },
    async (args) => {
      const result = await client.autocomplete(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
