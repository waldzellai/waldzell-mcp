# MCP Sidecar Observability (sidecar-first)

## What this is
MCP server in Node/TS instrumented with OpenTelemetry metrics (OTLP) into an OpenTelemetry Collector sidecar. Collector exposes Prometheus metrics on :8889; Prometheus and Grafana wired for local demo. Claude Code telemetry optional.

## Quickstart (local)
```bash
docker compose up --build
npm run loadtest
# Prometheus: http://localhost:9090
# Grafana:   http://localhost:3000 (admin/admin)
```

Kubernetes

```
kubectl apply -f k8s/otel-collector-configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
# (Optional) ServiceMonitor if using Prometheus Operator
kubectl apply -f k8s/servicemonitor.yaml
```

Metrics of interest
•mcp_request_total{status,method}
•mcp_request_duration_seconds_bucket
•mcp_inflight_requests
•claude_code_token_usage (when Claude Code telemetry enabled)

Safety defaults
•Prompt content not exported; Collector deletes prompt attribute.
•Labels restricted to low cardinality (method, status).

Versions pinned
•Node 20, OTel Collector v0.131.0, Prometheus v2.52.0, Grafana 11.0.0

**Done when**
- README renders without TODOs and matches actual file paths/ports.
