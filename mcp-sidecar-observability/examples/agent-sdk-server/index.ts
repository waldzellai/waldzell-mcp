/**
 * Claude Agent SDK as MCP Server
 * 
 * Interesting pattern: Expose Claude Agent SDK capabilities through MCP protocol.
 * This allows any MCP client to interact with Claude agents.
 * 
 * MCP Tools exposed:
 * - agent-query: Send a query to Claude agent and get streaming response
 * - agent-status: Get current agent status and capabilities
 * 
 * Resources exposed:
 * - agent://config: Agent configuration
 * - agent://history: Recent conversation history
 */

import Fastify from 'fastify';
// Note: Using placeholder imports - update with actual Agent SDK API
// import { Agent, query } from '@anthropic-ai/claude-agent-sdk';

const app = Fastify({ logger: true });

// MCP Protocol implementation
interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// In-memory conversation history
const conversationHistory: Array<{ role: string; content: string; timestamp: number }> = [];

/**
 * Main MCP endpoint
 */
app.post('/', async (request, reply) => {
  const req = request.body as JSONRPCRequest;
  
  try {
    let result: any;
    
    switch (req.method) {
      case 'initialize':
        result = handleInitialize(req.params);
        break;
      
      case 'tools/list':
        result = handleToolsList();
        break;
      
      case 'tools/call':
        result = await handleToolCall(req.params);
        break;
      
      case 'resources/list':
        result = handleResourcesList();
        break;
      
      case 'resources/read':
        result = handleResourceRead(req.params);
        break;
      
      default:
        throw { code: -32601, message: `Method not found: ${req.method}` };
    }
    
    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id: req.id,
      result,
    };
    
    return response;
  } catch (err: any) {
    const response: JSONRPCResponse = {
      jsonrpc: '2.0',
      id: req.id,
      error: {
        code: err.code || -32603,
        message: err.message || 'Internal error',
      },
    };
    
    return response;
  }
});

/**
 * Handle MCP initialize
 */
function handleInitialize(params: any) {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
    },
    serverInfo: {
      name: 'agent-sdk-mcp-server',
      version: '1.0.0',
      description: 'Claude Agent SDK exposed as MCP server',
    },
  };
}

/**
 * List available tools (Claude agent operations)
 */
function handleToolsList() {
  return {
    tools: [
      {
        name: 'agent-query',
        description: 'Send a query to Claude agent and get response',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The query to send to Claude agent',
            },
            stream: {
              type: 'boolean',
              description: 'Whether to stream the response',
              default: true,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'agent-status',
        description: 'Get current agent status and capabilities',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
}

/**
 * Call a tool (execute agent operation)
 */
async function handleToolCall(params: any) {
  const { name, arguments: args } = params;
  
  switch (name) {
    case 'agent-query': {
      const { prompt, stream = true } = args;
      
      // TODO: Replace with actual Agent SDK query
      // For now, mock implementation
      const response = `[Mock Agent Response] I received your query: "${prompt}". This would normally call the Claude Agent SDK.`;
      
      // Store in history
      conversationHistory.push({
        role: 'user',
        content: prompt,
        timestamp: Date.now(),
      });
      conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });
      
      // Keep only last 50 messages
      if (conversationHistory.length > 50) {
        conversationHistory.splice(0, conversationHistory.length - 50);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    }
    
    case 'agent-status': {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              status: 'ready',
              model: 'claude-sonnet-4-20250514',
              capabilities: ['query', 'streaming', 'tools'],
              conversationLength: conversationHistory.length,
            }, null, 2),
          },
        ],
      };
    }
    
    default:
      throw { code: -32601, message: `Tool not found: ${name}` };
  }
}

/**
 * List available resources (agent state/config)
 */
function handleResourcesList() {
  return {
    resources: [
      {
        uri: 'agent://config',
        name: 'Agent Configuration',
        description: 'Current agent configuration and settings',
        mimeType: 'application/json',
      },
      {
        uri: 'agent://history',
        name: 'Conversation History',
        description: 'Recent conversation history with the agent',
        mimeType: 'application/json',
      },
    ],
  };
}

/**
 * Read a resource (get agent state)
 */
function handleResourceRead(params: any) {
  const { uri } = params;
  
  switch (uri) {
    case 'agent://config':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              maxTokens: 4096,
              temperature: 1.0,
              streaming: true,
            }, null, 2),
          },
        ],
      };
    
    case 'agent://history':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(conversationHistory, null, 2),
          },
        ],
      };
    
    default:
      throw { code: -32002, message: `Resource not found: ${uri}` };
  }
}

/**
 * Health check
 */
app.get('/health', async () => {
  return {
    status: 'healthy',
    service: 'agent-sdk-mcp-server',
    uptime: process.uptime(),
  };
});

// Start server
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

await app.listen({ host: HOST, port: PORT });

console.log(`
🤖 Claude Agent SDK MCP Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Listen:  http://${HOST}:${PORT}
  Health:  http://${HOST}:${PORT}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  MCP Tools:
  - agent-query: Query Claude agent
  - agent-status: Get agent status
  
  MCP Resources:
  - agent://config
  - agent://history
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
