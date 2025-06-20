# Yelp Fusion MCP Server

A minimal MCP server that provides a simple wrapper around the Yelp Fusion API.
It exposes a `business_search` tool which searches for businesses by term and location.

## Usage

1. Obtain a Yelp API key from <https://www.yelp.com/developers>.
2. Set the `YELP_API_KEY` environment variable.
3. Run the server via `npx mcp-server-yelp-fusionai` after building.

### Tool: `business_search`

**Inputs**
- `term` – search keywords.
- `location` – address or city to search near.

**Output**
A JSON array summarising the top matching businesses.

