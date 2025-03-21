# Yelp Fusion MCP Server

[![npm version](https://img.shields.io/npm/v/yelp-fusionai-mcp.svg)](https://www.npmjs.com/package/yelp-fusionai-mcp)
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
npm install yelp-fusionai-mcp
```

## Setting Up with Claude Desktop

1. **Install the Package**:
   ```bash
   npm install yelp-fusionai-mcp
   ```

2. **Create a Basic Server File** (e.g., `yelp-server.js`):
   ```javascript
   require('dotenv').config();
   const { startServer } = require('yelp-fusionai-mcp');
   
   // Start the server on port 3000 (or any port you prefer)
   startServer(3000).then(() => {
     console.log('Yelp Fusion MCP server is running on port 3000');
   });
   ```

3. **Create a `.env` File** with your Yelp API credentials:
   ```
   YELP_API_KEY=your_api_key_here
   YELP_CLIENT_ID=your_client_id_here
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
const { createServer } = require('yelp-fusionai-mcp');

// Create a server without starting it
const server = createServer();

// Add your own custom middleware or configuration
// ...

// Start the server when ready
server.listen(3000, () => {
  console.log('Custom Yelp Fusion MCP server running on port 3000');
});
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

See the [full API documentation](https://github.com/waldzellai/waldzell-mcp/tree/main/packages/yelp-fusionai-mcp#api) for details on all available tools and their parameters.

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Author

glassBead for Waldzell AI