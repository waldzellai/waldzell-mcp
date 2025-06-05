/**
 * TypeStyle MCP Configuration Template
 * Copy this file to typestyle_mcp_config.ts and add your API keys
 */

export const MCP_CONFIG = {
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": [
        "-y",
        "exa-mcp-server"
      ],
      "env": {
        "EXA_API_KEY": "your-exa-api-key-here"
      }
    },
    // Uncomment and configure if you're using Perplexity
    // "perplexity": {
    //   "command": "npx",
    //   "args": [
    //     "-y",
    //     "perplexity-mcp-server"
    //   ],
    //   "env": {
    //     "PERPLEXITY_API_KEY": "your-perplexity-api-key-here"
    //   }
    // }
  }
};