# Yelp Fusion AI MCP Server

An MCP (Model Context Protocol) server that wraps the Yelp Fusion API, exposing it as tools for LLM consumption. Implements the MCP 2025-11-25 protocol with Streamable HTTP transport.

## Features

- **Business Search**: Find businesses by location, category, and various filters
- **Business Details**: Get comprehensive information about specific businesses
- **Reviews**: Access reviews and highlighted snippets
- **AI Chat**: Conversational interface to Yelp's AI for recommendations (with streaming support)
- **Events**: Search for local events and activities
- **Autocomplete**: Get search suggestions
- **Categories**: Browse Yelp's business category taxonomy

## Installation

```bash
npm install
npm run build
```

## Configuration

The server requires a Yelp Fusion API key. Get one at [Yelp Fusion](https://www.yelp.com/developers/v3/manage_app).

```bash
export YELP_API_KEY=your_api_key_here
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `YELP_API_KEY` | Yelp Fusion API key (required) | - |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `0.0.0.0` |

## Usage

### Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

### Health Check

```bash
curl http://localhost:3000/health
```

### MCP Endpoint

The server exposes an MCP endpoint at `/mcp` that accepts:
- `POST /mcp` - Send MCP requests
- `GET /mcp` - Establish SSE stream
- `DELETE /mcp` - Terminate session

### Claude Desktop Configuration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "yelp": {
      "command": "node",
      "args": ["/path/to/server-yelp-fusionai/dist/index.js"],
      "env": {
        "YELP_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## Available Tools

### Business Search

| Tool | Description |
|------|-------------|
| `yelp_search` | Search businesses by location and term |
| `yelp_phone_search` | Find business by phone number |
| `yelp_business_match` | Match business by name/address |
| `yelp_business_details` | Get full business details |

### Reviews

| Tool | Description |
|------|-------------|
| `yelp_reviews` | Get business reviews |
| `yelp_review_highlights` | Get highlighted review snippets |

### AI Chat

| Tool | Description |
|------|-------------|
| `yelp_ai_chat` | Conversational AI for recommendations |
| `yelp_ai_chat_stream` | Streaming AI chat responses |

### Events

| Tool | Description |
|------|-------------|
| `yelp_events` | Search for events |
| `yelp_event_details` | Get event details |
| `yelp_featured_event` | Get featured event for location |

### Autocomplete

| Tool | Description |
|------|-------------|
| `yelp_autocomplete` | Get search suggestions |

### Categories

| Tool | Description |
|------|-------------|
| `yelp_categories` | List all categories |
| `yelp_category_details` | Get category details |

### Transactions & Service Offerings

| Tool | Description |
|------|-------------|
| `yelp_delivery_search` | Search businesses that support food delivery |
| `yelp_service_offerings` | Get service offerings for a business (delivery, pickup, etc.) |

### Business Insights

| Tool | Description |
|------|-------------|
| `yelp_engagement_metrics` | Get engagement metrics (impressions, leads, calls) for businesses |
| `yelp_business_insights` | Get business insights data |
| `yelp_food_drinks_insights` | Get popular dishes and drinks for a business |
| `yelp_risk_signals` | Get risk signal insights for a business |

### Waitlist

| Tool | Description |
|------|-------------|
| `yelp_waitlist_status` | Get waitlist status and wait estimates for a business |
| `yelp_waitlist_info` | Get waitlist configuration and hours for a business |
| `yelp_visit_details` | Get details of a specific waitlist visit |
| `yelp_partner_restaurants` | Find restaurants with Yelp Waitlist support |

### Reservations

| Tool | Description |
|------|-------------|
| `yelp_reservation_openings` | Get available reservation times for a restaurant |
| `yelp_reservation_status` | Get the status of a reservation |

## Example Usage

### Search for restaurants

```json
{
  "method": "tools/call",
  "params": {
    "name": "yelp_search",
    "arguments": {
      "term": "sushi",
      "location": "San Francisco, CA",
      "sort_by": "rating",
      "limit": 5
    }
  }
}
```

### Get business reviews

```json
{
  "method": "tools/call",
  "params": {
    "name": "yelp_reviews",
    "arguments": {
      "business_id": "north-india-restaurant-san-francisco",
      "limit": 10
    }
  }
}
```

### AI Chat

```json
{
  "method": "tools/call",
  "params": {
    "name": "yelp_ai_chat",
    "arguments": {
      "query": "What's a good Italian restaurant for a date night in the Marina?",
      "location": "San Francisco, CA"
    }
  }
}
```

## Architecture

```
src/
├── index.ts              # HTTP server entry point
├── server-factory.ts     # MCP server configuration
├── tools/
│   ├── index.ts          # Tool registry
│   ├── business.ts       # Business search/details tools
│   ├── reviews.ts        # Reviews tools
│   ├── ai-chat.ts        # AI Chat tool (streaming)
│   ├── events.ts         # Events tools
│   ├── autocomplete.ts   # Autocomplete tool
│   └── categories.ts     # Categories tools
└── yelp-client/
    ├── index.ts          # Yelp API client
    └── types.ts          # TypeScript types
```

## Development

```bash
# Watch mode
npm run watch

# Type checking
npm run typecheck
```

## API Reference

See the [Yelp Fusion API Documentation](https://docs.developer.yelp.com/docs/fusion-intro) for full API details.

## License

MIT
