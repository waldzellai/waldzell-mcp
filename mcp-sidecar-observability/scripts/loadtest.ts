/**
 * Load test for MCP Observability Sidecar
 * Sends standard MCP JSON-RPC requests
 */

const url = process.env.URL || 'http://localhost:4000';
const concurrent = Number(process.env.CONCURRENCY || 20);
const total = Number(process.env.TOTAL || 200);

// MCP method mix for realistic load
const methods = [
  { method: 'initialize', weight: 0.05 },
  { method: 'tools/list', weight: 0.30 },
  { method: 'tools/call', weight: 0.40 },
  { method: 'resources/list', weight: 0.15 },
  { method: 'resources/read', weight: 0.10 },
];

function randomMethod(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const { method, weight } of methods) {
    cumulative += weight;
    if (rand < cumulative) return method;
  }
  return 'tools/list';
}

function createRequest(i: number) {
  const method = randomMethod();
  const request: any = {
    jsonrpc: '2.0',
    id: i,
    method,
  };
  
  // Add params based on method
  if (method === 'initialize') {
    request.params = {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'loadtest', version: '1.0.0' },
    };
  } else if (method === 'tools/call') {
    request.params = {
      name: 'get-weather',
      arguments: { location: 'San Francisco, CA' },
    };
  } else if (method === 'resources/read') {
    request.params = {
      uri: 'weather://current',
    };
  }
  
  return request;
}

async function sendRequest(i: number): Promise<void> {
  const body = createRequest(i);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  
  await res.json();
}

(async () => {
  console.log(`
🔥 MCP Load Test
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  URL:         ${url}
  Total:       ${total} requests
  Concurrency: ${concurrent}
  Methods:     ${methods.map(m => m.method).join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  
  const startTime = Date.now();
  let inFlight = 0;
  let done = 0;
  let i = 0;
  let err = 0;
  
  const next = async () => {
    if (i >= total) return;
    const idx = i++;
    inFlight++;
    
    try {
      await sendRequest(idx);
    } catch (e) {
      err++;
    } finally {
      inFlight--;
      done++;
      
      if (done % 20 === 0 || done === total) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rps = (done / (Date.now() - startTime) * 1000).toFixed(1);
        console.log(`  ${done}/${total} requests (${err} errors) | ${rps} req/s | ${elapsed}s elapsed`);
      }
      
      next();
    }
  };
  
  // Start concurrent requests
  for (let k = 0; k < concurrent; k++) {
    next();
  }
})();
