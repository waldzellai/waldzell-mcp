# Multi-Server Observability Setup

Example showing how to wrap **multiple MCP servers** with observability, all feeding into a single Prometheus/Grafana stack.

## Architecture

```
                    ┌─────────────────┐
                    │   Grafana       │
                    │   Dashboard     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Prometheus    │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐         ┌─────────▼────────┐
     │ OTel Collector  │         │ OTel Collector   │
     │   (weather)     │         │   (postgres)     │
     └────────┬────────┘         └─────────┬────────┘
              │                             │
     ┌────────▼────────┐         ┌─────────▼────────┐
     │  MCP Sidecar    │         │  MCP Sidecar     │
     │   :4001         │         │   :4002          │
     └────────┬────────┘         └─────────┬────────┘
              │                             │
     ┌────────▼────────┐         ┌─────────▼────────┐
     │ Weather Server  │         │ Postgres Server  │
     │   :3001         │         │   :3002          │
     └─────────────────┘         └──────────────────┘
```

## Docker Compose Configuration

```yaml
version: "3.9"

networks:
  mcp-network:
    driver: bridge

services:
  # ==========================================
  # Server 1: Weather MCP Server
  # ==========================================
  weather-server:
    image: node:20-slim
    working_dir: /app
    command: >
      sh -c "npm install -g @modelcontextprotocol/server-weather &&
             exec npx @modelcontextprotocol/server-weather"
    environment:
      PORT: 3001
    networks:
      - mcp-network

  weather-sidecar:
    build: .
    environment:
      MCP_UPSTREAM_URL: http://weather-server:3001
      MCP_UPSTREAM_NAME: weather
      PORT: 4001
      OTEL_SERVICE_NAME: mcp-sidecar-weather
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otelcol:4318
    ports:
      - "4001:4001"
    networks:
      - mcp-network
    depends_on:
      - weather-server
      - otelcol

  # ==========================================
  # Server 2: Postgres MCP Server
  # ==========================================
  postgres-server:
    image: node:20-slim
    working_dir: /app
    command: >
      sh -c "npm install -g @modelcontextprotocol/server-postgres &&
             exec npx @modelcontextprotocol/server-postgres"
    environment:
      PORT: 3002
      DATABASE_URL: postgresql://user:pass@db:5432/mydb
    networks:
      - mcp-network
    depends_on:
      - db

  postgres-sidecar:
    build: .
    environment:
      MCP_UPSTREAM_URL: http://postgres-server:3002
      MCP_UPSTREAM_NAME: postgres
      PORT: 4002
      OTEL_SERVICE_NAME: mcp-sidecar-postgres
      OTEL_EXPORTER_OTLP_ENDPOINT: http://otelcol:4318
    ports:
      - "4002:4002"
    networks:
      - mcp-network
    depends_on:
      - postgres-server
      - otelcol

  # ==========================================
  # Database (for postgres server)
  # ==========================================
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    networks:
      - mcp-network
    volumes:
      - db-data:/var/lib/postgresql/data

  # ==========================================
  # Observability Stack (shared)
  # ==========================================
  otelcol:
    image: otel/opentelemetry-collector-contrib:0.113.0
    command: ["--config=/etc/otelcol/config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol/config.yaml:ro
    ports:
      - "8889:8889"  # Prometheus exporter
      - "4318:4318"  # OTLP HTTP receiver
    networks:
      - mcp-network

  prometheus:
    image: prom/prometheus:v2.52.0
    volumes:
      - ./prometheus-multi.yml:/etc/prometheus/prometheus.yml:ro
      - ./alerts.yml:/etc/prometheus/alerts.yml:ro
    ports:
      - "9090:9090"
    networks:
      - mcp-network
    depends_on:
      - otelcol

  grafana:
    image: grafana/grafana:11.0.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning:ro
      - ./grafana/dashboards:/var/lib/grafana/dashboards:ro
    networks:
      - mcp-network
    depends_on:
      - prometheus

volumes:
  db-data:
```

## Prometheus Configuration (prometheus-multi.yml)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - alerts.yml

scrape_configs:
  - job_name: 'otelcol-sidecar'
    static_configs:
      - targets: ['otelcol:8889']
    
    # Relabel to add job labels per server
    relabel_configs:
      - source_labels: [server_name]
        target_label: mcp_server
```

## Usage

### Start the Stack

```bash
docker compose -f docker-compose-multi.yml up --build
```

### Access Services

- **Weather Sidecar**: http://localhost:4001
- **Postgres Sidecar**: http://localhost:4002
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

### Query Weather Server (via sidecar)

```bash
curl -X POST http://localhost:4001 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get-weather",
      "arguments": {"location": "San Francisco"}
    }
  }'
```

### Query Postgres Server (via sidecar)

```bash
curl -X POST http://localhost:4002 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "query",
      "arguments": {"sql": "SELECT version()"}
    }
  }'
```

## Grafana Queries

### Compare Server Request Rates

```promql
sum(rate(mcp_requests_total[5m])) by (server_name)
```

### Compare Tool Call Rates

```promql
sum(rate(mcp_tool_calls_total[5m])) by (server_name, tool_name)
```

### Compare Error Rates

```promql
sum(rate(mcp_requests_total{status="error"}[5m])) by (server_name) /
sum(rate(mcp_requests_total[5m])) by (server_name)
```

### Compare Latencies

```promql
histogram_quantile(0.95,
  sum by (le, server_name) (rate(mcp_request_duration_seconds_bucket[5m]))
)
```

## Benefits

1. **Unified Monitoring**: Single Grafana instance for all MCP servers
2. **Comparative Analysis**: Compare performance across servers
3. **Resource Efficiency**: Shared Prometheus/Grafana reduces overhead
4. **Independent Scaling**: Scale sidecars per server load
5. **Isolation**: Each server's telemetry is tagged and isolated

## Adding New Servers

To add a new MCP server to the stack:

1. Add the upstream server service
2. Add a sidecar service with unique:
   - `MCP_UPSTREAM_URL`
   - `MCP_UPSTREAM_NAME`
   - `PORT`
   - `OTEL_SERVICE_NAME`
3. No changes needed to observability stack!

## Best Practices

1. **Unique Ports**: Each sidecar needs a unique port (4001, 4002, 4003...)
2. **Descriptive Names**: Use clear `MCP_UPSTREAM_NAME` (weather, postgres, github)
3. **Resource Limits**: Set memory/CPU limits per sidecar
4. **Health Checks**: Monitor each sidecar's `/health` endpoint
5. **Alert Routing**: Use `server_name` label to route alerts per server

## Scaling

### Horizontal Scaling (Multiple Replicas)

```yaml
weather-sidecar:
  deploy:
    replicas: 3
  # ... rest of config
```

Use a load balancer (nginx, traefik) in front of replicas.

### Vertical Scaling (Resources)

```yaml
weather-sidecar:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

## Troubleshooting

### Check Sidecar Health

```bash
curl http://localhost:4001/health
curl http://localhost:4002/health
```

### Check Metrics Flow

```bash
# Check OTel Collector is receiving metrics
curl http://localhost:8889/metrics | grep mcp_requests_total

# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets
```

### Check Upstream Connectivity

```bash
# Should show upstream status
curl http://localhost:4001/health | jq .upstream
```

## Advanced: Service Mesh Integration

For production, consider using a service mesh (Istio, Linkerd) which provides:
- Automatic mutual TLS
- Advanced traffic routing
- Built-in observability
- Circuit breaking

The sidecar pattern integrates seamlessly with service meshes.

---

See parent [README.md](../README.md) for more details on configuration and metrics.
