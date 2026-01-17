# Changelog

All notable changes to the MCP Observability Sidecar project.

## [0.2.0] - 2026-01-17

### 🎯 Major Refactoring: Generic MCP Sidecar

Complete architectural refactoring from a Claude-specific server to a **generic, transparent MCP observability proxy**.

### Added

- **Generic HTTP+SSE Proxy**: Can now wrap ANY MCP server (weather, postgres, github, etc.)
- **Configuration System** (`src/config.ts`): Environment-based configuration for upstream servers
- **Upstream Connector** (`src/upstream.ts`): HTTP+SSE communication with upstream MCP servers
- **Protocol-Aware Instrumentation** (`src/instrumentation.ts`): Tracks MCP protocol specifics
  - Request/response by method
  - Tool calls by tool name
  - Resource operations by URI
  - Prompt operations by name
  - Upstream availability monitoring
- **Health Endpoints**: `/health` and `/ready` for monitoring and Kubernetes
- **Enhanced Grafana Dashboard**: 15 panels with protocol-aware visualizations
  - Upstream status indicator
  - Requests by method/status
  - Tool call tracking
  - Resource operation tracking
  - Top methods/tools tables
- **Multi-Server Example**: Documentation for wrapping multiple MCP servers
- **Agent SDK Example**: Reference implementation exposing Claude Agent SDK as MCP server
- **Comprehensive Documentation**: Updated README, examples, and usage guides

### Changed

- **Breaking**: Removed Claude Code SDK dependency (was `@anthropic-ai/claude-code`)
- **Breaking**: Replaced custom `mcp/ask` method with standard MCP JSON-RPC protocol
- **Breaking**: Now requires `MCP_UPSTREAM_URL` environment variable
- **Metrics Naming**: 
  - `mcp_request_total` → `mcp_requests_total`
  - Added `server_name` label to all metrics
  - Added capability-specific metrics (tools, resources, prompts)
- **Docker Compose**: Now includes example upstream server (weather API)
- **Load Test**: Updated to send realistic MCP protocol traffic
- **Integration Test**: Refactored to test proxy functionality
- **Alerts**: Updated with new metric names and added upstream health alert
- **Package Version**: 0.1.0 → 0.2.0

### Removed

- `@anthropic-ai/claude-code` dependency (no longer needed for generic proxy)
- Custom `mcp/ask` method handling
- Direct Claude SDK integration from core

### Technical Details

#### New Architecture

```
Client → Sidecar (proxy + instrumentation) → Upstream MCP Server
                ↓
         OpenTelemetry Collector → Prometheus → Grafana
```

#### New Metrics

Protocol-level:
- `mcp_requests_total{method, server_name, status}`
- `mcp_request_duration_seconds{method, server_name, status}`
- `mcp_active_connections{server_name}`
- `mcp_protocol_errors_total{error_code, method, server_name}`
- `mcp_message_bytes_total{direction, server_name}`

Capability-specific:
- `mcp_tools_listed_total{server_name}`
- `mcp_tool_calls_total{tool_name, server_name, status}`
- `mcp_tool_duration_seconds{tool_name, server_name}`
- `mcp_resources_listed_total{server_name}`
- `mcp_resource_reads_total{resource_uri, server_name}`
- `mcp_prompts_listed_total{server_name}`
- `mcp_prompt_gets_total{prompt_name, server_name}`

Transport:
- `mcp_sse_streams_active{server_name}`

Health:
- `mcp_upstream_available{server_name}`

#### Configuration Changes

**Before (0.1.0):**
```bash
PORT=4000 npm start
```

**After (0.2.0):**
```bash
export MCP_UPSTREAM_URL=http://your-mcp-server:3000
export MCP_UPSTREAM_NAME=your-server
export PORT=4000
npm start
```

#### Migration Guide

If you were using 0.1.0:

1. **Install an upstream MCP server** (or use your existing one)
2. **Set environment variables**:
   ```bash
   export MCP_UPSTREAM_URL=http://localhost:3000
   export MCP_UPSTREAM_NAME=my-server
   ```
3. **Update Grafana queries** to use `mcp_requests_total` (plural)
4. **Update alerts** to use new metric names
5. **(Optional)** Use the Agent SDK example if you need Claude integration

### Infrastructure

- Node.js 20+
- TypeScript 5.5+
- Fastify 5.0
- OpenTelemetry SDK 0.203.0
- OTel Collector Contrib 0.113.0
- Prometheus 2.52.0
- Grafana 11.0.0

### Examples

- `examples/agent-sdk-server/`: Claude Agent SDK as MCP server
- `examples/multi-server-setup.md`: Multiple MCP servers with shared observability

### Testing

- Updated integration test to verify proxy behavior
- Load test now sends realistic MCP traffic (initialize, tools/list, tools/call, etc.)
- All tests pass with new architecture

---

## [0.1.0] - 2024-XX-XX

### Initial Release

- Basic MCP server with Claude Code integration
- OpenTelemetry metrics export
- Docker Compose setup
- Grafana dashboard
- Prometheus alerts
