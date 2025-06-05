/**
 * MCP Client for connecting to other MCP servers
 * This module allows our TypeStyle server to call other MCP servers
 * for grounding our responses in official documentation.
 */
export interface McpResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export declare class McpClient {
    private serverUrl;
    private serverToken?;
    private requestId;
    constructor(serverUrl: string, serverToken?: string);
    /**
     * Call a tool on another MCP server
     * @param toolName The name of the tool to call
     * @param args The arguments to pass to the tool
     * @returns The response from the MCP server
     */
    callTool(toolName: string, args: Record<string, any>): Promise<McpResponse>;
    /**
     * List available tools on another MCP server
     * @returns List of available tools
     */
    listTools(): Promise<any>;
}
//# sourceMappingURL=mcp-client.d.ts.map