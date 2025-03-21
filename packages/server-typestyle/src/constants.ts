/**
 * Constants for TypeStyle Server
 */

// Style guide categories
export const STYLE_CATEGORIES = {
  SOURCE_FILE: "source_file_structure",
  LANGUAGE_FEATURES: "language_features",
  NAMING: "naming_conventions",
  TYPE_SYSTEM: "type_system",
  FORMATTING: "code_formatting",
  BEST_PRACTICES: "best_practices",
  PERFORMANCE: "performance_optimization"
};

// MCP server configuration
export interface McpServerConfig {
  url: string;
  token?: string;
  toolName: string;
}

// Vertical server configuration
export interface VerticalServerConfig {
  // Primary search MCP server to use (Exa, Perplexity, etc.)
  primaryMcpServer: McpServerConfig;
  
  // Fallback servers in case primary is unavailable
  fallbackMcpServers?: McpServerConfig[];
  
  // Should we cache results to reduce external API calls?
  cacheResults?: boolean;
  
  // How long to cache results (in seconds)
  cacheExpiration?: number;
}

// Default vertical server configuration
export const DEFAULT_CONFIG: VerticalServerConfig = {
  primaryMcpServer: {
    url: process.env.PRIMARY_MCP_URL || 'http://localhost:3000/mcp',
    token: process.env.PRIMARY_MCP_TOKEN,
    toolName: process.env.PRIMARY_MCP_TOOL || 'search'
  },
  cacheResults: true,
  cacheExpiration: 3600 // 1 hour
};