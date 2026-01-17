/**
 * Tool Registry - Registers all Yelp tools with the MCP server
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { YelpClient } from '../yelp-client/index.js';

import { registerBusinessTools } from './business.js';
import { registerReviewsTools } from './reviews.js';
import { registerAIChatTools } from './ai-chat.js';
import { registerEventsTools } from './events.js';
import { registerAutocompleteTools } from './autocomplete.js';
import { registerCategoriesTools } from './categories.js';
import { registerTransactionTools } from './transactions.js';
import { registerInsightsTools } from './insights.js';
import { registerWaitlistTools } from './waitlist.js';
import { registerReservationTools } from './reservations.js';

/**
 * Register all Yelp Fusion API tools with the MCP server
 */
export function registerAllTools(server: McpServer, client: YelpClient): void {
  // P0: Core Business APIs
  registerBusinessTools(server, client);
  registerReviewsTools(server, client);
  registerAIChatTools(server, client);

  // P1: Additional APIs
  registerEventsTools(server, client);
  registerAutocompleteTools(server, client);

  // P2: Categories
  registerCategoriesTools(server, client);

  // v3 Extended APIs
  registerTransactionTools(server, client);
  registerInsightsTools(server, client);
  registerWaitlistTools(server, client);
  registerReservationTools(server, client);
}

// Re-export individual registrations for selective use
export { registerBusinessTools } from './business.js';
export { registerReviewsTools } from './reviews.js';
export { registerAIChatTools } from './ai-chat.js';
export { registerEventsTools } from './events.js';
export { registerAutocompleteTools } from './autocomplete.js';
export { registerCategoriesTools } from './categories.js';
export { registerTransactionTools } from './transactions.js';
export { registerInsightsTools } from './insights.js';
export { registerWaitlistTools } from './waitlist.js';
export { registerReservationTools } from './reservations.js';
