import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Integration test ensuring sidecar receives OTLP metrics from server

test('exports metrics to OTLP collector', async t => {
  const received: any[] = [];
  let resolveMetric: () => void;
  const metricPromise = new Promise<void>(res => { resolveMetric = res; });

  const collector = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        received.push(JSON.parse(body));
      } catch {
        received.push(null);
      }
      res.writeHead(200).end();
      resolveMetric();
    });
  });

  const collectorPort = 4319;
  await new Promise<void>(resolve => collector.listen(collectorPort, resolve));
  t.after(() => collector.close());

  const root = dirname(fileURLToPath(import.meta.url));
  const projectDir = join(root, '..');
  const tsxPath = join(projectDir, 'node_modules', '.bin', 'tsx');

  const serverEnv = {
    ...process.env,
    PORT: '4100',
    CLAUDE_CODE_API_KEY: 'test-key',
    OTEL_METRIC_EXPORT_INTERVAL: '200',
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: `http://localhost:${collectorPort}/v1/metrics`,
    OTEL_EXPORTER_OTLP_METRICS_PROTOCOL: 'http/json'
  };

  const serverProc = spawn(tsxPath, ['src/server.ts'], {
    cwd: projectDir,
    env: serverEnv,
    stdio: ['ignore', 'pipe', 'inherit']
  });
  t.after(() => serverProc.kill());

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start')), 5000);
    serverProc.stdout.on('data', data => {
      if (data.toString().includes('listening')) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  const res = await fetch('http://localhost:4100/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, method: 'unknown' })
  });
  assert.equal(res.status, 400);
  await res.text();

  await Promise.race([metricPromise, sleep(5000)]);
  assert.ok(received.length > 0, 'no metrics received');
  const payload = JSON.stringify(received[0]);
  assert.ok(payload.includes('mcp_request_total'), 'metric name missing');
});
