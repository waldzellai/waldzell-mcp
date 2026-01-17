/**
 * Categories Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_CATEGORIES_TOOL = {
  name: 'yelp_categories',
  description: `Get all Yelp business categories. Categories are hierarchical and can be used to filter business searches.

Returns category aliases and titles that can be used with the yelp_search tool's categories parameter.`,
  inputSchema: z.object({
    locale: z.string().optional().describe('Locale code (e.g., "en_US") for localized category names'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_CATEGORY_DETAILS_TOOL = {
  name: 'yelp_category_details',
  description: `Get details about a specific category including its parent categories and country availability.`,
  inputSchema: z.object({
    alias: z.string().describe('Category alias (e.g., "pizza", "italian")'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerCategoriesTools(server: McpServer, client: YelpClient): void {
  // All categories
  server.registerTool(
    YELP_CATEGORIES_TOOL.name,
    {
      description: YELP_CATEGORIES_TOOL.description,
      inputSchema: YELP_CATEGORIES_TOOL.inputSchema,
      annotations: YELP_CATEGORIES_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getAllCategories(args.locale);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Category details
  server.registerTool(
    YELP_CATEGORY_DETAILS_TOOL.name,
    {
      description: YELP_CATEGORY_DETAILS_TOOL.description,
      inputSchema: YELP_CATEGORY_DETAILS_TOOL.inputSchema,
      annotations: YELP_CATEGORY_DETAILS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getCategoryDetails(args.alias, args.locale);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
