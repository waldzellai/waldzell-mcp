/**
 * Upstream MCP server connector
 * Handles HTTP+SSE communication with upstream MCP servers
 */

import type { JSONRPCRequest, JSONRPCResponse } from './instrumentation.js';

export interface UpstreamConfig {
  url: string;
  timeoutMs: number;
}

/**
 * Connector for upstream HTTP+SSE MCP servers
 */
export class UpstreamConnector {
  constructor(private config: UpstreamConfig) {}
  
  /**
   * Forward a JSON-RPC request to the upstream server
   */
  async forwardRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Upstream responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as JSONRPCResponse;
    } catch (err: any) {
      // Convert errors to JSON-RPC error responses
      if (err.name === 'AbortError') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32603,
            message: `Upstream timeout after ${this.config.timeoutMs}ms`,
          },
        };
      }
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: `Upstream error: ${err.message}`,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
  
  /**
   * Health check the upstream server
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'health-check',
          method: 'ping',
        }),
        signal: AbortSignal.timeout(5000),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}
