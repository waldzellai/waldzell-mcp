import { z } from 'zod';
import { McpServer } from '../typescript-sdk/src/server/mcp';
import { CallToolResult } from '../typescript-sdk/src/types';
import yelpService, { YelpAIResponse } from './services/yelp';
import {
  GetAccessTokenResponse,
  GetBusinessesResponse,
  BusinessOwnerInfo,
  RespondToReviewResponse
} from './services/api/respond-reviews';

/**
 * Helper function to start the MCP server on a specific port
 * @param port Port number to listen on (default: 3000)
 * @returns The server instance
 */
export function startServer(port = 3000) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`Yelp Fusion MCP server running on port ${port}`);
  });
  return server;
}

/**
 * Create a new MCP server instance without starting it
 * @returns The configured MCP server instance
 */
export function createServer() {
  // Define our implementation
  const server = new McpServer({
  name: 'yelp-fusionai-mcp',
  version: '0.1.0',
}, {
  // Optional server options
  instructions: `
    This server provides tools to interact with the Yelp Fusion API, allowing you to search for businesses, events, and more.
    
    Available tools:
    
    Business and Review Tools:
    - yelpQuery: Search using natural language (AI-powered)
    - yelpBusinessSearch: Parameter-based business search
    - yelpBusinessDetails: Get detailed information about a specific business by ID
    - yelpBusinessReviews: Get reviews for a specific business
    - yelpReviewHighlights: Get highlighted snippets from reviews for a business
    - yelpCategories: Get a list of all Yelp business categories
    
    Event Tools:
    - yelpEventsSearch: Search for events in a location
    - yelpEventDetails: Get detailed information about a specific event by ID
    - yelpFeaturedEvent: Get the featured event for a location
    
    Advertising Tools:
    - yelpCreateAdProgram: Create a new advertising program
    - yelpListAdPrograms: List all advertising programs
    - yelpGetAdProgram: Get details of a specific advertising program
    - yelpModifyAdProgram: Modify an existing advertising program
    - yelpAdProgramStatus: Get status information for an advertising program
    - yelpPauseAdProgram: Pause an active advertising program
    - yelpResumeAdProgram: Resume a paused advertising program
    - yelpTerminateAdProgram: Terminate an advertising program
    
    OAuth Tools:
    - yelpGetOAuthToken: Get an OAuth access token (v2 or v3)
    - yelpRefreshOAuthToken: Refresh an OAuth v3 access token
    - yelpRevokeOAuthToken: Revoke an OAuth access token
    - yelpGetOAuthTokenInfo: Get information about an OAuth token
    
    Waitlist Tools:
    - yelpWaitlistPartnerRestaurants: Get restaurants that support Yelp Waitlist
    - yelpWaitlistStatus: Get current waitlist status for a business
    - yelpWaitlistInfo: Get detailed waitlist configuration for a business
    - yelpJoinWaitlist: Join a restaurant's waitlist remotely
    
    Respond to Reviews Tools:
    - yelpRespondReviewsGetToken: Get an OAuth access token for responding to reviews
    - yelpRespondReviewsBusinesses: Get businesses that the user can respond to reviews for
    - yelpRespondReviewsBusinessOwner: Get business owner information
    - yelpRespondToReview: Respond to a review as a business owner
    - yelpOnMyWay: Notify a restaurant that you're on your way
    - yelpCancelWaitlistVisit: Cancel a waitlist visit
    - yelpWaitlistVisitDetails: Get details about a waitlist visit
    
    Example usage:
    - Use yelpQuery with "Find pizza places in Chicago" for natural language search
    - Use yelpBusinessSearch with parameters like location, term, price, etc. for more specific searches
    - Use yelpBusinessDetails to get detailed information about a business after finding its ID
    - Use yelpBusinessReviews to read customer reviews for a business
    - Use yelpReviewHighlights to get key highlights from reviews, filtered by sentiment or category
    - Use yelpCategories to explore all available business categories
    - Use yelpEventsSearch to find events in a specific area with filters like date, category, etc.
    - Use yelpEventDetails to get comprehensive information about a specific event
    - Use yelpFeaturedEvent to discover the most prominent event in a location
    - Use yelpCreateAdProgram to create a new advertising program for a business
    - Use yelpListAdPrograms to see all advertising programs for a business
    - Use yelpAdProgramStatus to get the current status of an advertising program
    - Use yelpGetOAuthToken to obtain an access token for API authentication
    - Use yelpRefreshOAuthToken to get a new token when the current one expires
    - Use yelpRevokeOAuthToken to invalidate an access token for security
    - Use yelpWaitlistPartnerRestaurants to find restaurants that support waitlists
    - Use yelpJoinWaitlist to remotely join a restaurant's waitlist
    - Use yelpWaitlistVisitDetails to check your position in the waitlist
  `
});

// Register Yelp AI tool - natural language search
server.tool(
  'yelpQuery',
  'Search for businesses and get recommendations using natural language via the Yelp Fusion AI API',
  {
    query: z.string().describe('Your natural language query about businesses, locations, or recommendations'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response: YelpAIResponse = await yelpService.chat(args.query);
      
      // Convert Yelp response to tool result
      return {
        content: [
          {
            type: 'text',
            text: formatYelpResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error querying Yelp API:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error querying Yelp API: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Business Search tool - traditional parameter-based search
server.tool(
  'yelpBusinessSearch',
  'Search for businesses using specific parameters via the Yelp Fusion API',
  {
    term: z.string().optional().describe('Search term (e.g. "food", "restaurants")'),
    location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    radius: z.number().optional().describe('Search radius in meters (max 40000)'),
    categories: z.string().optional().describe('Comma-separated list of categories'),
    locale: z.string().optional().describe('Locale (default: en_US)'),
    limit: z.number().optional().describe('Number of results (default: 20, max: 50)'),
    offset: z.number().optional().describe('Offset for pagination'),
    sort_by: z.enum(['best_match', 'rating', 'review_count', 'distance']).optional().describe('Sorting mode'),
    price: z.string().optional().describe('Pricing levels to filter by (1, 2, 3, 4)'),
    open_now: z.boolean().optional().describe('Filter for open businesses'),
    open_at: z.number().optional().describe('Filter for businesses open at this Unix time'),
    attributes: z.string().optional().describe('Additional attributes (e.g. "hot_and_new,reservation")'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.business.search(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatBusinessSearchResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error searching businesses:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching businesses: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Business Details tool
server.tool(
  'yelpBusinessDetails',
  'Get detailed information about a specific business by ID',
  {
    id: z.string().describe('The Yelp business ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.business.getBusinessDetails(args.id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatBusinessDetailsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting business details:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting business details: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Reviews tool
server.tool(
  'yelpBusinessReviews',
  'Get reviews for a specific business by ID or alias',
  {
    id: z.string().describe('The Yelp business ID or alias'),
    locale: z.string().optional().describe('Language of the reviews (e.g., "en_US", "fr_FR")'),
    sort_by: z.enum(['yelp_sort', 'newest', 'ratings_asc', 'ratings_desc', 'elites']).optional()
      .describe('Sort order: yelp_sort (default), newest, ratings_asc, ratings_desc, elites'),
    limit: z.number().min(1).max(50).optional()
      .describe('Number of reviews to return (default: 3, max: 50)'),
    offset: z.number().min(0).optional()
      .describe('Offset for pagination')
  },
  async (args): Promise<CallToolResult> => {
    try {
      const { id, ...params } = args;
      const response = await yelpService.reviews.getBusinessReviews(id, params);
      
      return {
        content: [
          {
            type: 'text',
            text: formatReviewsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting business reviews:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting business reviews: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Review Highlights tool
server.tool(
  'yelpReviewHighlights',
  'Get highlighted snippets from reviews for a specific business',
  {
    id: z.string().describe('The Yelp business ID or alias'),
    locale: z.string().optional().describe('Language of the review highlights (e.g., "en_US", "fr_FR")'),
    limit: z.number().min(1).max(10).optional()
      .describe('Number of review highlights to return (default: 5, max: 10)'),
    category: z.string().optional()
      .describe('Filter highlights by category (e.g., "service", "ambience", "food")'),
    sentiment: z.enum(['positive', 'negative', 'all']).optional()
      .describe('Filter highlights by sentiment: positive, negative, or all (default)')
  },
  async (args): Promise<CallToolResult> => {
    try {
      const { id, ...params } = args;
      const response = await yelpService.reviews.getReviewHighlights(id, params);
      
      return {
        content: [
          {
            type: 'text',
            text: formatReviewHighlightsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting review highlights:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting review highlights: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Categories tool
server.tool(
  'yelpCategories',
  'Get a list of business categories supported by Yelp',
  {},
  async (): Promise<CallToolResult> => {
    try {
      const response = await yelpService.categories.getAll();
      
      return {
        content: [
          {
            type: 'text',
            text: formatCategoriesResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting categories:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting categories: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Events Search tool
server.tool(
  'yelpEventsSearch',
  'Search for events via the Yelp Fusion API',
  {
    locale: z.string().optional().describe('Locale (default: en_US)'),
    limit: z.number().optional().describe('Number of results (default: 20, max: 50)'),
    offset: z.number().optional().describe('Offset for pagination'),
    sort_by: z.enum(['popularity', 'time_start']).optional().describe('Sorting mode'),
    sort_on: z.string().optional().describe('Sort on a specific field'),
    start_date: z.number().optional().describe('Start date Unix timestamp'),
    end_date: z.number().optional().describe('End date Unix timestamp'),
    categories: z.string().optional().describe('Comma-separated list of categories'),
    is_free: z.boolean().optional().describe('Filter for free events'),
    location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    radius: z.number().optional().describe('Search radius in meters'),
    excluded_events: z.string().optional().describe('Comma-separated list of event IDs to exclude'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.events.search(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatEventsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error searching events:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error searching events: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Event Details tool
server.tool(
  'yelpEventDetails',
  'Get detailed information about a specific event by ID',
  {
    id: z.string().describe('The Yelp event ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.events.getEvent(args.id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatEventDetailsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting event details:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting event details: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Featured Event tool
server.tool(
  'yelpFeaturedEvent',
  'Get the featured event for a location',
  {
    locale: z.string().optional().describe('Locale (default: en_US)'),
    location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.events.getFeaturedEvent(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatFeaturedEventResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting featured event:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting featured event: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Create Advertising Program tool
server.tool(
  'yelpCreateAdProgram',
  'Create a new advertising program',
  {
    business_id: z.string().describe('Business ID to advertise'),
    budget: z.number().describe('Budget amount in cents'),
    objectives: z.array(z.string()).describe('Advertising objectives'),
    ad_type: z.string().optional().describe('Type of advertisement'),
    geo_targeting: z.object({
      radius: z.number().optional().describe('Target radius in meters'),
      latitude: z.number().optional().describe('Latitude coordinate'),
      longitude: z.number().optional().describe('Longitude coordinate'),
      location: z.string().optional().describe('Location name'),
    }).optional().describe('Geographic targeting settings'),
    config: z.record(z.any()).optional().describe('Additional configuration options'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.createProgram(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error creating advertising program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error creating advertising program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register List Advertising Programs tool
server.tool(
  'yelpListAdPrograms',
  'List advertising programs',
  {
    business_id: z.string().optional().describe('Filter by business ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.listPrograms(args.business_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramListResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error listing advertising programs:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error listing advertising programs: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Get Advertising Program tool
server.tool(
  'yelpGetAdProgram',
  'Get details of an advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.getProgram(args.program_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting advertising program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting advertising program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Modify Advertising Program tool
server.tool(
  'yelpModifyAdProgram',
  'Modify an existing advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
    budget: z.number().optional().describe('Updated budget amount in cents'),
    objectives: z.array(z.string()).optional().describe('Updated advertising objectives'),
    ad_type: z.string().optional().describe('Updated type of advertisement'),
    geo_targeting: z.object({
      radius: z.number().optional().describe('Target radius in meters'),
      latitude: z.number().optional().describe('Latitude coordinate'),
      longitude: z.number().optional().describe('Longitude coordinate'),
      location: z.string().optional().describe('Location name'),
    }).optional().describe('Updated geographic targeting settings'),
    config: z.record(z.any()).optional().describe('Updated configuration options'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const { program_id, ...data } = args;
      const response = await yelpService.advertising.modifyProgram(program_id, data);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error modifying advertising program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error modifying advertising program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Program Status tool
server.tool(
  'yelpAdProgramStatus',
  'Get status of an advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.getProgramStatus(args.program_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramStatusResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting program status:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting program status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Pause Program tool
server.tool(
  'yelpPauseAdProgram',
  'Pause an advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.pauseProgram(args.program_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response, 'Program has been paused successfully.'),
          },
        ],
      };
    } catch (error) {
      console.error('Error pausing program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error pausing program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Resume Program tool
server.tool(
  'yelpResumeAdProgram',
  'Resume a paused advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.resumeProgram(args.program_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response, 'Program has been resumed successfully.'),
          },
        ],
      };
    } catch (error) {
      console.error('Error resuming program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error resuming program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Terminate Program tool
server.tool(
  'yelpTerminateAdProgram',
  'Terminate an advertising program',
  {
    program_id: z.string().describe('The advertising program ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.advertising.terminateProgram(args.program_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatProgramResponse(response, 'Program has been terminated successfully.'),
          },
        ],
      };
    } catch (error) {
      console.error('Error terminating program:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error terminating program: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register OAuth Get Token tool
server.tool(
  'yelpGetOAuthToken',
  'Get an OAuth access token',
  {
    client_id: z.string().describe('Your Yelp API client ID'),
    client_secret: z.string().describe('Your Yelp API client secret'),
    version: z.enum(['v2', 'v3']).default('v3').describe('OAuth version to use (default: v3)'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      let response;
      
      if (args.version === 'v2') {
        response = await yelpService.oauth.v2.getToken(args.client_id, args.client_secret);
      } else {
        response = await yelpService.oauth.v3.getToken({ 
          clientId: args.client_id, 
          clientSecret: args.client_secret 
        });
      }
      
      return {
        content: [
          {
            type: 'text',
            text: formatOAuthTokenResponse(response, args.version),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting OAuth token: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register OAuth Refresh Token tool
server.tool(
  'yelpRefreshOAuthToken',
  'Refresh an OAuth v3 access token',
  {
    refresh_token: z.string().describe('The refresh token to use'),
    scope: z.string().optional().describe('Optional scope to request'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.oauth.refreshToken(args.refresh_token);
      
      return {
        content: [
          {
            type: 'text',
            text: formatOAuthTokenResponse(response, 'v3'),
          },
        ],
      };
    } catch (error) {
      console.error('Error refreshing OAuth token:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error refreshing OAuth token: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register OAuth Revoke Token tool
server.tool(
  'yelpRevokeOAuthToken',
  'Revoke an OAuth access token',
  {
    token: z.string().describe('The access token to revoke'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.oauth.revokeToken(args.token);
      
      return {
        content: [
          {
            type: 'text',
            text: formatOAuthRevokeResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error revoking OAuth token:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error revoking OAuth token: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register OAuth Get Token Info tool
server.tool(
  'yelpGetOAuthTokenInfo',
  'Get information about an OAuth token',
  {
    token: z.string().describe('The access token to check'),
    version: z.enum(['v2', 'v3']).default('v3').describe('OAuth version to use (default: v3)'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      let response;
      
      if (args.version === 'v2') {
        response = await yelpService.oauth.v2.verifyToken(args.token);
      } else {
        response = await yelpService.oauth.v3.getTokenInfo(args.token);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: formatOAuthTokenInfoResponse(response, args.version),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting token info: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Waitlist Partner Restaurants tool
server.tool(
  'yelpWaitlistPartnerRestaurants',
  'Get a list of restaurants that support Yelp Waitlist',
  {
    location: z.string().optional().describe('Location (e.g. "San Francisco, CA")'),
    latitude: z.number().optional().describe('Latitude coordinate'),
    longitude: z.number().optional().describe('Longitude coordinate'),
    radius: z.number().optional().describe('Search radius in meters'),
    limit: z.number().optional().describe('Number of results to return (default: 20)'),
    offset: z.number().optional().describe('Offset for pagination'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.waitlistPartner.getPartnerRestaurants(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatWaitlistPartnerRestaurantsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting waitlist partner restaurants:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting waitlist partner restaurants: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Waitlist Status tool
server.tool(
  'yelpWaitlistStatus',
  'Get the current waitlist status for a business',
  {
    business_id: z.string().describe('The business ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.waitlistPartner.getWaitlistStatus(args.business_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatWaitlistStatusResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting waitlist status:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting waitlist status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Waitlist Info tool
server.tool(
  'yelpWaitlistInfo',
  'Get detailed information about a business\'s waitlist configuration',
  {
    business_id: z.string().describe('The business ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.waitlistPartner.getWaitlistInfo(args.business_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatWaitlistInfoResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting waitlist info:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting waitlist info: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Join Waitlist Queue tool
server.tool(
  'yelpJoinWaitlist',
  'Join a restaurant\'s waitlist',
  {
    business_id: z.string().describe('The business ID'),
    party_size: z.number().describe('Number of people in your party'),
    customer_name: z.string().describe('Customer name'),
    customer_phone: z.string().describe('Customer phone number'),
    customer_email: z.string().optional().describe('Customer email address'),
    notes: z.string().optional().describe('Additional notes for the restaurant'),
    seating_preference: z.string().optional().describe('Seating preference (e.g., "Indoor", "Outdoor")'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const { business_id, party_size, customer_name, customer_phone, customer_email, notes, seating_preference } = args;
      
      const request = {
        business_id,
        party_size,
        customer: {
          name: customer_name,
          phone: customer_phone,
          email: customer_email
        },
        notes,
        seating_preference
      };
      
      const response = await yelpService.waitlistPartner.joinQueue(request);
      
      return {
        content: [
          {
            type: 'text',
            text: formatJoinQueueResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error joining waitlist:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error joining waitlist: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register On My Way tool
server.tool(
  'yelpOnMyWay',
  'Notify a restaurant that you\'re on your way',
  {
    business_id: z.string().describe('The business ID'),
    visit_id: z.string().optional().describe('Visit ID (if already in queue)'),
    eta_minutes: z.number().optional().describe('Estimated arrival time in minutes'),
    customer_name: z.string().describe('Customer name'),
    customer_phone: z.string().describe('Customer phone number'),
    customer_email: z.string().optional().describe('Customer email address'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const { business_id, visit_id, eta_minutes, customer_name, customer_phone, customer_email } = args;
      
      const request = {
        business_id,
        visit_id,
        eta_minutes,
        customer: {
          name: customer_name,
          phone: customer_phone,
          email: customer_email
        }
      };
      
      const response = await yelpService.waitlistPartner.createOnMyWay(request);
      
      return {
        content: [
          {
            type: 'text',
            text: formatOnMyWayResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error sending on-my-way notification:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error sending on-my-way notification: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Cancel Visit tool
server.tool(
  'yelpCancelWaitlistVisit',
  'Cancel a waitlist visit',
  {
    visit_id: z.string().describe('The visit ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.waitlistPartner.cancelVisit(args.visit_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatCancelVisitResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error canceling waitlist visit:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error canceling waitlist visit: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Get Visit Details tool
server.tool(
  'yelpWaitlistVisitDetails',
  'Get details of a waitlist visit',
  {
    visit_id: z.string().describe('The visit ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.waitlistPartner.getVisitDetails(args.visit_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatVisitDetailsResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting visit details:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting visit details: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Format the Yelp AI response for better readability
function formatYelpResponse(response: YelpAIResponse): string {
  const { response: yelpResponse, entities } = response;
  
  let formattedResponse = yelpResponse.text + '\n\n';
  
  // Check if there are business entities in the response
  if (entities && entities.length > 0) {
    const businessEntities = entities.find(entity => entity.businesses);
    
    if (businessEntities && businessEntities.businesses) {
      formattedResponse += '## Businesses\n\n';
      
      businessEntities.businesses.forEach((business: any, index: number) => {
        formattedResponse += `### ${index + 1}. ${business.name}\n`;
        
        if (business.rating) {
          formattedResponse += `Rating: ${business.rating}/5 (${business.review_count} reviews)\n`;
        }
        
        if (business.price) {
          formattedResponse += `Price: ${business.price}\n`;
        }
        
        if (business.categories && business.categories.length > 0) {
          const categories = business.categories.map((cat: any) => cat.title).join(', ');
          formattedResponse += `Categories: ${categories}\n`;
        }
        
        if (business.formatted_address) {
          formattedResponse += `Address: ${business.formatted_address}\n`;
        }
        
        if (business.phone) {
          // Format phone number
          const phoneStr = business.phone.toString();
          const formattedPhone = `(${phoneStr.slice(0, 3)}) ${phoneStr.slice(3, 6)}-${phoneStr.slice(6)}`;
          formattedResponse += `Phone: ${formattedPhone}\n`;
        }
        
        if (business.url) {
          formattedResponse += `More info: ${business.url}\n`;
        }
        
        // Add business summary if available
        if (business.contextual_info && business.contextual_info.summary) {
          formattedResponse += `\n${business.contextual_info.summary}\n`;
        }
        
        // Add review snippet if available
        if (business.contextual_info && business.contextual_info.review_snippet) {
          const snippet = business.contextual_info.review_snippet
            .replace(/\[\[HIGHLIGHT\]\]/g, '**')
            .replace(/\[\[ENDHIGHLIGHT\]\]/g, '**');
          formattedResponse += `\nA customer said: "${snippet}"\n`;
        }
        
        formattedResponse += '\n';
      });
    }
  }
  
  return formattedResponse;
}

/**
 * Format business search response
 */
function formatBusinessSearchResponse(response: any): string {
  const { businesses, total, region } = response;
  
  let formattedResponse = `# Business Search Results\n\n`;
  formattedResponse += `Found ${total} businesses\n\n`;
  
  if (businesses && businesses.length > 0) {
    businesses.forEach((business: any, index: number) => {
      formattedResponse += `## ${index + 1}. ${business.name}\n`;
      
      if (business.rating) {
        formattedResponse += `Rating: ${business.rating}/5 (${business.review_count} reviews)\n`;
      }
      
      if (business.price) {
        formattedResponse += `Price: ${business.price}\n`;
      }
      
      if (business.categories && business.categories.length > 0) {
        const categories = business.categories.map((cat: any) => cat.title).join(', ');
        formattedResponse += `Categories: ${categories}\n`;
      }
      
      if (business.location) {
        const address = business.location.display_address?.join(', ');
        formattedResponse += `Address: ${address}\n`;
      }
      
      if (business.phone) {
        formattedResponse += `Phone: ${business.display_phone || business.phone}\n`;
      }
      
      if (business.url) {
        formattedResponse += `More info: ${business.url}\n`;
      }
      
      if (business.distance) {
        const distance = (business.distance / 1609.34).toFixed(2); // Convert meters to miles
        formattedResponse += `Distance: ${distance} miles\n`;
      }
      
      formattedResponse += '\n';
    });
  } else {
    formattedResponse += "No businesses found matching your search criteria.\n";
  }
  
  return formattedResponse;
}

/**
 * Format business details response
 */
function formatBusinessDetailsResponse(response: any): string {
  const business = response;
  
  let formattedResponse = `# ${business.name}\n\n`;
  
  if (business.rating) {
    formattedResponse += `Rating: ${business.rating}/5 (${business.review_count} reviews)\n`;
  }
  
  if (business.price) {
    formattedResponse += `Price: ${business.price}\n`;
  }
  
  if (business.categories && business.categories.length > 0) {
    const categories = business.categories.map((cat: any) => cat.title).join(', ');
    formattedResponse += `Categories: ${categories}\n`;
  }
  
  if (business.location) {
    const address = business.location.display_address?.join(', ');
    formattedResponse += `Address: ${address}\n`;
  }
  
  if (business.phone) {
    formattedResponse += `Phone: ${business.display_phone || business.phone}\n`;
  }
  
  if (business.hours) {
    formattedResponse += `\n## Hours\n`;
    business.hours.forEach((hoursSet: any) => {
      hoursSet.open.forEach((time: any) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const day = days[time.day];
        const start = time.start.replace(/(\d{2})(\d{2})/, '$1:$2');
        const end = time.end.replace(/(\d{2})(\d{2})/, '$1:$2');
        formattedResponse += `${day}: ${start} - ${end}\n`;
      });
    });
  }
  
  if (business.photos && business.photos.length > 0) {
    formattedResponse += `\n## Photos\n`;
    business.photos.forEach((photo: string) => {
      formattedResponse += `- ${photo}\n`;
    });
  }
  
  if (business.attributes) {
    formattedResponse += `\n## Attributes\n`;
    Object.entries(business.attributes).forEach(([key, value]) => {
      formattedResponse += `- ${key}: ${value}\n`;
    });
  }
  
  if (business.url) {
    formattedResponse += `\nMore info: ${business.url}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format reviews response
 */
function formatReviewsResponse(response: any): string {
  const { reviews, total, possible_languages = [] } = response;
  
  let formattedResponse = `# Business Reviews\n\n`;
  formattedResponse += `Total reviews: ${total || reviews?.length || 0}\n`;
  
  if (possible_languages && possible_languages.length > 0) {
    formattedResponse += `Available languages: ${possible_languages.join(', ')}\n`;
  }
  
  formattedResponse += '\n';
  
  if (reviews && reviews.length > 0) {
    reviews.forEach((review: any, index: number) => {
      formattedResponse += `## Review ${index + 1}\n`;
      
      // Add star rating visualization
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      formattedResponse += `Rating: ${stars} (${review.rating}/5)\n`;
      
      // Format date nicely
      try {
        const date = new Date(review.time_created);
        formattedResponse += `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
      } catch (e) {
        formattedResponse += `Date: ${review.time_created}\n`;
      }
      
      // Add user info with profile link
      if (review.user) {
        formattedResponse += `User: [${review.user.name}](${review.user.profile_url})\n`;
      } else {
        formattedResponse += `User: Anonymous\n`;
      }
      
      // Add review text with some spacing
      formattedResponse += `\n"${review.text}"\n\n`;
      
      // Add link to full review on Yelp
      if (review.url) {
        formattedResponse += `[Read full review on Yelp](${review.url})\n`;
      }
      
      // Add separator between reviews
      formattedResponse += '\n---\n\n';
    });
  } else {
    formattedResponse += "No reviews found for this business.\n";
  }
  
  return formattedResponse;
}

/**
 * Format review highlights response
 */
function formatReviewHighlightsResponse(response: any): string {
  const { review_highlights, total } = response;
  
  let formattedResponse = `# Review Highlights\n\n`;
  formattedResponse += `Total highlights: ${total || review_highlights?.length || 0}\n\n`;
  
  if (review_highlights && review_highlights.length > 0) {
    review_highlights.forEach((highlight: any, index: number) => {
      formattedResponse += `## Highlight ${index + 1}\n`;
      
      // Add star rating visualization
      const stars = '★'.repeat(highlight.rating) + '☆'.repeat(5 - highlight.rating);
      formattedResponse += `Rating: ${stars} (${highlight.rating}/5)\n`;
      
      // Format date nicely
      try {
        const date = new Date(highlight.time_created);
        formattedResponse += `Date: ${date.toLocaleDateString()}\n`;
      } catch (e) {
        formattedResponse += `Date: ${highlight.time_created}\n`;
      }
      
      // Add user info
      if (highlight.user) {
        formattedResponse += `User: ${highlight.user.name}\n\n`;
      }
      
      // Add highlighted text (this is the important part - highlight in bold)
      if (highlight.highlight_text) {
        formattedResponse += `"${highlight.snippet_text.replace(highlight.highlight_text, `**${highlight.highlight_text}**`)}"\n\n`;
      } else if (highlight.snippet_text) {
        formattedResponse += `"${highlight.snippet_text}"\n\n`;
      } else if (highlight.text) {
        formattedResponse += `"${highlight.text}"\n\n`;
      }
      
      // Add separator between highlights
      formattedResponse += '---\n\n';
    });
  } else {
    formattedResponse += "No review highlights found for this business.\n";
  }
  
  return formattedResponse;
}

/**
 * Format categories response
 */
function formatCategoriesResponse(response: any): string {
  const { categories } = response;
  
  let formattedResponse = `# Yelp Business Categories\n\n`;
  
  if (categories && categories.length > 0) {
    // Group by parent categories
    const parentCategories: Record<string, any[]> = {};
    
    categories.forEach((category: any) => {
      const parent = category.parent_categories?.[0]?.title || 'Other';
      if (!parentCategories[parent]) {
        parentCategories[parent] = [];
      }
      parentCategories[parent].push(category);
    });
    
    // Output grouped categories
    Object.entries(parentCategories).forEach(([parent, cats]) => {
      formattedResponse += `## ${parent}\n\n`;
      
      cats.forEach((category) => {
        formattedResponse += `- ${category.title} (${category.alias})\n`;
      });
      
      formattedResponse += '\n';
    });
  } else {
    formattedResponse += "No categories found.\n";
  }
  
  return formattedResponse;
}

/**
 * Format events response
 */
function formatEventsResponse(response: any): string {
  const { events, total } = response;
  
  let formattedResponse = `# Events Search Results\n\n`;
  formattedResponse += `Found ${total || 0} events\n\n`;
  
  if (events && events.length > 0) {
    events.forEach((event: any, index: number) => {
      formattedResponse += `## ${index + 1}. ${event.name}\n`;
      
      if (event.description) {
        formattedResponse += `${event.description.substring(0, 150)}${event.description.length > 150 ? '...' : ''}\n\n`;
      }
      
      if (event.time_start) {
        const startDate = new Date(event.time_start).toLocaleString();
        formattedResponse += `Start: ${startDate}\n`;
      }
      
      if (event.time_end) {
        const endDate = new Date(event.time_end).toLocaleString();
        formattedResponse += `End: ${endDate}\n`;
      }
      
      if (event.cost !== undefined) {
        formattedResponse += `Cost: ${event.cost === 0 ? 'Free' : `$${event.cost}`}\n`;
      }
      
      if (event.is_free !== undefined) {
        formattedResponse += `Free: ${event.is_free ? 'Yes' : 'No'}\n`;
      }
      
      if (event.attending_count) {
        formattedResponse += `Attending: ${event.attending_count}\n`;
      }
      
      if (event.interested_count) {
        formattedResponse += `Interested: ${event.interested_count}\n`;
      }
      
      if (event.location) {
        formattedResponse += `Location: ${event.location.display_address?.join(', ') || ''}\n`;
      }
      
      if (event.category) {
        formattedResponse += `Category: ${event.category}\n`;
      }
      
      if (event.business_id) {
        formattedResponse += `Hosted by business: ${event.business_id}\n`;
      }
      
      if (event.image_url) {
        formattedResponse += `Image: ${event.image_url}\n`;
      }
      
      if (event.tickets_url) {
        formattedResponse += `Tickets: ${event.tickets_url}\n`;
      }
      
      if (event.url) {
        formattedResponse += `More info: ${event.url}\n`;
      }
      
      formattedResponse += '\n';
    });
  } else {
    formattedResponse += "No events found matching your search criteria.\n";
  }
  
  return formattedResponse;
}

/**
 * Format event details response
 */
function formatEventDetailsResponse(event: any): string {
  let formattedResponse = `# ${event.name}\n\n`;
  
  if (event.description) {
    formattedResponse += `## Description\n${event.description}\n\n`;
  }
  
  formattedResponse += `## Event Details\n`;
  
  if (event.time_start) {
    const startDate = new Date(event.time_start).toLocaleString();
    formattedResponse += `Start: ${startDate}\n`;
  }
  
  if (event.time_end) {
    const endDate = new Date(event.time_end).toLocaleString();
    formattedResponse += `End: ${endDate}\n`;
  }
  
  if (event.cost !== undefined) {
    formattedResponse += `Cost: ${event.cost === 0 ? 'Free' : `$${event.cost}`}\n`;
  }
  
  if (event.is_free !== undefined) {
    formattedResponse += `Free: ${event.is_free ? 'Yes' : 'No'}\n`;
  }
  
  if (event.attending_count) {
    formattedResponse += `Attending: ${event.attending_count}\n`;
  }
  
  if (event.interested_count) {
    formattedResponse += `Interested: ${event.interested_count}\n`;
  }
  
  if (event.category) {
    formattedResponse += `Category: ${event.category}\n`;
  }
  
  if (event.location) {
    formattedResponse += `\n## Location\n`;
    if (event.location.display_address && event.location.display_address.length > 0) {
      formattedResponse += `Address: ${event.location.display_address.join(', ')}\n`;
    } else {
      const addressParts = [];
      if (event.location.address1) addressParts.push(event.location.address1);
      if (event.location.address2) addressParts.push(event.location.address2);
      if (event.location.address3) addressParts.push(event.location.address3);
      if (event.location.city) addressParts.push(event.location.city);
      if (event.location.state) addressParts.push(event.location.state);
      if (event.location.zip_code) addressParts.push(event.location.zip_code);
      if (event.location.country) addressParts.push(event.location.country);
      
      if (addressParts.length > 0) {
        formattedResponse += `Address: ${addressParts.join(', ')}\n`;
      }
    }
  }
  
  if (event.business_id) {
    formattedResponse += `\n## Hosted By\nBusiness ID: ${event.business_id}\n`;
  }
  
  if (event.image_url) {
    formattedResponse += `\n## Media\nImage: ${event.image_url}\n`;
  }
  
  if (event.tickets_url) {
    formattedResponse += `\n## Tickets\nTickets available at: ${event.tickets_url}\n`;
  }
  
  if (event.url) {
    formattedResponse += `\n## More Information\nView on Yelp: ${event.url}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format featured event response
 */
function formatFeaturedEventResponse(response: any): string {
  const { featured_event } = response;
  
  if (!featured_event) {
    return "No featured event found for this location.";
  }
  
  let formattedResponse = `# Featured Event: ${featured_event.name}\n\n`;
  
  if (featured_event.description) {
    formattedResponse += `## Description\n${featured_event.description}\n\n`;
  }
  
  formattedResponse += `## Event Details\n`;
  
  if (featured_event.time_start) {
    const startDate = new Date(featured_event.time_start).toLocaleString();
    formattedResponse += `Start: ${startDate}\n`;
  }
  
  if (featured_event.time_end) {
    const endDate = new Date(featured_event.time_end).toLocaleString();
    formattedResponse += `End: ${endDate}\n`;
  }
  
  if (featured_event.cost !== undefined) {
    formattedResponse += `Cost: ${featured_event.cost === 0 ? 'Free' : `$${featured_event.cost}`}\n`;
  }
  
  if (featured_event.is_free !== undefined) {
    formattedResponse += `Free: ${featured_event.is_free ? 'Yes' : 'No'}\n`;
  }
  
  if (featured_event.category) {
    formattedResponse += `Category: ${featured_event.category}\n`;
  }
  
  if (featured_event.location) {
    formattedResponse += `\n## Location\n`;
    if (featured_event.location.display_address && featured_event.location.display_address.length > 0) {
      formattedResponse += `Address: ${featured_event.location.display_address.join(', ')}\n`;
    }
  }
  
  if (featured_event.business_id) {
    formattedResponse += `\n## Hosted By\nBusiness ID: ${featured_event.business_id}\n`;
  }
  
  if (featured_event.image_url) {
    formattedResponse += `\n## Media\nImage: ${featured_event.image_url}\n`;
  }
  
  if (featured_event.url) {
    formattedResponse += `\n## More Information\nView on Yelp: ${featured_event.url}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format advertising program response
 */
function formatProgramResponse(program: any, customHeading?: string): string {
  let formattedResponse = `# ${customHeading || 'Advertising Program Details'}\n\n`;
  
  formattedResponse += `Program ID: ${program.program_id}\n`;
  formattedResponse += `Business ID: ${program.business_id}\n`;
  formattedResponse += `Status: ${program.status}\n`;
  
  if (program.budget) {
    // Convert cents to dollars for display
    const budgetDollars = (program.budget / 100).toFixed(2);
    formattedResponse += `Budget: $${budgetDollars}\n`;
  }
  
  if (program.start_date) {
    const startDate = new Date(program.start_date).toLocaleDateString();
    formattedResponse += `Start Date: ${startDate}\n`;
  }
  
  if (program.end_date) {
    const endDate = new Date(program.end_date).toLocaleDateString();
    formattedResponse += `End Date: ${endDate}\n`;
  }
  
  if (program.objectives && program.objectives.length > 0) {
    formattedResponse += `\n## Objectives\n`;
    program.objectives.forEach((objective: string) => {
      formattedResponse += `- ${objective}\n`;
    });
  }
  
  if (program.ad_type) {
    formattedResponse += `\n## Ad Type\n${program.ad_type}\n`;
  }
  
  if (program.geo_targeting) {
    formattedResponse += `\n## Geographic Targeting\n`;
    
    if (program.geo_targeting.location) {
      formattedResponse += `Location: ${program.geo_targeting.location}\n`;
    }
    
    if (program.geo_targeting.radius) {
      formattedResponse += `Radius: ${program.geo_targeting.radius} meters\n`;
    }
    
    if (program.geo_targeting.latitude && program.geo_targeting.longitude) {
      formattedResponse += `Coordinates: ${program.geo_targeting.latitude}, ${program.geo_targeting.longitude}\n`;
    }
  }
  
  if (program.metrics) {
    formattedResponse += `\n## Performance Metrics\n`;
    formattedResponse += `Impressions: ${program.metrics.impressions}\n`;
    formattedResponse += `Clicks: ${program.metrics.clicks}\n`;
    formattedResponse += `CTR: ${(program.metrics.ctr * 100).toFixed(2)}%\n`;
    
    if (program.metrics.spend) {
      const spendDollars = (program.metrics.spend / 100).toFixed(2);
      formattedResponse += `Spend: $${spendDollars}\n`;
    }
  }
  
  if (program.created_at) {
    const createdDate = new Date(program.created_at).toLocaleString();
    formattedResponse += `\nCreated: ${createdDate}\n`;
  }
  
  if (program.updated_at) {
    const updatedDate = new Date(program.updated_at).toLocaleString();
    formattedResponse += `Last Updated: ${updatedDate}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format program list response
 */
function formatProgramListResponse(response: any): string {
  const { programs, total } = response;
  
  let formattedResponse = `# Advertising Programs\n\n`;
  formattedResponse += `Total Programs: ${total || 0}\n\n`;
  
  if (programs && programs.length > 0) {
    programs.forEach((program: any, index: number) => {
      formattedResponse += `## ${index + 1}. Program ${program.program_id}\n`;
      formattedResponse += `Business ID: ${program.business_id}\n`;
      formattedResponse += `Status: ${program.status}\n`;
      
      if (program.budget) {
        // Convert cents to dollars for display
        const budgetDollars = (program.budget / 100).toFixed(2);
        formattedResponse += `Budget: $${budgetDollars}\n`;
      }
      
      if (program.start_date) {
        const startDate = new Date(program.start_date).toLocaleDateString();
        formattedResponse += `Start Date: ${startDate}\n`;
      }
      
      if (program.objectives && program.objectives.length > 0) {
        formattedResponse += `Objectives: ${program.objectives.join(', ')}\n`;
      }
      
      if (program.metrics && program.metrics.spend) {
        const spendDollars = (program.metrics.spend / 100).toFixed(2);
        formattedResponse += `Spend: $${spendDollars}\n`;
      }
      
      formattedResponse += '\n';
    });
  } else {
    formattedResponse += "No advertising programs found.\n";
  }
  
  return formattedResponse;
}

/**
 * Format program status response
 */
function formatProgramStatusResponse(response: any): string {
  let formattedResponse = `# Program Status: ${response.program_id}\n\n`;
  formattedResponse += `Current Status: ${response.status}\n\n`;
  
  if (response.details) {
    formattedResponse += `## Status Details\n`;
    
    if (response.details.reason) {
      formattedResponse += `Reason: ${response.details.reason}\n`;
    }
    
    if (response.details.last_updated) {
      const lastUpdated = new Date(response.details.last_updated).toLocaleString();
      formattedResponse += `Last Updated: ${lastUpdated}\n`;
    }
    
    if (response.details.days_active !== undefined) {
      formattedResponse += `Days Active: ${response.details.days_active}\n`;
    }
    
    if (response.details.days_remaining !== undefined) {
      formattedResponse += `Days Remaining: ${response.details.days_remaining}\n`;
    }
  }
  
  if (response.budget_status) {
    formattedResponse += `\n## Budget Status\n`;
    
    if (response.budget_status.total_budget) {
      const totalBudgetDollars = (response.budget_status.total_budget / 100).toFixed(2);
      formattedResponse += `Total Budget: $${totalBudgetDollars}\n`;
    }
    
    if (response.budget_status.spent) {
      const spentDollars = (response.budget_status.spent / 100).toFixed(2);
      formattedResponse += `Spent: $${spentDollars}\n`;
    }
    
    if (response.budget_status.remaining) {
      const remainingDollars = (response.budget_status.remaining / 100).toFixed(2);
      formattedResponse += `Remaining: $${remainingDollars}\n`;
    }
    
    if (response.budget_status.daily_spend) {
      const dailySpendDollars = (response.budget_status.daily_spend / 100).toFixed(2);
      formattedResponse += `Daily Spend: $${dailySpendDollars}\n`;
    }
  }
  
  return formattedResponse;
}

/**
 * Format OAuth token response
 */
function formatOAuthTokenResponse(response: any, version: string): string {
  let formattedResponse = `# OAuth ${version.toUpperCase()} Token\n\n`;
  
  // Mask most of the token for security
  if (response.access_token) {
    const token = response.access_token;
    const maskedToken = token.length > 8 
      ? `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
      : '********';
    formattedResponse += `Access Token: ${maskedToken}\n`;
  }
  
  if (response.token_type) {
    formattedResponse += `Token Type: ${response.token_type}\n`;
  }
  
  if (response.expires_in) {
    // Convert seconds to hours and minutes
    const hours = Math.floor(response.expires_in / 3600);
    const minutes = Math.floor((response.expires_in % 3600) / 60);
    formattedResponse += `Expires In: ${response.expires_in} seconds`;
    
    if (hours > 0 || minutes > 0) {
      formattedResponse += ` (${hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : ''}${
        hours > 0 && minutes > 0 ? ' and ' : ''}${
        minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : ''
      })`;
    }
    formattedResponse += '\n';
  }
  
  // For v3 tokens - show refresh token if available
  if (version === 'v3' && response.refresh_token) {
    const refreshToken = response.refresh_token;
    const maskedRefreshToken = refreshToken.length > 8
      ? `${refreshToken.substring(0, 4)}...${refreshToken.substring(refreshToken.length - 4)}`
      : '********';
    formattedResponse += `Refresh Token: ${maskedRefreshToken}\n`;
  }
  
  if (response.scope) {
    formattedResponse += `\n## Scopes\n`;
    const scopes = response.scope.split(' ');
    
    scopes.forEach((scope: string) => {
      formattedResponse += `- ${scope}\n`;
    });
  }
  
  formattedResponse += `\n## Usage\n`;
  formattedResponse += `To use this token in API requests, include it in the Authorization header:\n`;
  formattedResponse += "```\nAuthorization: Bearer YOUR_ACCESS_TOKEN\n```\n";
  
  if (version === 'v3' && response.refresh_token) {
    formattedResponse += `\nWhen this token expires, you can get a new one using the refresh token with the yelpRefreshOAuthToken tool.\n`;
  }
  
  return formattedResponse;
}

/**
 * Format OAuth token revocation response
 */
function formatOAuthRevokeResponse(response: any): string {
  let formattedResponse = `# OAuth Token Revocation\n\n`;
  
  if (response.success) {
    formattedResponse += `✅ Token successfully revoked.\n`;
  } else if (response.message) {
    formattedResponse += `${response.message}\n`;
  } else {
    formattedResponse += `Token has been revoked. Any future API requests using this token will be rejected.\n`;
  }
  
  return formattedResponse;
}

/**
 * Format OAuth token info response
 */
function formatOAuthTokenInfoResponse(response: any, version: string): string {
  let formattedResponse = `# OAuth ${version.toUpperCase()} Token Information\n\n`;
  
  if (response.active !== undefined) {
    formattedResponse += `Status: ${response.active ? '✅ Active' : '❌ Inactive'}\n`;
  }
  
  if (response.client_id) {
    formattedResponse += `Client ID: ${response.client_id}\n`;
  }
  
  if (response.user_id) {
    formattedResponse += `User ID: ${response.user_id}\n`;
  }
  
  if (response.expires_in) {
    // Convert seconds to days, hours, and minutes for better readability
    const days = Math.floor(response.expires_in / 86400);
    const hours = Math.floor((response.expires_in % 86400) / 3600);
    const minutes = Math.floor((response.expires_in % 3600) / 60);
    
    formattedResponse += `Expires In: `;
    
    if (days > 0) {
      formattedResponse += `${days} day${days !== 1 ? 's' : ''} `;
    }
    
    if (hours > 0) {
      formattedResponse += `${hours} hour${hours !== 1 ? 's' : ''} `;
    }
    
    if (minutes > 0) {
      formattedResponse += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    if (days === 0 && hours === 0 && minutes === 0) {
      formattedResponse += `less than a minute`;
    }
    
    formattedResponse += '\n';
  }
  
  if (response.scope) {
    formattedResponse += `\n## Authorized Scopes\n`;
    const scopes = response.scope.split(' ');
    
    scopes.forEach((scope: string) => {
      formattedResponse += `- ${scope}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format Waitlist Partner Restaurants response
 */
function formatWaitlistPartnerRestaurantsResponse(response: any): string {
  const { restaurants, total } = response;
  
  let formattedResponse = `# Yelp Waitlist Partner Restaurants\n\n`;
  formattedResponse += `Found ${total || restaurants?.length || 0} restaurants\n\n`;
  
  if (restaurants && restaurants.length > 0) {
    restaurants.forEach((restaurant: any, index: number) => {
      formattedResponse += `## ${index + 1}. ${restaurant.name}\n`;
      
      if (restaurant.waitlist_status) {
        formattedResponse += `Status: ${restaurant.waitlist_status}\n`;
      }
      
      if (restaurant.location && restaurant.location.display_address) {
        formattedResponse += `Location: ${restaurant.location.display_address.join(', ')}\n`;
      }
      
      if (restaurant.phone) {
        formattedResponse += `Phone: ${restaurant.phone}\n`;
      }
      
      if (restaurant.business_url) {
        formattedResponse += `Yelp Page: ${restaurant.business_url}\n`;
      }
      
      formattedResponse += '\n';
    });
  } else {
    formattedResponse += "No waitlist partner restaurants found matching your criteria.\n";
  }
  
  return formattedResponse;
}

/**
 * Format Waitlist Status response
 */
function formatWaitlistStatusResponse(response: any): string {
  let formattedResponse = `# Waitlist Status for ${response.business_id}\n\n`;
  
  formattedResponse += `Current Status: ${response.status}\n`;
  
  if (response.message) {
    formattedResponse += `Message: ${response.message}\n`;
  }
  
  if (response.wait_time_minutes !== undefined) {
    formattedResponse += `Current Wait Time: ${response.wait_time_minutes} minutes\n`;
  }
  
  if (response.people_in_line !== undefined) {
    formattedResponse += `People In Line: ${response.people_in_line}\n`;
  }
  
  if (response.hours) {
    formattedResponse += `\n## Hours\n`;
    
    if (response.hours.open) {
      formattedResponse += `Open: ${response.hours.open}\n`;
    }
    
    if (response.hours.close) {
      formattedResponse += `Close: ${response.hours.close}\n`;
    }
  }
  
  if (response.timestamp) {
    const timestamp = new Date(response.timestamp).toLocaleString();
    formattedResponse += `\nLast Updated: ${timestamp}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format Waitlist Info response
 */
function formatWaitlistInfoResponse(response: any): string {
  let formattedResponse = `# Waitlist Information for ${response.name}\n\n`;
  
  formattedResponse += `## Waitlist Features\n`;
  formattedResponse += `On-My-Way Feature: ${response.allows_on_my_way ? '✅ Available' : '❌ Not Available'}\n`;
  formattedResponse += `Remote Join: ${response.allows_remote_join ? '✅ Available' : '❌ Not Available'}\n`;
  
  if (response.min_party_size !== undefined || response.max_party_size !== undefined) {
    formattedResponse += `\n## Party Size Limitations\n`;
    
    if (response.min_party_size !== undefined) {
      formattedResponse += `Minimum: ${response.min_party_size} ${response.min_party_size === 1 ? 'person' : 'people'}\n`;
    }
    
    if (response.max_party_size !== undefined) {
      formattedResponse += `Maximum: ${response.max_party_size} people\n`;
    }
  }
  
  if (response.hours && response.hours.length > 0) {
    formattedResponse += `\n## Operating Hours\n`;
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    response.hours.forEach((hour: any) => {
      const day = days[hour.day];
      const start = hour.start.replace(/(\d{2})(\d{2})/, '$1:$2');
      const end = hour.end.replace(/(\d{2})(\d{2})/, '$1:$2');
      
      formattedResponse += `${day}: ${start} - ${end}\n`;
    });
  }
  
  if (response.settings && Object.keys(response.settings).length > 0) {
    formattedResponse += `\n## Additional Settings\n`;
    
    Object.entries(response.settings).forEach(([key, value]) => {
      formattedResponse += `${key}: ${value}\n`;
    });
  }
  
  return formattedResponse;
}

/**
 * Format Join Queue response
 */
function formatJoinQueueResponse(response: any): string {
  let formattedResponse = `# Successfully Joined Waitlist\n\n`;
  
  formattedResponse += `Visit ID: ${response.visit_id}\n`;
  formattedResponse += `Status: ${response.status}\n`;
  
  if (response.position !== undefined) {
    formattedResponse += `Your Position: ${response.position}\n`;
  }
  
  if (response.party_size) {
    formattedResponse += `Party Size: ${response.party_size} ${response.party_size === 1 ? 'person' : 'people'}\n`;
  }
  
  if (response.wait_time_minutes !== undefined) {
    formattedResponse += `Estimated Wait Time: ${response.wait_time_minutes} minutes\n`;
  }
  
  if (response.people_ahead !== undefined) {
    formattedResponse += `People Ahead of You: ${response.people_ahead}\n`;
  }
  
  if (response.created_at) {
    const created = new Date(response.created_at).toLocaleString();
    formattedResponse += `Time Added: ${created}\n`;
  }
  
  formattedResponse += `\n## What's Next\n`;
  formattedResponse += `1. You'll be notified when your table is ready\n`;
  formattedResponse += `2. You can check your status with the yelpWaitlistVisitDetails tool using your Visit ID\n`;
  formattedResponse += `3. If you need to cancel, use the yelpCancelWaitlistVisit tool\n`;
  
  return formattedResponse;
}

/**
 * Format On My Way response
 */
function formatOnMyWayResponse(response: any): string {
  let formattedResponse = `# On-My-Way Notification Sent\n\n`;
  
  formattedResponse += `Status: ${response.status}\n`;
  
  if (response.message) {
    formattedResponse += `Message: ${response.message}\n`;
  }
  
  if (response.visit_id) {
    formattedResponse += `Visit ID: ${response.visit_id}\n`;
  }
  
  formattedResponse += `\n## What's Next\n`;
  formattedResponse += `The restaurant has been notified that you're on your way. `;
  formattedResponse += `When you arrive, check in with the host and let them know you sent an on-my-way notification.\n`;
  
  return formattedResponse;
}

/**
 * Format Cancel Visit response
 */
function formatCancelVisitResponse(response: any): string {
  let formattedResponse = `# Waitlist Cancellation\n\n`;
  
  formattedResponse += `Visit ID: ${response.visit_id}\n`;
  formattedResponse += `Status: ${response.success ? '✅ Successfully Cancelled' : '❌ Cancellation Failed'}\n`;
  
  if (response.status) {
    formattedResponse += `Current Status: ${response.status}\n`;
  }
  
  if (response.message) {
    formattedResponse += `\nMessage: ${response.message}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format Visit Details response
 */
function formatVisitDetailsResponse(response: any): string {
  let formattedResponse = `# Waitlist Visit Details\n\n`;
  
  if (response.business && response.business.name) {
    formattedResponse += `## ${response.business.name}\n\n`;
  }
  
  formattedResponse += `Visit ID: ${response.visit_id}\n`;
  formattedResponse += `Status: ${response.status}\n`;
  
  if (response.party_size) {
    formattedResponse += `Party Size: ${response.party_size} ${response.party_size === 1 ? 'person' : 'people'}\n`;
  }
  
  if (response.position !== undefined) {
    formattedResponse += `Current Position: ${response.position}\n`;
  }
  
  if (response.wait_time_minutes !== undefined) {
    formattedResponse += `Estimated Wait Time: ${response.wait_time_minutes} minutes\n`;
  }
  
  if (response.people_ahead !== undefined) {
    formattedResponse += `People Ahead: ${response.people_ahead}\n`;
  }
  
  if (response.estimated_seating_time) {
    const seatingTime = new Date(response.estimated_seating_time).toLocaleString();
    formattedResponse += `Estimated Seating Time: ${seatingTime}\n`;
  }
  
  if (response.notes) {
    formattedResponse += `\n## Notes\n${response.notes}\n`;
  }
  
  if (response.customer) {
    formattedResponse += `\n## Customer Information\n`;
    formattedResponse += `Name: ${response.customer.name}\n`;
    
    if (response.customer.phone) {
      formattedResponse += `Phone: ${response.customer.phone}\n`;
    }
    
    if (response.customer.email) {
      formattedResponse += `Email: ${response.customer.email}\n`;
    }
  }
  
  if (response.business) {
    formattedResponse += `\n## Restaurant Information\n`;
    
    if (response.business.phone) {
      formattedResponse += `Phone: ${response.business.phone}\n`;
    }
    
    if (response.business.address && response.business.address.length > 0) {
      formattedResponse += `Address: ${response.business.address.join(', ')}\n`;
    }
  }
  
  if (response.created_at) {
    const created = new Date(response.created_at).toLocaleString();
    formattedResponse += `\nCreated: ${created}\n`;
  }
  
  if (response.updated_at) {
    const updated = new Date(response.updated_at).toLocaleString();
    formattedResponse += `Last Updated: ${updated}\n`;
  }
  
  return formattedResponse;
}

// Start the server using stdio transport
class StdioTransport {
  async start(): Promise<void> { 
    return Promise.resolve();
  }
  
  async close(): Promise<void> {
    return Promise.resolve();
  }
  
  async send(message: any): Promise<void> {
    process.stdout.write(JSON.stringify(message) + '\n');
    return Promise.resolve();
  }

  async connect(callback: (message: any) => Promise<any>): Promise<void> {
    process.stdin.on('data', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const response = await callback(message);
        await this.send(response);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    return Promise.resolve();
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use startServer() instead
 */
async function main() {
  // This function is kept for backward compatibility
  // Now it will use the transported passed to it by the startServer function
  // when called without arguments
  const transport = new StdioTransport();
  const server = createServer();
  await server.connect(transport);
  console.error('Yelp Fusion AI MCP server started and connected via stdio');
  return server;
}

/**
 * Format respond reviews token response
 */
function formatRespondReviewsTokenResponse(response: GetAccessTokenResponse): string {
  return `
## Respond Reviews Access Token

| Field | Value |
| ----- | ----- |
| Access Token | ${response.access_token} |
| Token Type | ${response.token_type} |
| Expires In | ${response.expires_in} seconds |

This token can be used to authenticate requests to the Yelp Respond Reviews API.
  `;
}

/**
 * Format respond reviews businesses response
 */
function formatRespondReviewsBusinessesResponse(response: GetBusinessesResponse): string {
  if (!response.businesses || response.businesses.length === 0) {
    return 'No businesses found that you can respond to reviews for.';
  }

  const businessList = response.businesses.map(business => {
    const location = business.location ? business.location.display_address?.join(', ') : 'Location not available';
    const reviewCount = business.business_info?.review_count || 'N/A';
    const rating = business.business_info?.rating || 'N/A';
    
    return `
### ${business.name}
- **ID**: ${business.id}
- **Location**: ${location}
- **Review Count**: ${reviewCount}
- **Rating**: ${rating}
${business.url ? `- **Yelp URL**: ${business.url}` : ''}
`;
  }).join('\n');

  return `
## Businesses for Review Responses (${response.total || response.businesses.length} total)

${businessList}
  `;
}

/**
 * Format respond reviews business owner response
 */
function formatRespondReviewsBusinessOwnerResponse(response: BusinessOwnerInfo): string {
  const permissions = response.permissions ? response.permissions.join(', ') : 'None';
  
  return `
## Business Owner Information for ${response.business_name}

| Field | Value |
| ----- | ----- |
| Business ID | ${response.business_id} |
| Business Name | ${response.business_name} |
| Owner Name | ${response.owner_name || 'N/A'} |
| Owner Email | ${response.owner_email || 'N/A'} |
| Account Status | ${response.account_status || 'N/A'} |
| Permissions | ${permissions} |
  `;
}

/**
 * Format respond to review response
 */
function formatRespondToReviewResponse(response: RespondToReviewResponse): string {
  return `
## Review Response ${response.success ? '✅ Successful' : '❌ Failed'}

| Field | Value |
| ----- | ----- |
| Response ID | ${response.id || 'N/A'} |
| Review ID | ${response.review_id} |
| Business ID | ${response.business_id} |
| Created At | ${response.created_at || 'N/A'} |
| Updated At | ${response.updated_at || 'N/A'} |

**Response Text**:
${response.text}
  `;
}

// Register Respond Reviews - Get Access Token tool
server.tool(
  'yelpRespondReviewsGetToken',
  'Get an OAuth access token for responding to reviews on Yelp',
  {
    client_id: z.string().describe('Client ID for Yelp Respond Reviews'),
    client_secret: z.string().describe('Client secret for Yelp Respond Reviews'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.respondReviews.getAccessToken(
        args.client_id,
        args.client_secret
      );
      
      return {
        content: [
          {
            type: 'text',
            text: formatRespondReviewsTokenResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting respond reviews token:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting respond reviews token: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Respond Reviews - Get Businesses tool
server.tool(
  'yelpRespondReviewsBusinesses',
  'Get businesses that the authenticated user can respond to reviews for',
  {
    limit: z.number().optional().describe('Number of businesses to return'),
    offset: z.number().optional().describe('Offset for pagination'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.respondReviews.getBusinesses(args);
      
      return {
        content: [
          {
            type: 'text',
            text: formatRespondReviewsBusinessesResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting respond reviews businesses:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting respond reviews businesses: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Respond Reviews - Get Business Owner Info tool
server.tool(
  'yelpRespondReviewsBusinessOwner',
  'Get business owner information for a specific business',
  {
    business_id: z.string().describe('The Yelp business ID'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.respondReviews.getBusinessOwnerInfo(args.business_id);
      
      return {
        content: [
          {
            type: 'text',
            text: formatRespondReviewsBusinessOwnerResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error getting business owner info:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error getting business owner info: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// Register Respond Reviews - Respond to Review tool
server.tool(
  'yelpRespondToReview',
  'Respond to a review as a business owner',
  {
    review_id: z.string().describe('The ID of the review to respond to'),
    text: z.string().describe('The response text'),
  },
  async (args): Promise<CallToolResult> => {
    try {
      const response = await yelpService.respondReviews.respondToReview(
        args.review_id, 
        args.text
      );
      
      return {
        content: [
          {
            type: 'text',
            text: formatRespondToReviewResponse(response),
          },
        ],
      };
    } catch (error) {
      console.error('Error responding to review:', error);
      return {
        content: [
          {
            type: 'text',
            text: `Error responding to review: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

  return server;
}

// Only run the server automatically if this module is executed directly, not when imported
if (require.main === module) {
  // For backward compatibility, we keep the main function but it will use our new startServer function
  startServer().catch(error => {
    console.error('Failed to start Yelp Fusion AI MCP server:', error);
    process.exit(1);
  });
}

// Export the McpServer class for advanced usage
export { McpServer };