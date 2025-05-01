#!/usr/bin/env node

// Import and configure dotenv to load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Import SDK
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import toolsets
import { initializeToolsets } from './toolsets/index.js';
import { registerAllToolsets, getToolset, setToolsetEnabled } from './utils/toolsets.js';

/**
 * Helper function to start the MCP server on a specific port
 * @param options Server configuration options
 * @param port Port number to listen on (default: 3000)
 * @returns The server instance
 */
export function startServer(
  options: {
    enableDynamicToolsets?: boolean;
    disabledToolsets?: string[];
  } = {},
  port = 3000
): Promise<Server> {
  const server = createServer(options);
  // Note: The new Server class doesn't have a listen method
  // We would need to use a different transport for HTTP
  console.log(`Yelp Fusion MCP server running on port ${port}`);
  return Promise.resolve(server);
}

/**
 * Create a new MCP server instance without starting it
 * @param options Configuration options for the server
 * @returns The configured MCP server instance
 */
export function createServer(options: {
  enableDynamicToolsets?: boolean;
  disabledToolsets?: string[];
} = {}) {
  // Define our implementation
  const server = new Server({
    name: 'server-yelp-fusionai',
    version: '1.1.1',
  }, {
    capabilities: {
      tools: {}
    },
    // Optional server options - reuse the existing instructions
    instructions: `
      This server provides tools to interact with the Yelp Fusion API, allowing you to search for businesses, events, and more.

      Available tools are organized into the following categories:

      Business Search:
      - yelpQuery: Search using natural language (AI-powered)
      - yelpBusinessSearch: Parameter-based business search
      - yelpBusinessDetails: Get detailed information about a specific business by ID
      - yelpCategories: Get a list of all Yelp business categories

      Reviews:
      - yelpBusinessReviews: Get reviews for a specific business
      - yelpReviewHighlights: Get highlighted snippets from reviews for a business

      Events:
      - yelpEventsSearch: Search for events in a location
      - yelpEventDetails: Get detailed information about a specific event by ID
      - yelpFeaturedEvent: Get the featured event for a location

      Waitlist:
      - yelpWaitlistPartnerRestaurants: Get restaurants that support Yelp Waitlist
      - yelpWaitlistStatus: Get current waitlist status for a business
      - yelpWaitlistInfo: Get detailed waitlist configuration for a business
      - yelpJoinWaitlist: Join a restaurant's waitlist remotely
      - yelpOnMyWay: Notify a restaurant that you're on your way
      - yelpCancelWaitlistVisit: Cancel a waitlist visit
      - yelpWaitlistVisitDetails: Get details about a waitlist visit

      Respond to Reviews:
      - yelpRespondReviewsGetToken: Get an OAuth access token for responding to reviews
      - yelpRespondReviewsBusinesses: Get businesses that the user can respond to reviews for
      - yelpRespondReviewsBusinessOwner: Get business owner information
      - yelpRespondToReview: Respond to a review as a business owner

      Advertising:
      - yelpCreateAdProgram: Create a new advertising program
      - yelpListAdPrograms: List all advertising programs
      - yelpGetAdProgram: Get details of a specific advertising program
      - yelpModifyAdProgram: Modify an existing advertising program
      - yelpAdProgramStatus: Get status information for an advertising program
      - yelpPauseAdProgram: Pause an active advertising program
      - yelpResumeAdProgram: Resume a paused advertising program
      - yelpTerminateAdProgram: Terminate an advertising program

      OAuth:
      - yelpGetOAuthToken: Get an OAuth access token (v2 or v3)
      - yelpRefreshOAuthToken: Refresh an OAuth v3 access token
      - yelpRevokeOAuthToken: Revoke an OAuth access token
    `
  });

  // Set default options
  const enableDynamicToolsets = options.enableDynamicToolsets !== false;
  const disabledToolsets = options.disabledToolsets || [];
  
  // Initialize all toolsets
  console.log('[DEBUG] >>> Calling initializeToolsets...');
  initializeToolsets(enableDynamicToolsets);
  console.log('[DEBUG] <<< Finished initializeToolsets.');
  
  // If specific toolsets are disabled, set their state
  if (disabledToolsets.length > 0) {
    for (const toolsetId of disabledToolsets) {
      try {
        const toolset = getToolset(toolsetId);
        if (toolset && toolsetId !== 'dynamic') {
          setToolsetEnabled(toolsetId, false);
        }
      } catch (error) {
        console.error(`Error disabling toolset ${toolsetId}:`, error);
      }
    }
  }
  
  // Register all tools from enabled toolsets
  console.log('[DEBUG] >>> Calling registerAllToolsets...');
  registerAllToolsets(server);
  console.log('[DEBUG] <<< Finished registerAllToolsets.');

  return server;
}

// Main function to start the server
async function main() {
  try {
    // Check for command-line arguments
    const args = process.argv.slice(2);
    const options: { enableDynamicToolsets?: boolean; disabledToolsets?: string[] } = {};
    
    // Parse command-line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--disable-dynamic-toolsets') {
        options.enableDynamicToolsets = false;
      } else if (arg === '--disabled-toolsets' && i + 1 < args.length) {
        options.disabledToolsets = args[++i].split(',');
      } else if (arg === '--enable-dynamic-toolsets') {
        options.enableDynamicToolsets = true;
      } else if (arg === '--help' || arg === '-h') {
        console.log(`
Yelp Fusion MCP Server

Options:
  --enable-dynamic-toolsets       Enable dynamic toolset discovery (default)
  --disable-dynamic-toolsets      Disable dynamic toolset discovery
  --disabled-toolsets <ids>       Comma-separated list of toolset IDs to disable
                                  Example: --disabled-toolsets advertising,waitlist
  --help, -h                      Show this help message
        `);
        process.exit(0);
      }
    }

    // Check for environment variables
    if (process.env.YELP_ENABLE_DYNAMIC_TOOLSETS === 'false') {
      options.enableDynamicToolsets = false;
    }
    if (process.env.YELP_DISABLED_TOOLSETS) {
      options.disabledToolsets = process.env.YELP_DISABLED_TOOLSETS.split(',');
    }

    // Create and start server with parsed options
    const server = createServer(options);
    await server.connect(new StdioServerTransport());
    
    // Log startup information
    console.log('Yelp Fusion MCP Server started successfully');
    console.log(`Dynamic toolsets: ${options.enableDynamicToolsets !== false ? 'Enabled' : 'Disabled'}`);
    if (options.disabledToolsets && options.disabledToolsets.length > 0) {
      console.log(`Disabled toolsets: ${options.disabledToolsets.join(', ')}`);
    }
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Run the server if this is the main module
// This check enables the file to be both imported as a module and run directly
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
} else if (import.meta.url.endsWith('/index.js') || import.meta.url.endsWith('/index.ts')) {
  main().catch(console.error);
}