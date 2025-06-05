#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';

import { TypeStyleServer } from './src/server.js';
import { VerticalServerConfig, DEFAULT_CONFIG } from './src/constants.js';

// Load environment variables if needed
const PERPLEXITY_MCP_URL = process.env.PERPLEXITY_MCP_URL;
const PERPLEXITY_MCP_TOKEN = process.env.PERPLEXITY_MCP_TOKEN;
const EXA_MCP_URL = process.env.EXA_MCP_URL;
const EXA_MCP_TOKEN = process.env.EXA_MCP_TOKEN;

// Configure which search server to use based on available environment variables
let serverConfig: VerticalServerConfig = DEFAULT_CONFIG;

// If Perplexity credentials are provided, use them as primary
if (PERPLEXITY_MCP_URL) {
  serverConfig = {
    ...serverConfig,
    primaryMcpServer: {
      url: PERPLEXITY_MCP_URL,
      token: PERPLEXITY_MCP_TOKEN,
      toolName: 'search'
    }
  };
  
  // Add Exa as fallback if available
  if (EXA_MCP_URL) {
    serverConfig.fallbackMcpServers = [{
      url: EXA_MCP_URL,
      token: EXA_MCP_TOKEN,
      toolName: 'search'
    }];
  }
} 
// Otherwise, use Exa if available
else if (EXA_MCP_URL) {
  serverConfig = {
    ...serverConfig,
    primaryMcpServer: {
      url: EXA_MCP_URL,
      token: EXA_MCP_TOKEN,
      toolName: 'search'
    }
  };
}

// Create TypeStyle server with our configuration
const styleServer = new TypeStyleServer(serverConfig);

// Tool Definition
const TYPESTYLE_TOOL: Tool = {
  name: "typestyle",
  description: `A tool for analyzing and formatting TypeScript code according to Google Style Guide.
This tool helps ensure TypeScript code follows consistent styling conventions.
It can analyze code for style issues, answer style questions, and format code.

When to use this tool:
- To check TypeScript code against Google's style guidelines
- To learn about TypeScript best practices
- To format code according to style guide specifications
- To understand the rationale behind style decisions

Key features:
- Analyzes source file structure
- Checks naming conventions
- Enforces type system best practices
- Validates code formatting
- Recommends TypeScript-specific best practices
- Explains performance considerations
- Grounds responses in official Google TypeScript Style Guide

Parameters explained:
- code: TypeScript code to analyze or format
- query: Specific style question about TypeScript
- rule: Request explanation for a specific style rule
- format: Whether to return formatted code
- category: Specific category to check (source_file_structure, naming_conventions, etc.)
- groundSearch: Whether to use external search for authoritative grounding (default: true)

You should use this tool when:
1. You're writing or reviewing TypeScript code
2. You want to ensure consistency with Google Style Guide
3. You need to understand TypeScript style best practices
4. You want formatted, readable code
5. You're learning TypeScript and want to adopt good conventions`,
  inputSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "TypeScript code to analyze or format"
      },
      query: {
        type: "string",
        description: "Specific style question about TypeScript"
      },
      rule: {
        type: "string",
        description: "Request explanation for a specific style rule",
        enum: [
          "source_file_structure",
          "naming_conventions",
          "type_system",
          "code_formatting",
          "best_practices",
          "performance_optimization",
          "default_exports",
          "interfaces_vs_types",
          "array_type_style",
          "null_vs_undefined",
          "braces",
          "string_literals",
          "jsdoc"
        ]
      },
      format: {
        type: "boolean",
        description: "Whether to return formatted code"
      },
      category: {
        type: "string",
        description: "Specific category to check",
        enum: [
          "source_file_structure",
          "language_features",
          "naming_conventions",
          "type_system",
          "code_formatting",
          "best_practices",
          "performance_optimization"
        ]
      },
      groundSearch: {
        type: "boolean",
        description: "Whether to use external search for authoritative grounding"
      }
    }
  }
};

// Create the MCP server
const server = new Server(
  {
    name: "typestyle-server",
    version: "0.1.2",
  },
  {
    capabilities: {
      tools: {
        typestyle: TYPESTYLE_TOOL
      },
    },
  }
);

// Configure request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [TYPESTYLE_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "typestyle") {
    return await styleServer.processStyleRequest(request.params.arguments);
  }

  throw new McpError(
    ErrorCode.MethodNotFound,
    `Unknown tool: ${request.params.name}`
  );
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Log server status and configuration
  const searchServer = serverConfig.primaryMcpServer.url 
    ? `connected to ${new URL(serverConfig.primaryMcpServer.url).hostname}`
    : 'standalone mode (no external search)';
    
  console.error(chalk.green(`TypeStyle MCP Server running on stdio - ${searchServer}`));
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});