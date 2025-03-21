# Yelp Fusion MCP Server

This project provides an MCP (Model Context Protocol) server that allows AI assistants to communicate with the Yelp Fusion API endpoints. It enables natural language and parameter-based search for businesses, events, and more.

## Features

- Multiple API categories supported:
  - Businesses (including AI-powered natural language search)
  - Reviews
  - Events
  - Categories
  - And 15+ other API categories (OAuth, Advertising, etc.)
- Get detailed business information including ratings, categories, and reviews
- Search for events in specific locations
- Browse business categories
- Format responses as Markdown for better readability
- MCP-compliant interface for easy integration with AI assistants

## Prerequisites

- Node.js 16.x or later
- Yelp Fusion API Key and Client ID (get from [Yelp Fusion](https://fusion.yelp.com/))

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   cd yelp-fusionai-mcp
   npm install
   ```

3. Create a `.env` file in the root directory with your Yelp API credentials:
   ```
   YELP_API_KEY=your_api_key_here
   YELP_CLIENT_ID=your_client_id_here
   ```

## Usage

### Development

To run the server in development mode:

```
npm run dev
```

### Production

Build and start the server:

```
npm run build
npm start
```

## API

The MCP server exposes several tools for interacting with the Yelp Fusion API:

### Tools

1. **yelpQuery**  
   Natural language search using Yelp's AI API
   ```
   {
     "query": "Find pizza places in Chicago"
   }
   ```

2. **yelpBusinessSearch**  
   Parameter-based business search
   ```
   {
     "term": "coffee",
     "location": "San Francisco, CA",
     "price": "1,2",
     "open_now": true
   }
   ```

3. **yelpBusinessDetails**  
   Get detailed information about a specific business
   ```
   {
     "id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

4. **yelpBusinessReviews**  
   Get reviews for a specific business
   ```
   {
     "id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

5. **yelpCategories**  
   Get a list of all business categories
   ```
   {}
   ```

6. **yelpEventsSearch**  
   Search for events in a location
   ```
   {
     "location": "New York, NY",
     "start_date": 1622505600,
     "is_free": true
   }
   ```

7. **yelpEventDetails**  
   Get detailed information about a specific event
   ```
   {
     "id": "oakland-saucy-oakland-restaurant-pop-up"
   }
   ```

8. **yelpFeaturedEvent**  
   Get the featured event for a location
   ```
   {
     "location": "San Francisco, CA"
   }
   ```

9. **yelpReviewHighlights**  
   Get highlighted snippets from reviews for a business
   ```
   {
     "id": "WavvLdfdP6g8aZTtbBQHTw",
     "locale": "en_US",
     "limit": 5,
     "category": "food",
     "sentiment": "positive"
   }
   ```

10. **yelpCreateAdProgram**  
   Create a new advertising program
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw",
     "budget": 50000,
     "objectives": ["increase_traffic", "brand_awareness"],
     "ad_type": "search_ads",
     "geo_targeting": {
       "location": "San Francisco, CA",
       "radius": 10000
     }
   }
   ```

11. **yelpListAdPrograms**  
   List advertising programs
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

12. **yelpGetAdProgram**  
   Get details of an advertising program
   ```
   {
     "program_id": "ad-12345"
   }
   ```

13. **yelpModifyAdProgram**  
   Modify an existing advertising program
   ```
   {
     "program_id": "ad-12345",
     "budget": 75000,
     "objectives": ["increase_traffic", "brand_awareness", "promote_offers"]
   }
   ```

14. **yelpAdProgramStatus**  
   Get status of an advertising program
   ```
   {
     "program_id": "ad-12345"
   }
   ```

15. **yelpPauseAdProgram**  
   Pause an advertising program
   ```
   {
     "program_id": "ad-12345"
   }
   ```

16. **yelpResumeAdProgram**  
   Resume a paused advertising program
   ```
   {
     "program_id": "ad-12345"
   }
   ```

17. **yelpTerminateAdProgram**  
   Terminate an advertising program
   ```
   {
     "program_id": "ad-12345"
   }
   ```

18. **yelpGetOAuthToken**  
   Get an OAuth access token
   ```
   {
     "client_id": "YOUR_CLIENT_ID",
     "client_secret": "YOUR_CLIENT_SECRET",
     "version": "v3"
   }
   ```

19. **yelpRefreshOAuthToken**  
   Refresh an OAuth v3 access token
   ```
   {
     "refresh_token": "YOUR_REFRESH_TOKEN",
     "scope": "read_public,write_public"
   }
   ```

20. **yelpRevokeOAuthToken**  
   Revoke an OAuth access token
   ```
   {
     "token": "YOUR_ACCESS_TOKEN"
   }
   ```

21. **yelpGetOAuthTokenInfo**  
   Get information about an OAuth token
   ```
   {
     "token": "YOUR_ACCESS_TOKEN",
     "version": "v3"
   }
   ```

22. **yelpWaitlistPartnerRestaurants**  
   Get restaurants that support Yelp Waitlist
   ```
   {
     "location": "San Francisco, CA",
     "limit": 10
   }
   ```

23. **yelpWaitlistStatus**  
   Get current waitlist status for a business
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

24. **yelpWaitlistInfo**  
   Get detailed waitlist configuration for a business
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

25. **yelpJoinWaitlist**  
   Join a restaurant's waitlist remotely
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw",
     "party_size": 4,
     "customer_name": "John Smith",
     "customer_phone": "4155551234",
     "notes": "Prefer window seating if available"
   }
   ```

26. **yelpOnMyWay**  
   Notify a restaurant that you're on your way
   ```
   {
     "business_id": "WavvLdfdP6g8aZTtbBQHTw",
     "customer_name": "John Smith",
     "customer_phone": "4155551234",
     "eta_minutes": 15
   }
   ```

27. **yelpCancelWaitlistVisit**  
   Cancel a waitlist visit
   ```
   {
     "visit_id": "abc123def456"
   }
   ```

28. **yelpWaitlistVisitDetails**  
   Get details about a waitlist visit
   ```
   {
     "visit_id": "abc123def456"
   }
   ```

### Example Usage

#### Business and Event Queries
- "Find pizza places in Chicago"
- "Search for coffee shops in San Francisco that are open now and have a price level of $ or $$"
- "Get details for the business with ID WavvLdfdP6g8aZTtbBQHTw"
- "Get reviews for Gary Danko restaurant"
- "Show me review highlights for Gary Danko with positive sentiment about the food"
- "Show me all restaurant categories available on Yelp"
- "Find free events in New York next week"
- "Get details for the event with ID oakland-saucy-oakland-restaurant-pop-up"
- "What's the featured event in San Francisco right now?"

#### Advertising Management
- "Create a new advertising program for business XYZ with a budget of $500"
- "List all advertising programs for my business"
- "Get details about advertising program ABC123"
- "Modify the budget for advertising program ABC123 to $750"
- "Check the status of my advertising program ABC123"
- "Pause my advertising program ABC123"
- "Resume my paused advertising program ABC123"
- "Terminate my advertising program ABC123"

#### OAuth Authentication
- "Get an OAuth token using my client credentials"
- "Refresh my OAuth token that's about to expire"
- "Revoke this OAuth token as it's no longer needed"
- "Check if my OAuth token is still valid and when it expires"

#### Waitlist Management
- "Find restaurants in San Francisco that support Yelp Waitlist"
- "What's the current wait time at restaurant ABC?"
- "Join the waitlist at XYZ Restaurant for a party of 4"
- "Let the restaurant know I'm on my way and will arrive in 15 minutes"
- "I need to cancel my waitlist reservation"
- "Check my current position in the waitlist"

## License

MIT
