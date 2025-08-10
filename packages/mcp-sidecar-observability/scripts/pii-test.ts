const url = process.env.URL || 'http://localhost:4000';
(async () => {
  const body = {
    id: 1,
    method: 'mcp/ask',
    params: { prompt: 'Email me at alice@example.com and include key=sk-123456' }
  };
  await fetch(url, { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body) });
  console.log('Sent PII probe. Inspect metrics/logs to confirm redaction.');
})();
