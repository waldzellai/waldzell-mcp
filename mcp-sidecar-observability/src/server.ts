/**
 * MCP Observability Sidecar - HTTP+SSE Proxy
 * 
 * A transparent proxy that instruments any MCP server with OpenTelemetry metrics.
 * Accepts standard MCP JSON-RPC over HTTP and SSE, forwards to upstream, records metrics.
 */

import Fastify from 'fastify';
import { startTelemetry } from './otel.js';
import { loadConfig, validateConfig } from './config.js';
import { MCPInstrumentation } from './instrumentation.js';
import { UpstreamConnector } from './upstream.js';
import type { JSONRPCRequest, JSONRPCResponse } from './instrumentation.js';

// Initialize telemetry
await startTelemetry();

// Load and validate configuration
const config = loadConfig();
validateConfig(config);

// Initialize instrumentation
const instrumentation = new MCPInstrumentation(config.upstream.serverName);

// Initialize upstream connector
const upstream = new UpstreamConnector({
  url: config.upstream.url,
  timeoutMs: config.upstream.timeoutMs || 30000,
});

// Create Fastify server
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

/**
 * Standard MCP JSON-RPC endpoint
 * POST / with Content-Type: application/json
 */
app.post('/', async (request, reply) => {
  instrumentation.connectionOpened();
  const start = Date.now();
  
  try {
    // Parse request body
    const body = request.body as JSONRPCRequest;
    
    // Validate JSON-RPC format
    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      reply.code(400);
      return {
        jsonrpc: '2.0',
        id: body?.id,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC 2.0 request',
        },
      };
    }
    
    // Record incoming message size
    const requestSize = JSON.stringify(body).length;
    instrumentation.recordMessageBytes('in', requestSize);
    
    // Record request
    instrumentation.recordRequest(body);
    
    // Forward to upstream
    const response = await upstream.forwardRequest(body);
    
    // Record outgoing message size
    const responseSize = JSON.stringify(response).length;
    instrumentation.recordMessageBytes('out', responseSize);
    
    // Record response
    const duration = Date.now() - start;
    instrumentation.recordResponse(body, response, duration);
    
    // Update upstream availability
    instrumentation.setUpstreamAvailable(true);
    
    return response;
  } catch (err: any) {
    const duration = Date.now() - start;
    
    // Record error
    instrumentation.recordResponse(
      request.body as JSONRPCRequest,
      null,
      duration,
      err
    );
    
    // Update upstream availability
    instrumentation.setUpstreamAvailable(false);
    
    reply.code(500);
    return {
      jsonrpc: '2.0',
      id: (request.body as any)?.id,
      error: {
        code: -32603,
        message: `Proxy error: ${err.message}`,
      },
    };
  } finally {
    instrumentation.connectionClosed();
  }
});

/**
 * SSE endpoint for streaming responses
 * GET /sse
 * 
 * Note: Full SSE proxy implementation would require:
 * - EventSource connection to upstream
 * - Message forwarding with instrumentation
 * - Connection lifecycle management
 * 
 * For now, this is a placeholder. Most MCP servers use POST / for all communication.
 */
app.get('/sse', async (request, reply) => {
  instrumentation.sseStreamOpened();
  
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  
  reply.raw.write('data: {"jsonrpc":"2.0","error":{"code":-32601,"message":"SSE proxy not yet implemented"}}\n\n');
  
  request.raw.on('close', () => {
    instrumentation.sseStreamClosed();
  });
});

/**
 * Health check endpoint
 */
app.get('/health', async () => {
  const upstreamHealthy = await upstream.healthCheck();
  
  return {
    status: upstreamHealthy ? 'healthy' : 'degraded',
    sidecar: 'ok',
    upstream: upstreamHealthy ? 'ok' : 'unavailable',
    config: {
      upstreamUrl: config.upstream.url,
      serverName: config.upstream.serverName,
    },
  };
});

/**
 * Readiness check (for Kubernetes)
 */
app.get('/ready', async () => {
  return { ready: true };
});

// Periodic upstream health check
setInterval(async () => {
  const healthy = await upstream.healthCheck();
  instrumentation.setUpstreamAvailable(healthy);
}, 30000); // Check every 30s

// Start server
const { host, port } = config.listen;
await app.listen({ host, port });

console.log(`
🛰️  MCP Observability Sidecar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Listen:    http://${host}:${port}
  Upstream:  ${config.upstream.url}
  Server:    ${config.upstream.serverName}
  OTel:      ${config.otel.endpoint || 'default'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Health:    http://${host}:${port}/health
  Ready:     http://${host}:${port}/ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await app.close();
  process.exit(0);
});
