const url = process.env.URL || 'http://localhost:4000';
const concurrent = Number(process.env.CONCURRENCY || 20);
const total = Number(process.env.TOTAL || 200);

async function one(i: number) {
  const body = {
    id: i,
    method: 'mcp/ask',
    params: { prompt: `Say hello #${i}` }
  };
  const res = await fetch(url, { method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  await res.json();
}

(async () => {
  let inFlight = 0, done = 0, i = 0, err = 0;
  const next = async () => {
    if (i >= total) return;
    const idx = i++;
    inFlight++;
    try { await one(idx); } catch { err++; }
    finally {
      inFlight--; done++;
      if (done % 20 === 0) console.log({ done, inFlight, err });
      next();
    }
  };
  for (let k = 0; k < concurrent; k++) next();
})();
