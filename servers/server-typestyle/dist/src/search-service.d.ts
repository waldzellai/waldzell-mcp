/**
 * Search Service for TypeStyle Server
 * Manages connections to external MCP servers for search functionality
 */
import { VerticalServerConfig } from './constants.js';
import { SearchResponse } from './response-synthesizer.js';
export declare class SearchService {
    private config;
    private primaryClient;
    private fallbackClients;
    private cache;
    constructor(config: VerticalServerConfig);
    /**
     * Perform a search using connected MCP servers
     * @param query Search query
     * @returns Search results
     */
    search(query: string): Promise<SearchResponse>;
    /**
     * Try search with fallback servers
     * @param query Search query
     * @returns Search results from first successful fallback
     */
    private tryFallbackServers;
    /**
     * Search with a specific MCP server
     * @param client MCP client
     * @param toolName Tool name to use
     * @param query Search query
     * @returns Parsed search results
     */
    private searchWithServer;
    /**
     * Parse raw MCP response into structured search results
     * @param response Raw MCP response
     * @param query Original query
     * @returns Structured search results
     */
    private parseSearchResponse;
    /**
     * Check if we have a valid cached response
     * @param query Search query
     * @returns Cached response or undefined
     */
    private checkCache;
    /**
     * Cache a search response
     * @param query Search query
     * @param response Search response
     */
    private cacheResponse;
    /**
     * Generate a cache key from a query
     * @param query Search query
     * @returns Cache key
     */
    private getCacheKey;
    /**
     * Limit cache size to prevent memory issues
     */
    private limitCacheSize;
}
//# sourceMappingURL=search-service.d.ts.map