
# Waldzell MCP Servers

This is a Turborepo-powered monorepo containing MCP (Model Context Protocol) servers for various AI assistant integrations.

## What's inside?

### Packages

- **[server-yelp-fusionai](./packages/server-yelp-fusionai)** - MCP server for Yelp Fusion API
- **[server-stochasticthinking](./packages/server-stochasticthinking)** - Stochastic thinking MCP server
- **[server-clear-thought](./packages/server-clear-thought)** - Sequentialthinking fork inspired by James Clear
- **[common](./packages/common)** - Shared utilities and types

### Utilities

This monorepo uses [Turborepo](https://turbo.build/repo) with [Yarn 4 Workspaces](https://yarnpkg.com/features/workspaces).

- [Turborepo](https://turbo.build/repo) — High-performance build system for monorepos
- [Yarn 4](https://yarnpkg.com/) — Modern package management with PnP support
- [Changesets](https://github.com/changesets/changesets) — Managing versioning and changelogs
- [GitHub Actions](https://github.com/features/actions) — Automated workflows
- [Smithery](https://smithery.ai) — Deployment platform for MCP servers

## Getting Started

### Prerequisites

- Node.js 18 or higher
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/waldzellai/mcp-servers.git
cd mcp-servers
yarn install
```

### Development

To develop all packages:

```bash
yarn dev
```

### Building

To build all packages:

```bash
yarn build
```

The build output will be in each package's `dist/` directory.

### Testing

```bash
yarn test
```

### Linting

```bash
yarn lint
```

### Deploying to Smithery

This repo is set up to easily deploy packages to Smithery:

```bash
# Deploy all packages
yarn deploy

# Deploy specific packages
yarn smithery:yelp-fusion
yarn smithery:stochastic
yarn smithery:clear-thought
```

## Workflow

### Adding a new feature

1. Create a new branch
2. Make your changes
3. Add a changeset (documents what's changed for version bumping):
   ```bash
   yarn changeset
   ```
4. Push your changes

### Releasing new versions

We use Changesets to manage versions. Create a PR with your changes and Changesets will create a release PR that you can merge to release new versions.

For manual releases:

```bash
yarn publish-packages
```

### Adding a New Package

1. Create a new directory in the `packages` directory
2. Initialize the package with `yarn init`
3. Add your source code
4. Update `turbo.json` pipeline if needed
5. Add a `smithery.yaml` file if you want to deploy to Smithery
6. Run `yarn install` at the root to update workspaces

## Turborepo

### Remote Caching

Turborepo can use a remote cache to share build artifacts across machines. To enable Remote Caching:

```bash
yarn dlx turbo login
yarn dlx turbo link

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
const { createServer } = require('server-yelp-fusionai');

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

See the [full API documentation](https://github.com/waldzellai/waldzell-mcp/tree/main/packages/server-yelp-fusionai#api) for details on all available tools and their parameters.

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


Contributions are welcome! Please feel free to submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

glassBead for Waldzell AI

