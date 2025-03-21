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
- `/src/services/api/` - API clients organized by category
- `/src/services/yelp.ts` - Main service that aggregates all API clients
- `/src/index.ts` - MCP server implementation with tool definitions

## Available Tools
- yelpQuery - Natural language business search
- yelpBusinessSearch - Parameter-based business search
- yelpBusinessDetails - Get business details by ID
- yelpBusinessReviews - Get business reviews
- yelpReviewHighlights - Get highlighted snippets from reviews
- yelpCategories - Get all business categories
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
- yelpGetOAuthTokenInfo - Get information about an OAuth token

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

## Request/Response Patterns
Each tool follows a similar pattern:
1. Validate user input with Zod
2. Call the appropriate Yelp API endpoint
3. Transform the response into formatted Markdown
4. Return the formatted content to the user