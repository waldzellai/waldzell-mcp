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

// Define our implementation
const server = new McpServer({
  instructions: `
  # Yelp Fusion AI MCP Server

  This server provides access to Yelp Fusion API services through a conversational interface.
  
  Available Tools:
  
  Search Tools:
  - yelpQuery: Natural language business search
  - yelpBusinessSearch: Parameter-based business search
  - yelpBusinessDetails: Get business details by ID
  - yelpBusinessReviews: Get business reviews
  - yelpReviewHighlights: Get highlighted snippets from reviews
  - yelpCategories: Get all business categories
  - yelpEventsSearch: Search for events in a location
  - yelpEventDetails: Get detailed information about a specific event
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
  - yelpOnMyWay: Notify a restaurant that you're on your way
  - yelpCancelWaitlistVisit: Cancel a waitlist visit
  - yelpWaitlistVisitDetails: Get details about a waitlist visit
  
  Respond to Reviews Tools:
  - yelpRespondReviewsGetToken: Get an OAuth access token for responding to reviews
  - yelpRespondReviewsBusinesses: Get businesses that the user can respond to reviews for
  - yelpRespondReviewsBusinessOwner: Get business owner information
  - yelpRespondToReview: Respond to a review as a business owner
  `,
  
  tools: {
    // Respond Reviews Tools
    yelpRespondReviewsGetToken: {
      description: "Get an OAuth access token for responding to reviews",
      schema: z.object({
        client_id: z.string().describe('Client ID'),
        client_secret: z.string().describe('Client secret'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getAccessToken(args.client_id, args.client_secret);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsTokenResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting access token: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondReviewsBusinesses: {
      description: "Get businesses that the user can respond to reviews for",
      schema: z.object({
        limit: z.number().optional().describe('Number of results to return (max 50)'),
        offset: z.number().optional().describe('Offset the list of returned results by this amount'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getBusinesses(args);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsBusinessesResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting businesses: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondReviewsBusinessOwner: {
      description: "Get business owner information",
      schema: z.object({
        business_id: z.string().describe('Business ID'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.getBusinessOwnerInfo(args.business_id);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondReviewsBusinessOwnerResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error getting business owner information: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
    
    yelpRespondToReview: {
      description: "Respond to a review as a business owner",
      schema: z.object({
        review_id: z.string().describe('Review ID'),
        text: z.string().describe('Response text'),
      }),
      async (args): Promise<CallToolResult> => {
        try {
          const response = await yelpService.respondReviews.respondToReview(args.review_id, args.text);
          
          return {
            content: [
              {
                type: 'text',
                text: formatRespondToReviewResponse(response)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error responding to review: ${(error as Error).message}`
              }
            ]
          };
        }
      }
    },
  }
});

/**
 * Format respond reviews token response
 */
function formatRespondReviewsTokenResponse(response: GetAccessTokenResponse): string {
  let formattedResponse = '## OAuth Access Token\n\n';
  formattedResponse += `Token: ${response.access_token}\n`;
  formattedResponse += `Type: ${response.token_type}\n`;
  formattedResponse += `Expires In: ${response.expires_in} seconds\n`;
  
  return formattedResponse;
}

/**
 * Format respond reviews businesses response
 */
function formatRespondReviewsBusinessesResponse(response: GetBusinessesResponse): string {
  let formattedResponse = '## Your Businesses\n\n';
  
  if (response.total !== undefined) {
    formattedResponse += `Total Businesses: ${response.total}\n\n`;
  }
  
  if (response.businesses.length === 0) {
    formattedResponse += 'No businesses found.\n';
    return formattedResponse;
  }
  
  response.businesses.forEach((business, index) => {
    formattedResponse += `### ${index + 1}. ${business.name}\n`;
    formattedResponse += `ID: ${business.id}\n`;
    
    if (business.location?.display_address) {
      formattedResponse += `Address: ${business.location.display_address.join(', ')}\n`;
    }
    
    if (business.business_info) {
      if (business.business_info.review_count !== undefined) {
        formattedResponse += `Reviews: ${business.business_info.review_count}\n`;
      }
      
      if (business.business_info.rating !== undefined) {
        formattedResponse += `Rating: ${business.business_info.rating} stars\n`;
      }
    }
    
    formattedResponse += '\n';
  });
  
  return formattedResponse;
}

/**
 * Format respond reviews business owner response
 */
function formatRespondReviewsBusinessOwnerResponse(response: BusinessOwnerInfo): string {
  let formattedResponse = '## Business Owner Information\n\n';
  
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Business Name: ${response.business_name}\n`;
  
  if (response.owner_name) {
    formattedResponse += `Owner Name: ${response.owner_name}\n`;
  }
  
  if (response.owner_email) {
    formattedResponse += `Owner Email: ${response.owner_email}\n`;
  }
  
  if (response.account_status) {
    formattedResponse += `Account Status: ${response.account_status}\n`;
  }
  
  if (response.permissions && response.permissions.length > 0) {
    formattedResponse += `Permissions: ${response.permissions.join(', ')}\n`;
  }
  
  return formattedResponse;
}

/**
 * Format respond to review response
 */
function formatRespondToReviewResponse(response: RespondToReviewResponse): string {
  let formattedResponse = '## Response Submitted\n\n';
  
  formattedResponse += `Review ID: ${response.review_id}\n`;
  formattedResponse += `Business ID: ${response.business_id}\n`;
  formattedResponse += `Response: ${response.text}\n`;
  
  if (response.success) {
    formattedResponse += `Status: Success\n`;
  } else {
    formattedResponse += `Status: Failed\n`;
  }
  
  if (response.created_at) {
    const created = new Date(response.created_at).toLocaleString();
    formattedResponse += `Created: ${created}\n`;
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

async function main() {
  const transport = new StdioTransport();
  await server.connect(transport);
  console.error('Yelp Fusion AI MCP server started and connected via stdio');
}

// Start the server when this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

// Export for tests
export default server;