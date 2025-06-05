# TypeStyle MCP Server

An MCP server implementation that provides Google Style Guide-grounded advice for TypeScript code formatting and styling, using a vertical architecture that leverages other MCP servers for authoritative references.

## Features

- Analyze TypeScript code for style conformance
- Offer recommendations based on Google TypeScript Style Guide
- Provide explanations for style rules grounded in official documentation
- Format code according to style guide specifications
- Vertical integration with search MCP servers for authoritative grounding

## Tool

### typestyle

Facilitates TypeScript code styling and formatting according to Google's TypeScript Style Guide.

**Inputs:**
- `code` (string): The TypeScript code to analyze or format
- `query` (string, optional): Specific style question about TypeScript
- `rule` (string, optional): Request explanation for a specific style rule
- `format` (boolean, optional): Whether to return formatted code
- `category` (string, optional): Specific category to check
- `groundSearch` (boolean, optional): Whether to use external search for authoritative grounding

## Architecture

TypeStyle uses a vertical architecture that starts with authoritative search to ground its TypeScript style analysis:

```
┌─────────────────────────────────────────────────────┐
│                  TypeStyle Server                   │
├─────────────────┬─────────────────┬────────────────┤
│ Query Manager   │ External Search │ Style Analyzer │
│ (generates      │ (grounds        │ (analyzes with │
│  search queries)│  analysis)      │  context)      │
└────────┬────────┴────────┬────────┴────────┬───────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌─────────────────┐  ┌────────────┐
│ Query based  │  │ MCP Client      │  │ Contextual │
│ on request   │──┤ (to Search MCP) │──┤ Analysis   │
└──────────────┘  └─────────────────┘  └─────┬──────┘
                          │                   │
                          ▼                   ▼
                  ┌───────────────────┐ ┌────────────┐
                  │ External MCP      │ │ Response   │
                  │ (Exa/Perplexity)  │ │ Synthesis  │
                  └───────────────────┘ └────────────┘
```

### The Search-First Approach

Our reasoning flow prioritizes external search to ground our analysis:

1. **Generate Query**: When a request arrives, we first generate an optimized search query
2. **Fetch Authoritative Content**: We query search-based MCP servers for official style guidelines
3. **Analyze with Context**: We analyze code with awareness of official guidance
4. **Enhance Feedback**: Each feedback item is enhanced with relevant citations
5. **Synthesize Response**: The final response combines our analysis with grounded references

## Usage

The TypeStyle tool is designed for:
- Checking code against Google's TypeScript style guidelines
- Learning about TypeScript best practices
- Understanding rationale behind style decisions with official references
- Improving code readability and maintainability

### Quick Start

To try out the TypeStyle server with a sample TypeScript file:

```bash
# Run the sample analyzer
npm run analyze-sample
```

The sample analyzer will:
1. Create a sample TypeScript file with intentional style issues
2. Analyze the file using the TypeStyle server
3. Output detected style issues along with recommendations for improvement

You can find the sample analyzer code in the `examples/` directory.

## Configuration

### Environment Variables

For vertical capabilities, you can configure one or more search MCP servers:

```bash
# Perplexity MCP server (primary)
PERPLEXITY_MCP_URL=https://your-perplexity-mcp-url/mcp
PERPLEXITY_MCP_TOKEN=your-perplexity-token

# Exa MCP server (fallback)
EXA_MCP_URL=https://your-exa-mcp-url/mcp
EXA_MCP_TOKEN=your-exa-token
```

If no search MCP servers are configured, the server will still function using its built-in rules, but without external grounding.

### Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

#### With Exa integration

The simplest approach is to use the Exa MCP server for search:

```json
{
  "mcpServers": {
    "typestyle": {
      "command": "npx",
      "args": [
        "-y",
        "@waldzellai/server-typestyle"
      ]
    },
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-mcp-server"
      ],
      "env": {
        "EXA_API_KEY": "your-exa-api-key"
      }
    }
  }
}
```

#### With Perplexity (alternative)

```json
{
  "mcpServers": {
    "typestyle": {
      "command": "npx",
      "args": [
        "-y",
        "@waldzellai/server-typestyle"
      ],
      "env": {
        "PERPLEXITY_MCP_URL": "https://your-perplexity-url/mcp",
        "PERPLEXITY_MCP_TOKEN": "your-token"
      }
    }
  }
}
```

#### Docker deployment

```json
{
  "mcpServers": {
    "typestyle": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "EXA_MCP_URL=http://localhost:3456/mcp",
        "-e", "EXA_MCP_TOKEN=your-exa-api-key",
        "waldzellai/server-typestyle"
      ]
    },
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-mcp-server"
      ],
      "env": {
        "EXA_API_KEY": "your-exa-api-key",
        "PORT": "3456"
      }
    }
  }
}
```

### Smithery Deployment

This server is designed to be deployed on Smithery, which provides a managed environment for MCP servers. When deployed on Smithery, you can configure the environment variables for search MCP servers through the Smithery dashboard.

## Building

Docker:

```bash
docker build -t waldzellai/server-typestyle -f Dockerfile .
```

## Testing

The TypeStyle server includes comprehensive testing capabilities to validate functionality both with and without external MCP server connections.

### Unit Testing

Run the test harness to verify all style checking capabilities with mock search services:

```bash
npm run test
```

This runs the test harness in `src/test/test-harness.ts` which verifies:
- All style categories with sample code containing intentional issues
- Search-first vertical architecture using mock responses
- Analysis with and without grounding
- Query-based style guidance

### Integration Testing

Test with real external MCP search servers:

#### Using environment variables (legacy approach)

```bash
# Configure environment variables first
export PERPLEXITY_MCP_URL=https://your-perplexity-url/mcp
export PERPLEXITY_MCP_TOKEN=your-token

# Run integration tests
npm run test:integration
```

#### Using Exa MCP Server

A simpler approach is to use the built-in Exa MCP server integration:

1. First, configure your Exa API key:
   ```bash
   # Copy the template config file
   cp typestyle_mcp_config.template.ts typestyle_mcp_config.ts
   
   # Edit the file and add your Exa API key
   ```

2. Then run the tests:
   ```bash
   # This will automatically start an Exa MCP server and run the tests
   npm run test:exa
   ```

The integration test in `src/test/integration-test.ts` demonstrates:
- Connecting to real Perplexity/Exa MCP servers
- Analyzing code with external search grounding
- Answering style queries with authoritative references

#### Configuring MCP Servers

The project now includes a `typestyle_mcp_config.ts` file to easily manage MCP server configurations:

```typescript
// Example configuration in typestyle_mcp_config.ts
export const MCP_CONFIG = {
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-mcp-server"
      ],
      "env": {
        "EXA_API_KEY": "your-exa-api-key"
      }
    }
  }
};
```

See the `src/test/README.md` file for detailed information about the test suite.

## License

This MCP server is licensed under the MIT License.