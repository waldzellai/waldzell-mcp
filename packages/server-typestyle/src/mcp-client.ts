/**
 * MCP Client for connecting to other MCP servers
 * This module allows our TypeStyle server to call other MCP servers
 * for grounding our responses in official documentation.
 */

import fetch from 'node-fetch';

export interface McpResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export class McpClient {
  private serverUrl: string;
  private serverToken?: string;
  private requestId: number = 1;
  
  constructor(serverUrl: string, serverToken?: string) {
    this.serverUrl = serverUrl;
    this.serverToken = serverToken;
  }
  
  /**
   * Call a tool on another MCP server
   * @param toolName The name of the tool to call
   * @param args The arguments to pass to the tool
   * @returns The response from the MCP server
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<McpResponse> {
    try {
      const requestId = String(this.requestId++);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.serverToken) {
        headers['Authorization'] = `Bearer ${this.serverToken}`;
      }
      
      const requestBody = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'mcp.callTool',
        params: {
          name: toolName,
          arguments: args
        }
      };
      
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`MCP server responded with status ${response.status}`);
      }
      
      const responseData = await response.json() as Record<string, any>;
      
      if (responseData.error) {
        throw new Error(`MCP server error: ${JSON.stringify(responseData.error)}`);
      }
      
      return responseData.result;
    } catch (error) {
      console.error('Error calling MCP tool:', error);
      return {
        content: [{
          type: 'text',
          text: `Error calling MCP tool: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
  
  /**
   * List available tools on another MCP server
   * @returns List of available tools
   */
  async listTools(): Promise<any> {
    try {
      const requestId = String(this.requestId++);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.serverToken) {
        headers['Authorization'] = `Bearer ${this.serverToken}`;
      }
      
      const requestBody = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'mcp.listTools',
        params: {}
      };
      
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`MCP server responded with status ${response.status}`);
      }
      
      const responseData = await response.json() as Record<string, any>;
      
      if (responseData.error) {
        throw new Error(`MCP server error: ${JSON.stringify(responseData.error)}`);
      }
      
      return responseData.result;
    } catch (error) {
      console.error('Error listing MCP tools:', error);
      return {
        tools: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}