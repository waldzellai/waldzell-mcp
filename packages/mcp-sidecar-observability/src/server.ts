import Fastify from 'fastify';
import { startTelemetry } from './otel.js';
import { metrics } from '@opentelemetry/api';
import { query } from '@anthropic-ai/claude-code';

await startTelemetry();

// Global meter from NodeSDK pipeline
const meter = metrics.getMeter('mcp-server');

// Metrics
const reqCounter = meter.createCounter('mcp_request_total', {
  description: 'Total MCP requests handled'
});

const msgCounter = meter.createCounter('mcp_jsonrpc_messages_total', {
  description: 'JSON-RPC message count in/out'
});

const inflight = meter.createUpDownCounter('mcp_inflight_requests', {
  description: 'Concurrent in-flight requests'
});

const reqDuration = meter.createHistogram('mcp_request_duration_seconds', {
  description: 'Request latency',
  unit: 's'
});

const app = Fastify({ logger: false });

interface MCPPayload {
  id: string | number;
  method: string;
  params?: { prompt?: string };
}

app.post('/', async (request, reply) => {
  msgCounter.add(1, { direction: 'in' });

  const start = process.hrtime.bigint();
  let status: 'ok' | 'error' = 'ok';

  inflight.add(1);
  try {
    const body = request.body as MCPPayload;
    if (!body || body.method !== 'mcp/ask' || !body.params?.prompt) {
      status = 'error';
      reqCounter.add(1, { method: body?.method ?? 'unknown', status });
      reply.code(400);
      return { error: 'Invalid MCP request. Expect method=mcp/ask and params.prompt' };
    }

    reqCounter.add(1, { method: body.method, status: 'ok' });

    const parts: string[] = [];
    for await (const chunk of query({ prompt: body.params.prompt }) as any) {
      const content = (chunk as any)?.content;
      if (typeof content === 'string') parts.push(content);
      // (Optional) if chunk includes tool use/results, increment a tool metric here.
    }

    const result = parts.join('');
    msgCounter.add(1, { direction: 'out' });
    return { id: body.id, result };
  } catch (err: any) {
    status = 'error';
    reqCounter.add(1, { method: 'mcp/ask', status });
    reply.code(500);
    return { error: String(err?.message ?? err) };
  } finally {
    const end = process.hrtime.bigint();
    const seconds = Number(end - start) / 1e9;
    reqDuration.record(seconds, { method: 'mcp/ask', status });
    inflight.add(-1);
  }
});

const port = Number(process.env.PORT) || 4000;
app.listen({ port }, () => {
  console.log(`🛰️ MCP server listening on http://localhost:${port} (OTLP → sidecar)`);
});
