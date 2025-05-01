/**
 * Toolsets utility for organizing MCP tools into logical groups
 */
import { z } from 'zod';

// Enhanced interfaces for toolset management with read/write separation
export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, z.ZodTypeAny>;
  handler: (args: Record<string, any>) => Promise<any>;
  readOnly: boolean;
  category?: string;
  tags?: string[];
}

export interface Toolset {
  id: string;
  name: string;
  description: string;
  tools: ToolDefinition[];
  enabled: boolean;
  readTools: ToolDefinition[];
  writeTools: ToolDefinition[];
  parent?: string;
}

export interface ToolsetGroup {
  id: string;
  name: string;
  description: string;
  toolsets: Toolset[];
  enabled: boolean;
}

export interface ToolRequest {
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface CallToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

// Global registry for all toolsets and toolset groups
const toolsetRegistry: Record<string, Toolset> = {};
const toolsetGroupRegistry: Record<string, ToolsetGroup> = {};

/**
 * Creates a new toolset with the given properties
 */
export function createToolset(
  id: string,
  name: string,
  description: string,
  tools: ToolDefinition[] = [],
  parentGroup?: string
): Toolset {
  // Ensure all tools have the readOnly property set
  const processedTools = tools.map(tool => ({
    ...tool,
    readOnly: typeof tool.readOnly === 'boolean' ? tool.readOnly : true // Default to read-only
  }));

  // Split tools into read and write categories
  const readTools = processedTools.filter(tool => tool.readOnly);
  const writeTools = processedTools.filter(tool => !tool.readOnly);

  const toolset: Toolset = {
    id,
    name,
    description,
    tools: processedTools,
    readTools,
    writeTools,
    enabled: true, // Enabled by default
    parent: parentGroup
  };
  
  // Register the toolset
  toolsetRegistry[id] = toolset;
  
  // If a parent group is specified, add the toolset to that group
  if (parentGroup && toolsetGroupRegistry[parentGroup]) {
    toolsetGroupRegistry[parentGroup].toolsets.push(toolset);
  }
  
  return toolset;
}

/**
 * Creates a new toolset group
 */
export function createToolsetGroup(
  id: string,
  name: string,
  description: string
): ToolsetGroup {
  const group: ToolsetGroup = {
    id,
    name,
    description,
    toolsets: [],
    enabled: true
  };
  
  toolsetGroupRegistry[id] = group;
  return group;
}

/**
 * Adds a tool to a toolset
 */
export function addToolToToolset(
  toolsetId: string,
  tool: ToolDefinition
): void {
  const toolset = toolsetRegistry[toolsetId];
  if (!toolset) {
    throw new Error(`Toolset not found: ${toolsetId}`);
  }
  
  // Ensure readOnly property is set
  const processedTool = {
    ...tool,
    readOnly: typeof tool.readOnly === 'boolean' ? tool.readOnly : true
  };
  
  // Add to appropriate category
  toolset.tools.push(processedTool);
  if (processedTool.readOnly) {
    toolset.readTools.push(processedTool);
  } else {
    toolset.writeTools.push(processedTool);
  }
}

/**
 * Adds read-only tools to a toolset
 */
export function addReadToolsToToolset(
  toolsetId: string,
  ...tools: Omit<ToolDefinition, 'readOnly'>[]
): void {
  const toolset = toolsetRegistry[toolsetId];
  if (!toolset) {
    throw new Error(`Toolset not found: ${toolsetId}`);
  }
  
  for (const tool of tools) {
    const readTool = { ...tool, readOnly: true };
    toolset.tools.push(readTool);
    toolset.readTools.push(readTool);
  }
}

/**
 * Adds write tools to a toolset
 */
export function addWriteToolsToToolset(
  toolsetId: string,
  ...tools: Omit<ToolDefinition, 'readOnly'>[]
): void {
  const toolset = toolsetRegistry[toolsetId];
  if (!toolset) {
    throw new Error(`Toolset not found: ${toolsetId}`);
  }
  
  for (const tool of tools) {
    const writeTool = { ...tool, readOnly: false };
    toolset.tools.push(writeTool);
    toolset.writeTools.push(writeTool);
  }
}

/**
 * Registers all tools from all enabled toolsets with the MCP server
 */
export function registerAllToolsets(server: any, readOnlyMode = false): void {
  // Get all enabled toolsets
  const enabledToolsets = Object.values(toolsetRegistry).filter(toolset => toolset.enabled);
  
  // Prepare tools capabilities object
  const toolsCapabilities: Record<string, any> = {};
  
  // Collect all tools from enabled toolsets
  for (const toolset of enabledToolsets) {
    // In readOnlyMode, only register read-only tools
    const toolsToRegister = readOnlyMode
      ? toolset.readTools
      : toolset.tools;
    
    for (const tool of toolsToRegister) {
      // Skip write tools in readOnlyMode
      if (readOnlyMode && !tool.readOnly) {
        continue;
      }
      
      // Add tool to capabilities
      toolsCapabilities[tool.name] = {
        description: tool.description,
        schema: tool.schema,
        handler: async (args: Record<string, any>) => {
          try {
            const result = await tool.handler(args);
            return formatToolResponse(result, tool.name);
          } catch (error) {
            console.error(`Error in ${tool.name}:`, error);
            return {
              isError: true,
              content: [{
                type: 'text',
                text: `Error in ${tool.name}: ${error instanceof Error ? error.message : String(error)}`
              }]
            };
          }
        }
      };
    }
  }
  
  // Register all tools at once using registerCapabilities
  server.registerCapabilities({
    tools: toolsCapabilities
  });
}

/**
 * Returns a list of all registered toolsets
 */
export function getToolsets(): Toolset[] {
  return Object.values(toolsetRegistry);
}

/**
 * Returns a specific toolset by ID
 */
export function getToolset(id: string): Toolset | undefined {
  return toolsetRegistry[id];
}

/**
 * Returns a list of all registered toolset groups
 */
export function getToolsetGroups(): ToolsetGroup[] {
  return Object.values(toolsetGroupRegistry);
}

/**
 * Returns a specific toolset group by ID
 */
export function getToolsetGroup(id: string): ToolsetGroup | undefined {
  return toolsetGroupRegistry[id];
}

/**
 * Enables or disables a toolset
 */
export function setToolsetEnabled(id: string, enabled: boolean): void {
  const toolset = toolsetRegistry[id];
  if (!toolset) {
    throw new Error(`Toolset not found: ${id}`);
  }
  
  toolset.enabled = enabled;
}

/**
 * Enables or disables a toolset group and all its member toolsets
 */
export function setToolsetGroupEnabled(id: string, enabled: boolean): void {
  const group = toolsetGroupRegistry[id];
  if (!group) {
    throw new Error(`Toolset group not found: ${id}`);
  }
  
  group.enabled = enabled;
  
  // Enable/disable all toolsets in this group
  for (const toolset of group.toolsets) {
    toolset.enabled = enabled;
  }
}

/**
 * Enable or disable all write operations across all toolsets
 */
export function setWriteOperationsEnabled(enabled: boolean): void {
  // Update all toolsets to enable/disable write operations
  for (const toolset of Object.values(toolsetRegistry)) {
    for (const tool of toolset.writeTools) {
      tool.readOnly = !enabled;
    }
  }
}

/**
 * Formats a tool response properly
 * @param result The result from the tool handler
 * @param _toolName The name of the tool (for error reporting)
 * @returns Formatted tool response
 */
function formatToolResponse(result: any, _toolName: string): CallToolResult {
  if (typeof result === 'string') {
    return {
      content: [{ type: 'text', text: result }]
    };
  } else if (result && result.content) {
    return result;
  } else {
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  }
}

/**
 * Formats a successful response
 * @param text The formatted text response
 * @returns Structured MCP response
 */
export function formatSuccess(text: string): CallToolResult {
  return {
    content: [{
      type: 'text',
      text
    }]
  };
}

// Debug function for server connection troubleshooting
// This is commented out as it references undefined variables and functions
/*
async function debugServerConnection(server: any, transport: any) {
  try {
    console.error("About to connect transport");
    
    // Add a timeout to log if we're still here after 5 seconds
    setTimeout(() => {
      console.error("Still in connect after 5 seconds");
    }, 5000);
    
    await server.connect(transport);
    
    console.error("Transport connected");
  } catch (error) {
    console.error('Error connecting server:', error);
    throw error;
  }
}
*/
