# CLAUDE.md - Yelp Fusion MCP Server Guidelines

## Build/Test/Lint Commands
- Build: `npm run build`
- Start: `npm start`
- Dev mode: `npm run dev`
- Run tests: `npm test`
- Run single test: `npm test -- -t "test name"`
- Lint: `npm run lint`
- Format: `npm run format`

## Code Style Guidelines
- TypeScript with strict type checking
- Use async/await for asynchronous operations
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Handle all errors with try/catch blocks
- Format responses as Markdown for better readability
- Prefer named exports over default exports
- Keep functions small and focused on a single task
- Document function parameters with JSDoc comments
- Use the Zod library for validation and schema definition
- Follow MCP specifications for all protocol interactions

## Project Structure
- `/src/index.ts` - Entry point and server configuration
- `/src/toolsets/index.ts` - Defines and initializes all toolsets
- `/src/toolsets/dynamic.ts` - Handles dynamic toolset discovery
- `/src/utils/toolsets.ts` - Utility functions for toolset management
- `/src/utils/formatters/` - Response formatters for different API endpoints
- `/src/schemas/` - Zod schemas for API requests and responses

## Toolset Architecture

The server is organized around the concept of toolsets, which are logical groupings of related tools:

- **Toolset**: A collection of related tools (e.g., business_search, reviews, events)
- **Tool**: An individual function that interacts with the Yelp API (e.g., yelpBusinessSearch)
- **Toolset Group**: A higher-level grouping of toolsets (e.g., discovery, interaction)

### Toolset Groups

1. **Discovery Group**: Tools for discovering businesses, events, and content on Yelp
   - Business Search Toolset
   - Reviews Toolset
   - Events Toolset

2. **Interaction Group**: Tools for interacting with Yelp businesses and content
   - Waitlist Toolset

3. **Business Owner Group**: Tools for business owners to manage their Yelp presence
   - Respond to Reviews Toolset
   - Advertising Toolset
   - OAuth Toolset

## Available Tools

### Business Search Tools
- yelpQuery - Natural language business search
- yelpBusinessSearch - Parameter-based business search
- yelpBusinessDetails - Get business details by ID
- yelpCategories - Get all business categories

### Reviews Tools
- yelpBusinessReviews - Get business reviews
- yelpReviewHighlights - Get highlighted snippets from reviews

### Events Tools
- yelpEventsSearch - Search for events in a location
- yelpEventDetails - Get detailed information about a specific event
- yelpFeaturedEvent - Get the featured event for a location

### Advertising Tools
- yelpCreateAdProgram - Create a new advertising program
- yelpListAdPrograms - List all advertising programs
- yelpGetAdProgram - Get details of a specific advertising program
- yelpModifyAdProgram - Modify an existing advertising program
- yelpAdProgramStatus - Get status information for an advertising program
- yelpPauseAdProgram - Pause an active advertising program
- yelpResumeAdProgram - Resume a paused advertising program
- yelpTerminateAdProgram - Terminate an advertising program

### OAuth Tools
- yelpGetOAuthToken - Get an OAuth access token (v2 or v3)
- yelpRefreshOAuthToken - Refresh an OAuth v3 access token
- yelpRevokeOAuthToken - Revoke an OAuth access token

### Waitlist Tools
- yelpWaitlistPartnerRestaurants - Get restaurants that support Yelp Waitlist
- yelpWaitlistStatus - Get current waitlist status for a business
- yelpWaitlistInfo - Get detailed waitlist configuration for a business
- yelpJoinWaitlist - Join a restaurant's waitlist remotely
- yelpOnMyWay - Notify a restaurant that you're on your way
- yelpCancelWaitlistVisit - Cancel a waitlist visit
- yelpWaitlistVisitDetails - Get details about a waitlist visit

### Respond Reviews Tools
- yelpRespondReviewsGetToken - Get an OAuth access token for responding to reviews
- yelpRespondReviewsBusinesses - Get businesses that the user can respond to reviews for
- yelpRespondReviewsBusinessOwner - Get business owner information
- yelpRespondToReview - Respond to a review as a business owner

## Configuration Options

### Command Line Options
- `--enable-dynamic-toolsets` - Enable dynamic toolset discovery (default)
- `--disable-dynamic-toolsets` - Disable dynamic toolset discovery
- `--disabled-toolsets <ids>` - Comma-separated list of toolset IDs to disable
- `--help`, `-h` - Show help message

### Environment Variables
- `YELP_API_KEY` - Required Yelp API key
- `YELP_CLIENT_ID` - Optional Yelp client ID
- `YELP_ENABLE_DYNAMIC_TOOLSETS` - Set to "false" to disable dynamic toolsets
- `YELP_DISABLED_TOOLSETS` - Comma-separated list of toolset IDs to disable

## Request/Response Patterns
Each tool follows a similar pattern:
1. Validate user input with Zod
2. Call the appropriate Yelp API endpoint
3. Transform the response into formatted Markdown
4. Return the formatted content to the user

## Error Handling
- API key errors are properly reported with clear error messages
- Network timeouts are handled with a 30-second limit
- HTTP status codes are translated into meaningful error messages
- All errors include proper error codes and descriptive messages