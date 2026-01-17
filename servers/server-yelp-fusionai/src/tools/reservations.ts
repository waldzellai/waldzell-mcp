/**
 * Reservations Tools
 */

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

export function registerReservationTools(server: McpServer, client: YelpClient): void {
  // Reservation Openings Tool
  server.tool(
    'yelp_reservation_openings',
    'Get available reservation times for a restaurant',
    {
      business_id_or_alias: z.string().describe('Business ID or alias'),
      covers: z.number().min(1).max(10).describe('Number of people (1-10)'),
      date: z.string().describe('Date in YYYY-MM-DD format'),
      time: z.string().describe('Time in HH:MM format'),
      get_covers_range: z.boolean().optional().describe('Include party size range info'),
    },
    async (args) => {
      try {
        const result = await client.getReservationOpenings({
          business_id_or_alias: args.business_id_or_alias,
          covers: args.covers,
          date: args.date,
          time: args.time,
          get_covers_range: args.get_covers_range,
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

  // Reservation Status Tool
  server.tool(
    'yelp_reservation_status',
    'Get the status of a reservation',
    {
      reservation_id: z.string().describe('The reservation ID'),
    },
    async (args) => {
      try {
        const result = await client.getReservationStatus(args.reservation_id);

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
