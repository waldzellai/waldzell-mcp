/**
 * Business Insights Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

export function registerInsightsTools(server: McpServer, client: YelpClient): void {
  // Engagement Metrics Tool
  server.tool(
    'yelp_engagement_metrics',
    'Get engagement metrics (impressions, leads, calls, etc.) for businesses',
    {
      business_ids: z.string().describe('Comma-separated list of business IDs (max 50)'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
    },
    async (args) => {
      try {
        const result = await client.getEngagementMetrics({
          business_ids: args.business_ids,
          start_date: args.start_date,
          end_date: args.end_date,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Business Insights Tool
  server.tool(
    'yelp_business_insights',
    'Get insights data for businesses',
    {
      business_ids: z.string().describe('Comma-separated list of business IDs'),
      locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
    },
    async (args) => {
      try {
        const result = await client.getBusinessInsights({
          business_ids: args.business_ids,
          locale: args.locale,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Food & Drinks Insights Tool
  server.tool(
    'yelp_food_drinks_insights',
    'Get popular dishes and drinks insights for a business',
    {
      business_id: z.string().describe('The Yelp business ID'),
      locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
    },
    async (args) => {
      try {
        const result = await client.getFoodDrinksInsights(args.business_id, args.locale);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Risk Signals Insights Tool
  server.tool(
    'yelp_risk_signals',
    'Get risk signal insights for a business (potential issues or concerns)',
    {
      business_id: z.string().describe('The Yelp business ID'),
      locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
    },
    async (args) => {
      try {
        const result = await client.getRiskSignalsInsights(args.business_id, args.locale);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
