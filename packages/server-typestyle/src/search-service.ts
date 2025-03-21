/**
 * Search Service for TypeStyle Server
 * Manages connections to external MCP servers for search functionality
 */

import { McpClient, McpResponse } from './mcp-client.js';
import { VerticalServerConfig, McpServerConfig } from './constants.js';
import { SearchResponse, SearchResult } from './response-synthesizer.js';

// Simple in-memory cache
interface CacheEntry {
  response: SearchResponse;
  timestamp: number;
}

export class SearchService {
  private config: VerticalServerConfig;
  private primaryClient: McpClient;
  private fallbackClients: McpClient[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  
  constructor(config: VerticalServerConfig) {
    this.config = config;
    
    // Initialize primary client
    this.primaryClient = new McpClient(
      config.primaryMcpServer.url,
      config.primaryMcpServer.token
    );
    
    // Initialize fallback clients if any
    if (config.fallbackMcpServers && config.fallbackMcpServers.length > 0) {
      this.fallbackClients = config.fallbackMcpServers.map(serverConfig => 
        new McpClient(serverConfig.url, serverConfig.token)
      );
    }
  }
  
  /**
   * Perform a search using connected MCP servers
   * @param query Search query
   * @returns Search results
   */
  async search(query: string): Promise<SearchResponse> {
    // Check cache first if enabled
    if (this.config.cacheResults) {
      const cachedResult = this.checkCache(query);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // Try primary server first
    try {
      const response = await this.searchWithServer(
        this.primaryClient,
        this.config.primaryMcpServer.toolName,
        query
      );
      
      // Cache result if successful and caching is enabled
      if (this.config.cacheResults && !response.isError) {
        this.cacheResponse(query, response);
      }
      
      return response;
    } catch (error) {
      console.error('Error with primary search server:', error);
      
      // Try fallback servers if available
      if (this.fallbackClients.length > 0) {
        return this.tryFallbackServers(query);
      }
      
      // Return error if all servers fail
      return {
        results: [],
        query,
        isError: true
      };
    }
  }
  
  /**
   * Try search with fallback servers
   * @param query Search query
   * @returns Search results from first successful fallback
   */
  private async tryFallbackServers(query: string): Promise<SearchResponse> {
    for (let i = 0; i < this.fallbackClients.length; i++) {
      try {
        const fallbackConfig = this.config.fallbackMcpServers?.[i];
        if (!fallbackConfig) continue;
        
        const response = await this.searchWithServer(
          this.fallbackClients[i],
          fallbackConfig.toolName,
          query
        );
        
        // Cache result if successful and caching is enabled
        if (this.config.cacheResults && !response.isError) {
          this.cacheResponse(query, response);
        }
        
        return response;
      } catch (error) {
        console.error(`Error with fallback search server ${i}:`, error);
        // Continue to next fallback
      }
    }
    
    // All fallbacks failed
    return {
      results: [],
      query,
      isError: true
    };
  }
  
  /**
   * Search with a specific MCP server
   * @param client MCP client
   * @param toolName Tool name to use
   * @param query Search query
   * @returns Parsed search results
   */
  private async searchWithServer(
    client: McpClient,
    toolName: string,
    query: string
  ): Promise<SearchResponse> {
    const response = await client.callTool(toolName, { query });
    return this.parseSearchResponse(response, query);
  }
  
  /**
   * Parse raw MCP response into structured search results
   * @param response Raw MCP response
   * @param query Original query
   * @returns Structured search results
   */
  private parseSearchResponse(
    response: McpResponse,
    query: string
  ): SearchResponse {
    if (response.isError || !response.content || response.content.length === 0) {
      return {
        results: [],
        query,
        isError: true
      };
    }
    
    try {
      // Try to parse the response content
      const responseText = response.content[0].text;
      const parsedContent = JSON.parse(responseText);
      
      // Handle different response formats from different MCP servers
      
      // Format 1: Array of results with content/source/url
      if (Array.isArray(parsedContent) && 
          parsedContent.length > 0 && 
          typeof parsedContent[0].content === 'string') {
        return {
          results: parsedContent.map((item: any) => ({
            content: item.content,
            source: item.source,
            url: item.url
          })),
          query
        };
      }
      
      // Format 2: Results object with items array
      if (parsedContent.results && Array.isArray(parsedContent.results)) {
        return {
          results: parsedContent.results.map((item: any) => ({
            content: item.content || item.text || item.snippet || '',
            source: item.source || item.title || '',
            url: item.url || item.link || ''
          })),
          query
        };
      }
      
      // Format 3: Direct text content (assume it's all one result)
      if (typeof parsedContent === 'string') {
        return {
          results: [{
            content: parsedContent,
            source: 'Search Result'
          }],
          query
        };
      }
      
      // Format 4: Just use raw response text if we can't parse the JSON
      return {
        results: [{
          content: responseText,
          source: 'Search Result'
        }],
        query
      };
    } catch (error) {
      // If JSON parsing fails, use the raw text
      return {
        results: [{
          content: response.content[0].text,
          source: 'Search Result'
        }],
        query
      };
    }
  }
  
  /**
   * Check if we have a valid cached response
   * @param query Search query
   * @returns Cached response or undefined
   */
  private checkCache(query: string): SearchResponse | undefined {
    const cacheKey = this.getCacheKey(query);
    const cachedEntry = this.cache.get(cacheKey);
    
    if (!cachedEntry) {
      return undefined;
    }
    
    // Check if cache has expired
    const now = Date.now();
    const expirationTime = this.config.cacheExpiration || 3600; // Default 1 hour
    
    if (now - cachedEntry.timestamp > expirationTime * 1000) {
      // Cache expired, remove it
      this.cache.delete(cacheKey);
      return undefined;
    }
    
    return cachedEntry.response;
  }
  
  /**
   * Cache a search response
   * @param query Search query
   * @param response Search response
   */
  private cacheResponse(query: string, response: SearchResponse): void {
    const cacheKey = this.getCacheKey(query);
    
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
    
    // Implement cache size limiting if needed
    this.limitCacheSize();
  }
  
  /**
   * Generate a cache key from a query
   * @param query Search query
   * @returns Cache key
   */
  private getCacheKey(query: string): string {
    // Simple normalization: lowercase, trim whitespace, remove punctuation
    return query.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }
  
  /**
   * Limit cache size to prevent memory issues
   */
  private limitCacheSize(): void {
    const MAX_CACHE_SIZE = 100;
    
    if (this.cache.size <= MAX_CACHE_SIZE) {
      return;
    }
    
    // Remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const entriesToRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    for (const [key] of entriesToRemove) {
      this.cache.delete(key);
    }
  }
}