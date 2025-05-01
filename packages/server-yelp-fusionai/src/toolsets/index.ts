/**
 * Defines and initializes all toolsets for the Yelp Fusion MCP server
 */
import { z } from 'zod';
import { 
  createToolset, 
  createToolsetGroup, 
  addReadToolsToToolset, 
  addWriteToolsToToolset
} from '../utils/toolsets.js';
import { initializeDynamicToolset } from './dynamic.js';
import {
  formatYelpAIResponse,
  formatBusinessSearchResponse,
  formatBusinessDetailsResponse,
  formatReviewsResponse,
  formatReviewHighlightsResponse,
  formatCategoriesResponse,
  formatEventsSearchResponse,
  formatEventDetailsResponse,
  formatWaitlistStatusResponse,
  formatWaitlistInfoResponse,
  formatWaitlistVisitDetailsResponse,
  formatRespondToReviewResponse,
  formatWaitlistPartnerRestaurantsResponse,
  formatJoinQueueResponse,
  formatOAuthTokenResponse,
  formatRespondReviewsBusinessesResponse,
  formatRespondReviewsGetTokenResponse,
  formatAdvertisingProgramResponse,
  formatAdvertisingProgramListResponse,
  formatAdvertisingProgramStatusResponse
} from '../utils/formatters/index.js';

import dotenv from 'dotenv';
dotenv.config();

// Base URL for Yelp Fusion API
const YELP_API_BASE_URL = 'https://api.yelp.com/v3';
const YELP_API_KEY = process.env.YELP_API_KEY;

// --> Add Logging <--
console.log(`[DEBUG] YELP_API_KEY check in toolsets/index.ts: ${YELP_API_KEY ? 'Found' : 'MISSING!'}`);

// Check if API key is available
if (!YELP_API_KEY) {
  console.warn('YELP_API_KEY environment variable is not set. API calls will likely fail.');
}

