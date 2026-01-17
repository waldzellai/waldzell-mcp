/**
 * Waitlist Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

export function registerWaitlistTools(server: McpServer, client: YelpClient): void {
  // Waitlist Status Tool
  server.tool(
    'yelp_waitlist_status',
    'Get the current waitlist status and wait estimates for a business',
    {
      business_id: z.string().describe('The Yelp business ID'),
    },
    async (args) => {
      try {
        const result = await client.getWaitlistStatus(args.business_id);

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

  // Waitlist Info Tool
  server.tool(
    'yelp_waitlist_info',
    'Get waitlist configuration and operating hours for a business',
    {
      business_id: z.string().describe('The Yelp business ID'),
    },
    async (args) => {
      try {
        const result = await client.getWaitlistInfo(args.business_id);

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

  // Visit Details Tool
  server.tool(
    'yelp_visit_details',
    'Get details of a specific waitlist visit',
    {
      visit_id: z.string().describe('The visit ID'),
    },
    async (args) => {
      try {
        const result = await client.getVisitDetails(args.visit_id);

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

  // Partner Restaurants Tool
  server.tool(
    'yelp_partner_restaurants',
    'Find restaurants that support Yelp Waitlist in a location',
    {
      location: z.string().optional().describe('Location string'),
      latitude: z.number().optional().describe('Latitude'),
      longitude: z.number().optional().describe('Longitude'),
      radius: z.number().optional().describe('Search radius in meters'),
      limit: z.number().optional().describe('Number of results to return'),
      offset: z.number().optional().describe('Offset for pagination'),
    },
    async (args) => {
      try {
        const result = await client.getPartnerRestaurants({
          location: args.location,
          latitude: args.latitude,
          longitude: args.longitude,
          radius: args.radius,
          limit: args.limit,
          offset: args.offset,
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
}
