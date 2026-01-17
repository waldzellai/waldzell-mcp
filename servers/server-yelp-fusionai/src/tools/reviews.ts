/**
 * Reviews Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

// =============================================================================
// Tool Definitions
// =============================================================================

export const YELP_REVIEWS_TOOL = {
  name: 'yelp_reviews',
  description: `Get reviews for a specific business. Returns up to 50 reviews with text, rating, and user information.

Reviews are a great way to understand customer experiences and sentiment about a business.`,
  inputSchema: z.object({
    business_id: z.string().describe('Yelp business ID'),
    locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
    sort_by: z.enum(['yelp_sort', 'newest', 'oldest', 'elites']).optional()
      .describe('Sort order: yelp_sort (default), newest, oldest, or elites'),
    limit: z.number().max(50).optional().describe('Number of reviews (max 50)'),
    offset: z.number().optional().describe('Offset for pagination'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

export const YELP_REVIEW_HIGHLIGHTS_TOOL = {
  name: 'yelp_review_highlights',
  description: `Get highlighted snippets from reviews for a business. These are the most notable and representative excerpts that capture key customer experiences.

Useful for quickly understanding what customers commonly mention about a business.`,
  inputSchema: z.object({
    business_id: z.string().describe('Yelp business ID'),
  }),
  annotations: { readOnlyHint: true, idempotentHint: true },
};

// =============================================================================
// Tool Registration
// =============================================================================

export function registerReviewsTools(server: McpServer, client: YelpClient): void {
  // Reviews
  server.registerTool(
    YELP_REVIEWS_TOOL.name,
    {
      description: YELP_REVIEWS_TOOL.description,
      inputSchema: YELP_REVIEWS_TOOL.inputSchema,
      annotations: YELP_REVIEWS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getReviews(args);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  // Review highlights
  server.registerTool(
    YELP_REVIEW_HIGHLIGHTS_TOOL.name,
    {
      description: YELP_REVIEW_HIGHLIGHTS_TOOL.description,
      inputSchema: YELP_REVIEW_HIGHLIGHTS_TOOL.inputSchema,
      annotations: YELP_REVIEW_HIGHLIGHTS_TOOL.annotations,
    },
    async (args) => {
      const result = await client.getReviewHighlights(args.business_id);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );
}
