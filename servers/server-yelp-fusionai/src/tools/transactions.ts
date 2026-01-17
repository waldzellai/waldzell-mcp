/**
 * Transaction Search Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

export function registerTransactionTools(server: McpServer, client: YelpClient): void {
  // Food Delivery Search Tool
  server.tool(
    'yelp_delivery_search',
    'Search for businesses that support food delivery in a location',
    {
      location: z.string().optional().describe('Location (e.g., "NYC", "San Francisco, CA")'),
      latitude: z.number().optional().describe('Latitude of the location'),
      longitude: z.number().optional().describe('Longitude of the location'),
      term: z.string().optional().describe('Search term (e.g., "pizza", "sushi")'),
      categories: z.array(z.string()).optional().describe('Category filters'),
      price: z.array(z.number().min(1).max(4)).optional().describe('Price levels (1-4)'),
    },
    async (args) => {
      try {
        const result = await client.searchTransactions({
          transaction_type: 'delivery',
          location: args.location,
          latitude: args.latitude,
          longitude: args.longitude,
          term: args.term,
          categories: args.categories,
          price: args.price,
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

  // Service Offerings Tool
  server.tool(
    'yelp_service_offerings',
    'Get available service offerings for a business (delivery, pickup, etc.)',
    {
      business_id: z.string().describe('The Yelp business ID'),
      locale: z.string().optional().describe('Locale code (e.g., "en_US")'),
    },
    async (args) => {
      try {
        const result = await client.getServiceOfferings(args.business_id, args.locale);

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