// Helper function for making API requests to Yelp
async function fetchFromYelp(endpoint: string, params: Record<string, any> = {}, method = 'GET', body?: any) {
  try {
    // Validate API key is available
    if (!YELP_API_KEY) {
      throw new Error('Yelp API key is not configured. Please set the YELP_API_KEY environment variable.');
    }

    const url = new URL(`${YELP_API_BASE_URL}${endpoint}`);
    
    // Add query parameters
    if (method === 'GET' && params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    // Set up request options
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
        'Content-Type': 'application/json',
      }
    };
    
    // Add body for non-GET requests
    if (method !== 'GET' && body) {
      options.body = JSON.stringify(body);
    }
    
    // Make the request with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    options.signal = controller.signal;
    
    try {
      const response = await fetch(url.toString(), options);
      clearTimeout(timeoutId);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        const statusCode = response.status;
        
        // Handle specific error codes
        if (statusCode === 401) {
          throw new Error('Authentication failed: Invalid API key or unauthorized access');
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded: Too many requests to the Yelp API');
        } else if (statusCode >= 500) {
          throw new Error(`Yelp API server error (${statusCode}): ${errorText}`);
        } else {
          throw new Error(`Yelp API error (${statusCode}): ${errorText}`);
        }
      }
      
      // Parse and return the response
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out after 30 seconds');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error in Yelp API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Initialize all toolsets for the Yelp Fusion MCP server
 */
export function initializeToolsets(enableDynamicToolsets = true): void {
  // Create main toolset groups
  createToolsetGroup(
    'discovery',
    'Discovery',
    'Tools for discovering businesses, events, and content on Yelp'
  );
  
  createToolsetGroup(
    'interaction',
    'Interaction',
    'Tools for interacting with Yelp businesses and content'
  );
  
  createToolsetGroup(
    'business_owner',
    'Business Owner',
    'Tools for business owners to manage their Yelp presence'
  );

  // 1. Business Search Toolset
  createToolset(
    'business_search',
    'Business Search',
    'Tools for searching and discovering businesses on Yelp',
    [], // Empty initially, we'll add tools separately
    'discovery' // Parent group
  );
  
  // Add read-only tools to business search toolset
  addReadToolsToToolset(
    'business_search',
    {
      name: 'yelpBusinessSearch',
      description: 'Search for businesses using specific parameters via the Yelp Fusion API',
      schema: {
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
      handler: async (args) => {
        const response = await fetchFromYelp('/businesses/search', args);
        return formatBusinessSearchResponse(response);
      },
      category: 'search'
    },
    {
      name: 'yelpBusinessDetails',
      description: 'Get detailed information about a specific business by ID',
      schema: { 
        id: z.string().describe('The business ID to get details for') 
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/businesses/${args.id}`);
        return formatBusinessDetailsResponse(response);
      },
      category: 'details'
    },
    {
      name: 'yelpCategories',
      description: 'Get a list of all business categories on Yelp',
      schema: {
        locale: z.string().optional().describe('Locale (default: en_US)')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/categories', { locale: args.locale });
        return formatCategoriesResponse(response);
      },
      category: 'reference'
    }
  );
  
  // Add write tools (in this case, AI search is considered write as it may train on input)
  addWriteToolsToToolset(
    'business_search',
    {
      name: 'yelpQuery',
      description: 'Search for businesses and get recommendations using natural language via the Yelp Fusion AI API',
      schema: {
        query: z.string().describe('Your natural language query about businesses, locations, or recommendations')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/chat', {}, 'POST', { query: args.query });
        return formatYelpAIResponse(response);
      },
      category: 'ai'
    }
  );

  // 2. Reviews Toolset
  createToolset(
    'reviews',
    'Reviews',
    'Tools for working with business reviews on Yelp',
    [], // Empty initially
    'discovery' // Parent group
  );
  
  // Add read-only tools
  addReadToolsToToolset(
    'reviews',
    {
      name: 'yelpBusinessReviews',
      description: 'Get reviews for a specific business',
      schema: {
        id: z.string().describe('The business ID to get reviews for'),
        locale: z.string().optional().describe('Locale (default: en_US)'),
        sort_by: z.enum(['yelp_sort', 'newest', 'oldest', 'highest_rated', 'lowest_rated']).optional().describe('Sorting mode'),
        limit: z.number().optional().describe('Number of reviews to return (default: 20, max: 50)'),
        offset: z.number().optional().describe('Offset for pagination')
      },
      handler: async (args) => {
        const { id, ...params } = args;
        const response = await fetchFromYelp(`/businesses/${id}/reviews`, params);
        return formatReviewsResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpReviewHighlights',
      description: 'Get highlighted snippets from reviews for a business',
      schema: {
        id: z.string().describe('The business ID to get review highlights for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/businesses/${args.id}/reviews/highlights`);
        return formatReviewHighlightsResponse(response);
      },
      category: 'read'
    }
  );

  // 3. Events Toolset
  createToolset(
    'events',
    'Events',
    'Tools for finding and getting information about events on Yelp',
    [], // Empty initially
    'discovery' // Parent group
  );
  
  // Add read-only tools
  addReadToolsToToolset(
    'events',
    {
      name: 'yelpEventsSearch',
      description: 'Search for events in a location',
      schema: {
        location: z.string().optional().describe('Location string (e.g. "San Francisco, CA")'),
        latitude: z.number().optional().describe('Latitude coordinate'),
        longitude: z.number().optional().describe('Longitude coordinate'),
        radius: z.number().optional().describe('Search radius in meters (max 40000)'),
        categories: z.string().optional().describe('Comma-separated list of category names'),
        is_free: z.boolean().optional().describe('Filter for free events'),
        start_date: z.number().optional().describe('Event start date as Unix timestamp'),
        end_date: z.number().optional().describe('Event end date as Unix timestamp'),
        limit: z.number().optional().describe('Number of results (default: 20, max: 50)'),
        offset: z.number().optional().describe('Offset for pagination'),
        sort_by: z.enum(['popularity', 'time_start', 'distance']).optional().describe('Sorting mode'),
        sort_on: z.string().optional().describe('Field to sort on'),
        sort_order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
        exclude_start: z.boolean().optional().describe('Exclude events that have already started')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/events', args);
        return formatEventsSearchResponse(response);
      },
      category: 'search'
    },
    {
      name: 'yelpEventDetails',
      description: 'Get detailed information about a specific event by ID',
      schema: {
        id: z.string().describe('The event ID to get details for'),
        locale: z.string().optional().describe('Locale (default: en_US)')
      },
      handler: async (args) => {
        const { id, ...params } = args;
        const response = await fetchFromYelp(`/events/${id}`, params);
        return formatEventDetailsResponse(response);
      },
      category: 'details'
    },
    {
      name: 'yelpFeaturedEvent',
      description: 'Get the featured event for a location',
      schema: {
        location: z.string().optional().describe('Location string (e.g. "San Francisco, CA")'),
        latitude: z.number().optional().describe('Latitude coordinate'),
        longitude: z.number().optional().describe('Longitude coordinate'),
        locale: z.string().optional().describe('Locale (default: en_US)')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/events/featured', args);
        return formatEventDetailsResponse(response);
      },
      category: 'featured'
    }
  );

  // 4. Waitlist Toolset
  createToolset(
    'waitlist',
    'Waitlist',
    'Tools for managing restaurant waitlists on Yelp',
    [], // Empty initially
    'interaction' // Parent group
  );
  
  // Add read-only tools
  addReadToolsToToolset(
    'waitlist',
    {
      name: 'yelpWaitlistPartnerRestaurants',
      description: 'Get restaurants that support Yelp Waitlist',
      schema: {
        location: z.string().optional().describe('Location string (e.g. "San Francisco, CA")'),
        latitude: z.number().optional().describe('Latitude coordinate'),
        longitude: z.number().optional().describe('Longitude coordinate'),
        distance: z.number().optional().describe('Search radius in miles'),
        sort_by: z.enum(['distance', 'estimated_wait']).optional().describe('Sorting mode'),
        category: z.string().optional().describe('Filter by category'),
        price: z.string().optional().describe('Pricing levels to filter by (1, 2, 3, 4)'),
        open_at: z.number().optional().describe('Filter for businesses open at this Unix time'),
        available_at: z.number().optional().describe('Filter for businesses available at this Unix time'),
        min_estimate: z.number().optional().describe('Minimum estimated wait time'),
        max_estimate: z.number().optional().describe('Maximum estimated wait time'),
        search_text: z.string().optional().describe('Search by name or keyword'),
        limit: z.number().optional().describe('Number of results')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/waitlist/partner/restaurants', args);
        return formatWaitlistPartnerRestaurantsResponse(response);
      },
      category: 'search'
    },
    {
      name: 'yelpWaitlistStatus',
      description: 'Get current waitlist status for a business',
      schema: {
        business_id: z.string().describe('The business ID to get waitlist status for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/waitlist/businesses/${args.business_id}/status`);
        return formatWaitlistStatusResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpWaitlistInfo',
      description: 'Get detailed waitlist configuration for a business',
      schema: {
        business_id: z.string().describe('The business ID to get waitlist info for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/waitlist/businesses/${args.business_id}/info`);
        return formatWaitlistInfoResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpWaitlistVisitDetails',
      description: 'Get details about a waitlist visit',
      schema: {
        business_id: z.string().describe('The business ID'),
        visit_id: z.string().describe('The visit ID to get details for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/waitlist/businesses/${args.business_id}/visits/${args.visit_id}`);
        return formatWaitlistVisitDetailsResponse(response);
      },
      category: 'read'
    }
  );
  
  // Add write tools
  addWriteToolsToToolset(
    'waitlist',
    {
      name: 'yelpJoinWaitlist',
      description: 'Join a restaurant\'s waitlist remotely',
      schema: {
        business_id: z.string().describe('The business ID to join the waitlist for'),
        party_size: z.number().describe('Number of people in the party'),
        seating_preference: z.string().optional().describe('Seating preference'),
        first_name: z.string().describe('First name of customer'),
        last_name: z.string().optional().describe('Last name of customer'),
        phone: z.string().describe('Phone number of customer'),
        email: z.string().optional().describe('Email of customer'),
        notes: z.string().optional().describe('Additional notes for the restaurant')
      },
      handler: async (args) => {
        const { business_id, ...params } = args;
        const response = await fetchFromYelp(`/waitlist/businesses/${business_id}/queue`, {}, 'POST', params);
        return formatJoinQueueResponse(response);
      },
      category: 'write'
    },
    {
      name: 'yelpOnMyWay',
      description: 'Notify a restaurant that you\'re on your way',
      schema: {
        business_id: z.string().describe('The business ID to notify'),
        visit_id: z.string().describe('The visit ID from the waitlist'),
        minutes_away: z.number().describe('Estimated minutes away')
      },
      handler: async (args) => {
        const { business_id, visit_id, minutes_away } = args;
        await fetchFromYelp(
          `/waitlist/businesses/${business_id}/visits/${visit_id}/on_my_way`, 
          {}, 
          'POST', 
          { minutes_away }
        );
        return {
          content: [{ type: 'text', text: `Successfully notified business that you're ${minutes_away} minutes away.` }]
        };
      },
      category: 'write'
    },
    {
      name: 'yelpCancelWaitlistVisit',
      description: 'Cancel a waitlist visit',
      schema: {
        business_id: z.string().describe('The business ID'),
        visit_id: z.string().describe('The visit ID to cancel')
      },
      handler: async (args) => {
        const { business_id, visit_id } = args;
        await fetchFromYelp(
          `/waitlist/businesses/${business_id}/visits/${visit_id}`,
          {},
          'DELETE'
        );
        return {
          content: [{ type: 'text', text: `Successfully canceled waitlist visit ${visit_id}.` }]
        };
      },
      category: 'write'
    }
  );

  // 5. Respond to Reviews Toolset
  createToolset(
    'respond_reviews',
    'Respond to Reviews',
    'Tools for business owners to respond to Yelp reviews',
    [], // Empty initially
    'business_owner' // Parent group
  );
  
  // Add read-only tools
  addReadToolsToToolset(
    'respond_reviews',
    {
      name: 'yelpRespondReviewsBusinesses',
      description: 'Get businesses that the user can respond to reviews for',
      schema: {
        access_token: z.string().describe('OAuth access token')
      },
      handler: async () => {
        const response = await fetchFromYelp('/businesses/respond-reviews', {}, 'GET', null);
        return formatRespondReviewsBusinessesResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpRespondReviewsBusinessOwner',
      description: 'Get business owner information',
      schema: {
        access_token: z.string().describe('OAuth access token'),
        business_id: z.string().describe('The business ID')
      },
      handler: async (args) => {
        const { business_id } = args;
        const response = await fetchFromYelp(
          `/businesses/${business_id}/owner`,
          {},
          'GET', 
          null
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      },
      category: 'read'
    }
  );
  
  // Add write tools
  addWriteToolsToToolset(
    'respond_reviews',
    {
      name: 'yelpRespondReviewsGetToken',
      description: 'Get an OAuth access token for responding to reviews',
      schema: {
        code: z.string().describe('OAuth authorization code'),
        redirect_uri: z.string().describe('Redirect URI from OAuth flow')
      },
      handler: async (args) => {
        const { code, redirect_uri } = args;
        const response = await fetchFromYelp(
          '/oauth2/token',
          {},
          'POST',
          {
            grant_type: 'authorization_code',
            code,
            redirect_uri,
            client_id: process.env.YELP_CLIENT_ID,
            client_secret: process.env.YELP_CLIENT_SECRET
          }
        );
        return formatRespondReviewsGetTokenResponse(response);
      },
      category: 'auth'
    },
    {
      name: 'yelpRespondToReview',
      description: 'Respond to a review as a business owner',
      schema: {
        review_id: z.string().describe('The review ID to respond to'),
        comment: z.string().describe('The response comment text')
      },
      handler: async (args) => {
        const { review_id, comment } = args;
        const response = await fetchFromYelp(
          `/reviews/${review_id}/respond`,
          {},
          'POST',
          { comment }
        );
        return formatRespondToReviewResponse(response);
      },
      category: 'write'
    }
  );

  // 6. Advertising Toolset
  createToolset(
    'advertising',
    'Advertising',
    'Tools for managing advertising campaigns on Yelp',
    [], // Empty initially
    'business_owner' // Parent group
  );
  
  // Add read-only tools
  addReadToolsToToolset(
    'advertising',
    {
      name: 'yelpListAdPrograms',
      description: 'List all advertising programs',
      schema: {
        business_id: z.string().optional().describe('Filter by business ID'),
        limit: z.number().optional().describe('Number of results'),
        offset: z.number().optional().describe('Offset for pagination')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/advertising/programs', args);
        return formatAdvertisingProgramListResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpGetAdProgram',
      description: 'Get details of a specific advertising program',
      schema: {
        program_id: z.string().describe('The program ID to get details for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/advertising/programs/${args.program_id}`);
        return formatAdvertisingProgramResponse(response);
      },
      category: 'read'
    },
    {
      name: 'yelpAdProgramStatus',
      description: 'Get status information for an advertising program',
      schema: {
        program_id: z.string().describe('The program ID to get status for')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(`/advertising/programs/${args.program_id}/status`);
        return formatAdvertisingProgramStatusResponse(response);
      },
      category: 'read'
    }
  );
  
  // Add write tools
  addWriteToolsToToolset(
    'advertising',
    {
      name: 'yelpCreateAdProgram',
      description: 'Create a new advertising program',
      schema: {
        business_id: z.string().describe('The business ID to advertise'),
        ad_product: z.string().describe('The advertising product type'),
        currency_code: z.string().describe('Currency code (e.g. USD)'),
        budget: z.number().describe('Monthly budget amount'),
        start_time: z.string().describe('Start time (ISO 8601)'),
        payment_method_token: z.string().describe('Payment method token')
      },
      handler: async (args) => {
        const response = await fetchFromYelp('/advertising/programs', {}, 'POST', args);
        return {
          content: [{ type: 'text', text: `Ad program created with ID: ${response.program_id}` }]
        };
      },
      category: 'create'
    },
    {
      name: 'yelpModifyAdProgram',
      description: 'Modify an existing advertising program',
      schema: {
        program_id: z.string().describe('The program ID to modify'),
        budget: z.number().optional().describe('New monthly budget amount'),
        payment_method_token: z.string().optional().describe('New payment method token')
      },
      handler: async (args) => {
        const { program_id, ...updateData } = args;
        await fetchFromYelp(
          `/advertising/programs/${program_id}`,
          {},
          'PATCH',
          updateData
        );
        return {
          content: [{ type: 'text', text: `Ad program ${program_id} successfully modified` }]
        };
      },
      category: 'update'
    },
    {
      name: 'yelpPauseAdProgram',
      description: 'Pause an active advertising program',
      schema: {
        program_id: z.string().describe('The program ID to pause')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(
          `/advertising/programs/${args.program_id}/pause`,
          {},
          'POST'
        );
        return {
          content: [{ type: 'text', text: `Ad program ${args.program_id} paused until ${response.resume_time}` }]
        };
      },
      category: 'update'
    },
    {
      name: 'yelpResumeAdProgram',
      description: 'Resume a paused advertising program',
      schema: {
        program_id: z.string().describe('The program ID to resume')
      },
      handler: async (args) => {
        await fetchFromYelp(
          `/advertising/programs/${args.program_id}/resume`,
          {},
          'POST'
        );
        return {
          content: [{ type: 'text', text: `Ad program ${args.program_id} successfully resumed` }]
        };
      },
      category: 'update'
    },
    {
      name: 'yelpTerminateAdProgram',
      description: 'Terminate an advertising program',
      schema: {
        program_id: z.string().describe('The program ID to terminate')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(
          `/advertising/programs/${args.program_id}`,
          {},
          'DELETE'
        );
        return {
          content: [{ type: 'text', text: `Ad program ${args.program_id} terminated. ${response.message}` }]
        };
      },
      category: 'delete'
    }
  );

  // 7. OAuth Toolset - separate from other groups, as it's a utility
  createToolset(
    'oauth',
    'OAuth',
    'Tools for Yelp OAuth authentication'
  );
  
  // Add write tools (all OAuth tools are write operations)
  addWriteToolsToToolset(
    'oauth',
    {
      name: 'yelpGetOAuthToken',
      description: 'Get an OAuth access token (v2 or v3)',
      schema: {
        version: z.enum(['v2', 'v3']).describe('OAuth version to use'),
        grant_type: z.enum(['authorization_code', 'refresh_token']).describe('Grant type'),
        code: z.string().optional().describe('Authorization code (for authorization_code grant)'),
        redirect_uri: z.string().optional().describe('Redirect URI (for authorization_code grant)'),
        refresh_token: z.string().optional().describe('Refresh token (for refresh_token grant)')
      },
      handler: async (args) => {
        const { version, grant_type, code, redirect_uri, refresh_token } = args;
        
        const endpoint = version === 'v2' ? '/oauth2/token' : '/oauth/v3/token';
        const body: Record<string, any> = {
          grant_type,
          client_id: process.env.YELP_CLIENT_ID,
          client_secret: process.env.YELP_CLIENT_SECRET
        };
        
        if (grant_type === 'authorization_code') {
          body.code = code;
          body.redirect_uri = redirect_uri;
        } else if (grant_type === 'refresh_token') {
          body.refresh_token = refresh_token;
        }
        
        const response = await fetchFromYelp(endpoint, {}, 'POST', body);
        return formatOAuthTokenResponse(response, version);
      },
      category: 'auth'
    },
    {
      name: 'yelpRefreshOAuthToken',
      description: 'Refresh an OAuth v3 access token',
      schema: {
        refresh_token: z.string().describe('Refresh token')
      },
      handler: async (args) => {
        const response = await fetchFromYelp(
          '/oauth/v3/token',
          {},
          'POST',
          {
            grant_type: 'refresh_token',
            refresh_token: args.refresh_token,
            client_id: process.env.YELP_CLIENT_ID,
            client_secret: process.env.YELP_CLIENT_SECRET
          }
        );
        return formatOAuthTokenResponse(response, 'v3');
      },
      category: 'auth'
    },
    {
      name: 'yelpRevokeOAuthToken',
      description: 'Revoke an OAuth access token',
      schema: {
        token: z.string().describe('Access token to revoke')
      },
      handler: async (args) => {
        await fetchFromYelp(
          '/oauth2/revoke',
          {},
          'POST',
          {
            token: args.token,
            client_id: process.env.YELP_CLIENT_ID,
            client_secret: process.env.YELP_CLIENT_SECRET
          }
        );
        return { content: [{ type: 'text', text: 'OAuth token successfully revoked.' }] };
      },
      category: 'auth'
    }
  );

  // Initialize the dynamic toolset last (if enabled)
  if (enableDynamicToolsets) {
    initializeDynamicToolset();
  }
}