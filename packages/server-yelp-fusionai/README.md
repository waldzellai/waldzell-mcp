# Yelp Fusion MCP Server

[![npm version](https://img.shields.io/npm/v/server-yelp-fusionai.svg)](https://www.npmjs.com/package/server-yelp-fusionai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This package provides an MCP (Model Context Protocol) server that enables natural language communication between Claude and the Yelp Fusion API. Use natural language to search for businesses, read reviews, find events, and more—directly through Claude Desktop.

## 🌟 Communicate with Yelp through Claude

Simply ask Claude questions like:
- "Find me the best pizza places in Chicago"
- "What are some highly rated coffee shops in San Francisco that are open now?"
- "Tell me about the reviews for Gary Danko restaurant"
- "Are there any free events in New York this weekend?"

## Features

- **Natural Language Interface** - Ask Claude about businesses and get intelligent responses
- **AI-Powered Search** - Leverages Yelp's AI API for sophisticated natural language business search
- **Comprehensive API Coverage**:
  - Businesses search and details
  - Reviews and review highlights
  - Events discovery
  - Categories exploration
  - And 15+ other API categories (OAuth, Advertising, etc.)
- **Rich Information** - Get ratings, pricing, hours, reviews, and more
- **Formatted Responses** - Results are presented in clean, readable Markdown

## Installation

```bash
npm install server-yelp-fusionai
```

## Getting a Yelp API Key

Before setting up the server, you'll need to obtain API credentials from Yelp:

1. **Create a Yelp Developer Account**:
   - Visit the [Yelp Fusion API](https://www.yelp.com/developers/v3/manage_app) page
   - Sign up for an account or log in if you already have one

2. **Create a New App**:
   - Click on "Create New App" in the API dashboard
   - Fill in the application details (name, industry, contact information)
   - Agree to the Terms of Service and submit

3. **Get Your API Key**:
   - Once your app is created, you'll receive an API Key (Client ID is optional for most operations)
   - Keep this key secure and never expose it in client-side code

## Setting Up with Claude Desktop

1. **Install the Package**:
   ```bash
   npm install server-yelp-fusionai
   ```

2. **Create a Basic Server File** (e.g., `yelp-server.js`):
   ```javascript
   require('dotenv').config();
   const { startServer } = require('server-yelp-fusionai');
   
   // Start the server on port 3000 (or any port you prefer)
   startServer(3000).then(() => {
     console.log('Yelp Fusion MCP server is running on port 3000');
   });
   ```

3. **Create a `.env` File** with your Yelp API credentials:
   ```
   YELP_API_KEY=your_api_key_here
   YELP_CLIENT_ID=your_client_id_here  # Optional for most operations
   ```

4. **Run the Server**:
   ```bash
   node yelp-server.js
   ```

5. **Connect with Claude Desktop**:
   - Open Claude Desktop
   - Go to Settings → Model Context Protocol
   - Add a new connection to `http://localhost:3000/mcp`
   - Enable the connection

6. **Start Asking Questions**:
   - "What are the best Italian restaurants in Boston?"
   - "Tell me about highly-rated coffee shops near downtown Seattle"
   - "Are there any events happening in Austin this weekend?"

## Examples of Questions You Can Ask Claude

### Business Discovery
- "What are some well-reviewed sushi restaurants in Los Angeles?"
- "Find me pet-friendly cafes in Portland with outdoor seating"
- "What's the highest-rated breakfast place in Chicago's Loop area?"
- "Are there any 24-hour diners in Manhattan?"

### Detailed Business Information
- "Tell me about The French Laundry restaurant in Napa Valley"
- "What are the operating hours for Pike Place Market in Seattle?"
- "Does Flour Bakery in Boston have gluten-free options?"
- "Show me the menu highlights from Momofuku in New York"

### Reviews and Insights
- "What do people say about the service at The Cheesecake Factory in San Francisco?"
- "Show me positive reviews about the food at Eleven Madison Park"
- "What are the common complaints about Hotel Zetta?"
- "What dishes are recommended at Tartine Bakery?"

### Events
- "Are there any food festivals in San Diego this month?"
- "Find family-friendly events in Chicago this weekend"
- "What's the featured event in New Orleans right now?"
- "Tell me about upcoming concerts in Nashville"

## Advanced Usage

### Custom Server Configuration

```javascript
const { createServer } = require('server-yelp-fusionai');

// Create a server with custom options
const server = createServer({
  enableDynamicToolsets: true,  // Enable or disable dynamic toolset discovery
  disabledToolsets: ['advertising', 'waitlist']  // Disable specific toolsets
});

// Add your own custom middleware or configuration
// ...

// Start the server when ready
server.listen(3000, () => {
  console.log('Custom Yelp Fusion MCP server running on port 3000');
});
```

### Command Line Options

When running the server directly, you can use these command-line options:

```bash
# Enable dynamic toolset discovery (default)
node yelp-server.js --enable-dynamic-toolsets

# Disable dynamic toolset discovery
node yelp-server.js --disable-dynamic-toolsets

# Disable specific toolsets
node yelp-server.js --disabled-toolsets advertising,waitlist

# Show help message
node yelp-server.js --help
```

### Environment Variables

You can also configure the server using environment variables:

```
# Required
YELP_API_KEY=your_api_key_here

# Optional
YELP_CLIENT_ID=your_client_id_here
YELP_ENABLE_DYNAMIC_TOOLSETS=false
YELP_DISABLED_TOOLSETS=advertising,waitlist
```

### API Reference

The MCP server exposes several tools for interacting with the Yelp Fusion API:

#### Primary Search Tools

1. **yelpQuery**
   Natural language search using Yelp's AI API
   ```json
   {
     "query": "Find pizza places in Chicago"
   }
   ```

2. **yelpBusinessSearch**
   Parameter-based business search
   ```json
   {
     "term": "coffee",
     "location": "San Francisco, CA",
     "price": "1,2",
     "open_now": true
   }
   ```

3. **yelpBusinessDetails**
   Get detailed information about a specific business
   ```json
   {
     "id": "WavvLdfdP6g8aZTtbBQHTw"
   }
   ```

See the [full API documentation](https://github.com/waldzellai/waldzell-mcp/tree/main/packages/server-yelp-fusionai#api) for details on all available tools and their parameters.

## Troubleshooting

### API Key Issues

- **Error: "Yelp API key is not configured"**
  Ensure your `.env` file contains the `YELP_API_KEY` variable and is in the same directory as your server script.

- **Error: "Authentication failed: Invalid API key"**
  Verify your API key is correct and hasn't expired. You can check it in the [Yelp Developer Dashboard](https://www.yelp.com/developers/v3/manage_app).

### Connection Issues

- **Claude can't connect to the server**
  Ensure the server is running and the URL in Claude Desktop is correct (`http://localhost:3000/mcp`).

- **Request timed out**
  The Yelp API might be experiencing high traffic. Try again later or check your network connection.

### Toolset Issues

- **Missing functionality**
  If certain tools aren't available, check if you've disabled the corresponding toolset. Use `--enable-dynamic-toolsets` to ensure all toolsets are loaded.

## Development

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT

## Author

glassBead for Waldzell AI