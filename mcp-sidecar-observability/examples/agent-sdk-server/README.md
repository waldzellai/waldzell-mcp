# Claude Agent SDK as MCP Server

An interesting pattern: Expose the **Claude Agent SDK** as a standard **MCP (Model Context Protocol) server**.

This allows any MCP client (Claude Desktop, custom apps, etc.) to interact with Claude agents through the standardized MCP protocol.

## 🎯 Why This Pattern?

- **Standardization**: Use MCP protocol to interact with Claude agents
- **Interoperability**: Any MCP client can now use Claude Agent SDK
- **Observability**: Can be wrapped with MCP observability sidecar
- **Tool Integration**: Expose agent operations as MCP tools
- **State Management**: Expose agent state/history as MCP resources

## 🏗️ Architecture

```
┌─────────────────┐
│  MCP Client     │  (Claude.app, custom client)
│                 │
└────────┬────────┘
         │ MCP JSON-RPC (HTTP)
         ▼
┌──────────────────────────────┐
│  Agent SDK MCP Server        │
│  - tools/list                │
│  - tools/call (agent-query)  │
│  - resources/read (history)  │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Claude Agent SDK            │
│  @anthropic-ai/claude-agent  │
└──────────────────────────────┘
```

## 🔧 MCP Capabilities Exposed

### Tools

#### `agent-query`
Send a query to Claude agent and get response.

**Input Schema:**
```json
{
  "prompt": "Your question or instruction",
  "stream": true
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "agent-query",
    "arguments": {
      "prompt": "What's the weather like?",
      "stream": true
    }
  }
}
```

#### `agent-status`
Get current agent status and capabilities.

### Resources

#### `agent://config`
Current agent configuration and settings (model, tokens, etc.)

#### `agent://history`
Recent conversation history with the agent (last 50 messages)

## 🚀 Usage

### Standalone

```bash
cd examples/agent-sdk-server
npm install
export ANTHROPIC_API_KEY=your-api-key
npm start
```

### With Observability Sidecar

```bash
# Terminal 1: Start Agent SDK MCP Server
cd examples/agent-sdk-server
PORT=3000 npm start

# Terminal 2: Start observability sidecar
cd ../..
export MCP_UPSTREAM_URL=http://localhost:3000
export MCP_UPSTREAM_NAME=agent-sdk
export PORT=4000
npm start

# Now connect MCP clients to http://localhost:4000 (with observability!)
```

### Docker Compose

```yaml
services:
  agent-sdk-server:
    build: ./examples/agent-sdk-server
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      PORT: 3000
    ports:
      - "3000:3000"
  
  mcp-sidecar:
    build: .
    environment:
      MCP_UPSTREAM_URL: http://agent-sdk-server:3000
      MCP_UPSTREAM_NAME: agent-sdk
      PORT: 4000
      # ... OTel config ...
    ports:
      - "4000:4000"
    depends_on:
      - agent-sdk-server
```

## 🧪 Testing

Test with `curl`:

```bash
# Initialize
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0"}
    }
  }'

# List tools
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/list"}'

# Query agent
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "agent-query",
      "arguments": {"prompt": "Hello!"}
    }
  }'

# Read conversation history
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "resources/read",
    "params": {"uri": "agent://history"}
  }'
```

## 📊 Metrics (when wrapped with sidecar)

When running through the observability sidecar, you get:

- `mcp_tool_calls_total{tool_name="agent-query"}` - Agent query rate
- `mcp_tool_duration_seconds{tool_name="agent-query"}` - Agent response time
- `mcp_resource_reads_total{resource_uri="agent://history"}` - History reads
- All standard MCP protocol metrics

## 🎨 Interesting Use Cases

1. **Multi-tenant agent hosting**: Expose multiple agents through MCP, route via sidecar
2. **Agent monitoring**: Full observability of all agent interactions
3. **Agent marketplace**: Standardized interface for discovering/using agents
4. **Hybrid architectures**: Mix Agent SDK with other MCP servers seamlessly
5. **Testing**: Use MCP clients to test Agent SDK applications

## 🔮 Future Enhancements

- [ ] Implement full streaming support (SSE)
- [ ] Add prompts/list for pre-configured agent prompts
- [ ] Add tool use tracking as separate MCP tools
- [ ] Support multiple concurrent conversations
- [ ] Add authentication/authorization
- [ ] Implement conversation branching
- [ ] Add agent memory persistence

## 📚 Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Parent Project README](../../README.md)

---

**Note**: This is a reference implementation. For production use, add proper error handling, authentication, rate limiting, and streaming support.
