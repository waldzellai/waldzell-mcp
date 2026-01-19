# MCP Observability Sidecar

A **generic, transparent HTTP+SSE proxy** that adds OpenTelemetry instrumentation to **any MCP (Model Context Protocol) server**.

## 🎯 What This Is

A **sidecar** that you can wrap around any MCP server to get instant observability:

- ✅ Protocol-aware metrics (methods, tools, resources)
- ✅ OpenTelemetry export to Collector → Prometheus → Grafana
- ✅ Transparent proxy (zero code changes to upstream server)
- ✅ Production-ready (PII hashing, alerts, K8s manifests)
- ✅ HTTP+SSE transport (the modern MCP standard)

## 🏗️ Architecture

```
┌─────────────────┐
│  MCP Client     │  (Claude.app, custom app, etc.)
│                 │
└────────┬────────┘
         │ HTTP + SSE
         ▼
┌─────────────────────────────────┐
│  MCP Observability Sidecar      │  ← This project
│  - Intercept all JSON-RPC       │
│  - Record OTel metrics          │
│  - Forward to upstream          │
└────────┬────────────────────────┘
         │ HTTP+SSE
         │ OTel → Collector
         ▼
┌─────────────────────────────────┐
│  Upstream MCP Server            │  ← ANY MCP server
│  (weather, postgres, github...) │
└─────────────────────────────────┘
         ▼
┌─────────────────────────────────┐
│  Observability Stack            │
│  Collector → Prometheus → Grafana
└─────────────────────────────────┘
```

## 🚀 Quick Start

### Docker Compose (Recommended)

```bash
# Clone repo
git clone <repo-url>
cd mcp-sidecar-observability

# Start full stack (weather server + sidecar + observability)
docker compose up --build

# Access services:
# - MCP Proxy:  http://localhost:4000
# - Prometheus: http://localhost:9090
# - Grafana:    http://localhost:3000 (admin/admin)

# Send test traffic
npm run loadtest
```

The default `docker-compose.yml` wraps the `@modelcontextprotocol/server-weather` as an example.

### Manual Setup

```bash
# Install dependencies
npm install

# Configure upstream server
export MCP_UPSTREAM_URL=http://your-mcp-server:3000
export MCP_UPSTREAM_NAME=your-server-name
export PORT=4000

# Configure OpenTelemetry
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=mcp-sidecar

# Start sidecar
npm start

# Clients connect to http://localhost:4000 (sidecar)
# Sidecar forwards to http://your-mcp-server:3000 (upstream)
```

## ⚙️ Configuration

All configuration via environment variables:

### Upstream Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MCP_UPSTREAM_URL` | ✅ Yes | - | URL of upstream MCP server (e.g., `http://weather:3000`) |
| `MCP_UPSTREAM_NAME` | No | `upstream` | Friendly name for metrics labels |
| `MCP_UPSTREAM_TIMEOUT_MS` | No | `30000` | Timeout for upstream requests (ms) |

### Listen Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Port to listen on |
| `HOST` | No | `0.0.0.0` | Host to bind to |

### OpenTelemetry

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OTEL_SERVICE_NAME` | No | `mcp-sidecar` | Service name in OTel |
| `SERVICE_VERSION` | No | `0.2.0` | Service version |
| `OTEL_ENV` | No | `dev` | Environment (dev/prod) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | - | OTel Collector endpoint |
| `OTEL_METRIC_EXPORT_INTERVAL` | No | `10000` | Metric export interval (ms) |

## 📊 Metrics

### Protocol-Level Metrics

```promql
# Request rate by method
mcp_requests_total{method, server_name, status}

# Request latency
mcp_request_duration_seconds{method, server_name, status}

# Active connections
mcp_active_connections{server_name}

# Protocol errors
mcp_protocol_errors_total{error_code, method, server_name}

# Message throughput
mcp_message_bytes_total{direction, server_name}
```

### Capability-Specific Metrics

```promql
# Tools
mcp_tools_listed_total{server_name}
mcp_tool_calls_total{tool_name, server_name, status}
mcp_tool_duration_seconds{tool_name, server_name}

# Resources
mcp_resources_listed_total{server_name}
mcp_resource_reads_total{resource_uri, server_name}

# Prompts
mcp_prompts_listed_total{server_name}
mcp_prompt_gets_total{prompt_name, server_name}
```

### Server Health

```promql
# Upstream availability (1=up, 0=down)
mcp_upstream_available{server_name}
```

## 📈 Grafana Dashboard

Pre-configured dashboard at `grafana/dashboards/mcp-observability.json` includes:

- **Overview**: Upstream status, request rate, error rate, p95 latency
- **Request Analysis**: By method, by status, latency percentiles
- **Tool Tracking**: Call rates, durations, top tools
- **Resource Usage**: List/read operations, message throughput
- **Error Analysis**: Protocol errors by code

Import via: Grafana UI → Dashboards → Import → Upload JSON

## 🔐 Security & Privacy

### PII Protection (in OTel Collector)

The collector sanitizes telemetry before export:

```yaml
processors:
  attributes/sanitize:
    actions:
      - key: user.account_uuid
        action: hash  # Deterministic hash
      - key: prompt
        action: delete  # Never export prompt content
