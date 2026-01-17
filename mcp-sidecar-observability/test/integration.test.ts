import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Integration test for MCP Observability Sidecar
 * 
 * Tests:
 * 1. Mock upstream MCP server responds to requests
 * 2. Sidecar proxies requests correctly
 * 3. Metrics are exported to OTLP collector
 */

test('MCP sidecar proxies requests and exports metrics', async t => {
  // ========================================
  // Setup mock upstream MCP server
  // ========================================
  const upstreamPort = 3999;
  const upstreamServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            message: 'mock upstream response',
            method: request.method,
          },
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(400).end();
      }
    });
  });
  
  await new Promise<void>(resolve => upstreamServer.listen(upstreamPort, resolve));
  t.after(() => upstreamServer.close());
  
  // ========================================
  // Setup mock OTLP collector
  // ========================================
  const received: any[] = [];
  let resolveMetric: () => void;
  const metricPromise = new Promise<void>(res => { resolveMetric = res; });
  
  const collector = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        received.push(data);
        resolveMetric?.();
      } catch {
        received.push(null);
      }
      res.writeHead(200).end();
    });
  });
  
  const collectorPort = 4319;
  await new Promise<void>(resolve => collector.listen(collectorPort, resolve));
  t.after(() => collector.close());
  
  // ========================================
  // Start MCP sidecar
  // ========================================
  const root = dirname(fileURLToPath(import.meta.url));
  const projectDir = join(root, '..');
  const tsxPath = join(projectDir, 'node_modules', '.bin', 'tsx');
  
  const sidecarPort = 4100;
  const serverEnv = {
    ...process.env,
    // Sidecar config
    PORT: String(sidecarPort),
    HOST: '127.0.0.1',
    MCP_UPSTREAM_URL: `http://localhost:${upstreamPort}`,
    MCP_UPSTREAM_NAME: 'test-server',
    MCP_UPSTREAM_TIMEOUT_MS: '5000',
    
    // OTel config
    OTEL_SERVICE_NAME: 'test-sidecar',
    OTEL_METRIC_EXPORT_INTERVAL: '200',
    OTEL_EXPORTER_OTLP_ENDPOINT: `http://localhost:${collectorPort}`,
    OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
    
    // Logging
    LOG_LEVEL: 'error',
  };
  
  const serverProc = spawn(tsxPath, ['src/server.ts'], {
    cwd: projectDir,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  t.after(() => serverProc.kill());
  
  // Wait for sidecar to start
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('sidecar did not start')), 10000);
    serverProc.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('MCP Observability Sidecar') || output.includes('listening')) {
        clearTimeout(timer);
        resolve();
      }
    });
    serverProc.on('error', reject);
  });
  
  // Give it a moment to fully initialize
  await sleep(500);
  
  // ========================================
  // Test 1: Health check
  // ========================================
  const healthRes = await fetch(`http://localhost:${sidecarPort}/health`);
  assert.equal(healthRes.status, 200);
  const health = await healthRes.json();
  assert.equal(health.status, 'healthy');
  assert.equal(health.upstream, 'ok');
  
  // ========================================
  // Test 2: Proxy MCP request
  // ========================================
  const mcpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
  };
  
  const mcpRes = await fetch(`http://localhost:${sidecarPort}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mcpRequest),
  });
  
  assert.equal(mcpRes.status, 200);
  const mcpResponse = await mcpRes.json();
  assert.equal(mcpResponse.jsonrpc, '2.0');
  assert.equal(mcpResponse.id, 1);
  assert.ok(mcpResponse.result);
  assert.equal(mcpResponse.result.method, 'tools/list');
  
  // ========================================
  // Test 3: Verify metrics exported
  // ========================================
  await Promise.race([metricPromise, sleep(5000)]);
  
  assert.ok(received.length > 0, 'no metrics received from sidecar');
  
  const payload = JSON.stringify(received);
  assert.ok(
    payload.includes('mcp_requests_total') || payload.includes('mcp_request'),
    'expected MCP metric name not found'
  );
  
  console.log('✓ Integration test passed: Proxy works and metrics exported');
});
