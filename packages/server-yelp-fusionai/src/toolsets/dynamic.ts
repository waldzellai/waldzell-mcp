/**
 * Dynamic toolset management for the Yelp Fusion MCP server
 * Allows users to discover and enable specific toolsets on demand
 */
import { z } from 'zod';
import { 
  ToolDefinition, 
  createToolset, 
  getToolsets, 
  getToolsetGroups,
  getToolsetGroup,
  setToolsetEnabled, 
  getToolset,
  setToolsetGroupEnabled,
  setWriteOperationsEnabled,
  addReadToolsToToolset
} from '../utils/toolsets.js';

/**
 * Initialize the dynamic toolset
 * This toolset provides meta-tools for enabling/disabling other toolsets
 */
export function initializeDynamicToolset(): void {
  // Create a dynamic toolset for tool discovery and management
  createToolset(
    'dynamic',
    'Tool Discovery',
    'Tools for discovering and managing available Yelp Fusion API capabilities'
  );
  
  // Add read-only tools for discovery
  addReadToolsToToolset(
    'dynamic',
    {
      name: 'yelpListToolsetGroups',
      description: 'List all available toolset groups',
      schema: {},
      handler: async () => {
        const groups = getToolsetGroups();
        
        return {
          content: [{ 
            type: 'text', 
            text: `# Available Yelp Fusion MCP Toolset Groups\n\n${
              groups.map(group => 
                `## ${group.name} (${group.enabled ? 'Enabled' : 'Disabled'})\n` +
                `ID: \`${group.id}\`\n` +
                `${group.description}\n` +
                `Contains ${group.toolsets.length} toolsets.`
              ).join('\n\n')
            }`
          }]
        };
      },
      category: 'discovery'
    },
    {
      name: 'yelpListToolsets',
      description: 'List all available toolsets that can be enabled',
      schema: {
        groupId: z.string().optional().describe('Optional group ID to filter toolsets by')
      },
      handler: async (args) => {
        let toolsets = getToolsets();
        
        // Filter by group if specified
        if (args.groupId) {
          const group = getToolsetGroup(args.groupId);
          if (!group) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Toolset group not found: ${args.groupId}` }]
            };
          }
          toolsets = group.toolsets;
        }
        
        const formattedToolsets = toolsets.map(toolset => ({
          id: toolset.id,
          name: toolset.name,
          description: toolset.description,
          enabled: toolset.enabled,
          readCount: toolset.readTools.length,
          writeCount: toolset.writeTools.length,
          parent: toolset.parent || 'none'
        }));
        
        return {
          content: [{ 
            type: 'text', 
            text: `# Available Yelp Fusion MCP Toolsets\n\n${
              formattedToolsets.map(ts => 
                `## ${ts.name} (${ts.enabled ? 'Enabled' : 'Disabled'})\n` +
                `ID: \`${ts.id}\`\n` +
                `${ts.description}\n` +
                `Contains ${ts.readCount} read-only tools and ${ts.writeCount} write tools.` +
                (ts.parent !== 'none' ? `\nBelongs to group: \`${ts.parent}\`` : '')
              ).join('\n\n')
            }`
          }]
        };
      },
      category: 'discovery'
    },
    {
      name: 'yelpGetToolsetTools',
      description: 'Get a list of all tools in a specific toolset',
      schema: {
        toolsetId: z.string().describe('ID of the toolset to get tools for'),
        showWriteOnly: z.boolean().optional().describe('Set to true to show only write tools, false for read-only tools, omit for all')
      },
      handler: async (args) => {
        const toolset = getToolset(args.toolsetId);
        if (!toolset) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Toolset not found: ${args.toolsetId}` }]
          };
        }
        
        let toolsToShow;
        if (args.showWriteOnly === true) {
          toolsToShow = toolset.writeTools;
        } else if (args.showWriteOnly === false) {
          toolsToShow = toolset.readTools;
        } else {
          toolsToShow = toolset.tools;
        }
        
        const tools = toolsToShow.map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          readOnly: tool.readOnly,
          category: tool.category || 'general'
        }));
        
        // Group tools by category
        const categorizedTools: Record<string, Array<typeof tools[0]>> = {};
        tools.forEach(tool => {
          if (!categorizedTools[tool.category]) {
            categorizedTools[tool.category] = [];
          }
          categorizedTools[tool.category].push(tool);
        });
        
        // Build the response
        let responseParts = [`# Tools in the "${toolset.name}" Toolset\n`];
        
        if (args.showWriteOnly === true) {
          responseParts.push('Showing write tools only.\n');
        } else if (args.showWriteOnly === false) {
          responseParts.push('Showing read-only tools only.\n');
        }
        
        // Add categorized tools
        Object.entries(categorizedTools).forEach(([category, categoryTools]) => {
          responseParts.push(`\n## ${category.charAt(0).toUpperCase() + category.slice(1)} Tools\n`);
          categoryTools.forEach(tool => {
            responseParts.push(`### ${tool.name} ${tool.readOnly ? '(Read-Only)' : '(Write)'}`);
            responseParts.push(`${tool.description}\n`);
          });
        });
        
        return {
          content: [{ 
            type: 'text',
            text: responseParts.join('\n')
          }]
        };
      },
      category: 'discovery'
    }
  );
  
  // Add write tools for configuration
  addReadToolsToToolset(
    'dynamic',
    {
      name: 'yelpEnableToolset',
      description: 'Enable or disable a specific toolset for use',
      schema: {
        toolsetId: z.string().describe('ID of the toolset to enable/disable'),
        enable: z.boolean().describe('Set to true to enable, false to disable')
      },
      handler: async (args) => {
        try {
          const toolset = getToolset(args.toolsetId);
          if (!toolset) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Toolset not found: ${args.toolsetId}` }]
            };
          }
          
          // Cannot disable the dynamic toolset itself
          if (args.toolsetId === 'dynamic' && !args.enable) {
            return {
              isError: true,
              content: [{ type: 'text', text: 'The dynamic toolset cannot be disabled.' }]
            };
          }
          
          setToolsetEnabled(args.toolsetId, args.enable);
          return {
            content: [{ 
              type: 'text', 
              text: `Toolset "${toolset.name}" (${toolset.id}) has been ${args.enable ? 'enabled' : 'disabled'}.`
            }]
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ 
              type: 'text', 
              text: `Error changing toolset state: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      },
      category: 'config'
    },
    {
      name: 'yelpEnableToolsetGroup',
      description: 'Enable or disable a toolset group and all its member toolsets',
      schema: {
        groupId: z.string().describe('ID of the toolset group to enable/disable'),
        enable: z.boolean().describe('Set to true to enable, false to disable')
      },
      handler: async (args) => {
        try {
          const group = getToolsetGroup(args.groupId);
          if (!group) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Toolset group not found: ${args.groupId}` }]
            };
          }
          
          setToolsetGroupEnabled(args.groupId, args.enable);
          return {
            content: [{ 
              type: 'text', 
              text: `Toolset group "${group.name}" (${group.id}) has been ${args.enable ? 'enabled' : 'disabled'} along with all ${group.toolsets.length} of its toolsets.`
            }]
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ 
              type: 'text', 
              text: `Error changing toolset group state: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      },
      category: 'config'
    },
    {
      name: 'yelpEnableWriteOperations',
      description: 'Enable or disable all write operations across all toolsets',
      schema: {
        enable: z.boolean().describe('Set to true to enable, false to disable write operations')
      },
      handler: async (args) => {
        try {
          setWriteOperationsEnabled(args.enable);
          return {
            content: [{ 
              type: 'text', 
              text: `Write operations have been ${args.enable ? 'enabled' : 'disabled'} across all toolsets.`
            }]
          };
        } catch (error) {
          return {
            isError: true,
            content: [{ 
              type: 'text', 
              text: `Error changing write operations state: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      },
      category: 'config'
    }
  );
}