```

### Configuration

See `otel-collector-config.yaml`:
- Hashes: `user.account_uuid`, `user.id`
- Deletes: `prompt`, `message.content`, any attribute matching `*token*`

## 🚨 Alerts

Pre-configured Prometheus alerts in `alerts.yml`:

- **MCPHighErrorRate**: Error rate > 5% for 5 minutes
- **MCPLatencyP95TooHigh**: P95 latency > 5s for 5 minutes
- **CollectorDown**: OTel Collector unreachable

## ☸️ Kubernetes Deployment

Deploy with Helm or raw manifests:

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# (Optional) ServiceMonitor for Prometheus Operator
kubectl apply -f k8s/servicemonitor.yaml
```

The `k8s/deployment.yaml` shows the sidecar pattern:

```yaml
containers:
  - name: app
    image: your-mcp-server:latest
    ports:
      - containerPort: 3000
  
  - name: otelcol
    image: otel/opentelemetry-collector-contrib:0.113.0
    # ... collector config ...
```

## 🧪 Testing

### Integration Test

```bash
npm test
```

Runs `test/integration.test.ts`:
- Starts mock OTel collector
- Starts MCP sidecar
- Sends requests
- Asserts metrics received

### Load Test

```bash
npm run loadtest

# Options:
URL=http://localhost:4000 CONCURRENCY=50 TOTAL=1000 npm run loadtest
```

Sends realistic MCP traffic:
- 5% `initialize`
- 30% `tools/list`
- 40% `tools/call`
- 15% `resources/list`
- 10% `resources/read`

## 📚 Examples

### Wrap Weather Server

```bash
export MCP_UPSTREAM_URL=http://localhost:3001
export MCP_UPSTREAM_NAME=weather
npm start
# (assumes weather server running on :3001)
```

### Wrap Postgres Server

```bash
export MCP_UPSTREAM_URL=http://postgres-mcp:4000
export MCP_UPSTREAM_NAME=postgres
npm start
```

### Wrap Agent SDK Server (Interesting Pattern!)

See `examples/agent-sdk-server/` for exposing Claude Agent SDK as an MCP server, then wrap it:

```bash
# Terminal 1: Agent SDK MCP Server
cd examples/agent-sdk-server
npm install && PORT=3000 npm start

# Terminal 2: Observability Sidecar
cd ../..
export MCP_UPSTREAM_URL=http://localhost:3000
export MCP_UPSTREAM_NAME=agent-sdk
npm start
```

Now you have **Claude Agent SDK with full MCP observability**!

## 🔧 Development

```bash
# Install
npm install

# Dev mode (auto-reload)
npm run dev

# Build
npm run build

# Start production
npm start
```

## 📦 Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.5+
- **HTTP Server**: Fastify 5.0
- **Telemetry**: OpenTelemetry (Node SDK, API, Exporters)
- **Collector**: OTel Collector Contrib 0.113.0
- **Metrics**: Prometheus 2.52.0
- **Visualization**: Grafana 11.0.0

## 🎯 Use Cases

1. **Production Monitoring**: Wrap production MCP servers with zero code changes
2. **Debugging**: See exactly what methods/tools are being called
3. **Performance Analysis**: Track tool execution times, identify bottlenecks
4. **Capacity Planning**: Monitor request rates, connection counts
5. **Multi-Server Observability**: Run one sidecar per server, unified Grafana view
6. **Security Auditing**: Track all tool calls, resource accesses with PII protection

## 🔮 Roadmap

- [x] HTTP+SSE proxy implementation
- [x] Protocol-aware metrics
- [x] Grafana dashboard
- [x] PII protection
- [x] Kubernetes manifests
- [x] Integration tests
- [x] Agent SDK example
- [ ] Full SSE streaming proxy (currently placeholder)
- [ ] Stdio connector (for wrapping local servers)
- [ ] Distributed tracing (spans)
- [ ] Log export
- [ ] Rate limiting
- [ ] Authentication passthrough

## 📄 License

Apache-2.0

## 🤝 Contributing

Contributions welcome! See issues for planned features.

## 📚 Resources

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Prometheus Query Docs](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/dashboards/)

---

**Questions?** Open an issue or see `examples/` for detailed usage patterns.
