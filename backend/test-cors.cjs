const BASE = 'http://localhost:5001/api';

async function testCors(origin) {
  // Preflight
  try {
    const pre = await fetch(`${BASE}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    console.log(`\n[${origin}] OPTIONS status=${pre.status}`);
    console.log(`  access-control-allow-origin: ${pre.headers.get('access-control-allow-origin')}`);
    console.log(`  access-control-allow-methods: ${pre.headers.get('access-control-allow-methods')}`);
    console.log(`  access-control-allow-headers: ${pre.headers.get('access-control-allow-headers')}`);
  } catch (e) {
    console.log(`\n[${origin}] OPTIONS NETWORK ERROR: ${e.message}`);
  }

  // Actual POST
  try {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ email: 'admin@ethiobridge.et', password: 'admin123' }),
    });
    console.log(`[${origin}] POST status=${res.status}`);
    console.log(`  access-control-allow-origin: ${res.headers.get('access-control-allow-origin')}`);
    const t = await res.text();
    console.log(`  body: ${t.slice(0, 200)}`);
  } catch (e) {
    console.log(`[${origin}] POST NETWORK ERROR: ${e.message}`);
  }
}

(async () => {
  await testCors('http://localhost:5173');
  await testCors('http://127.0.0.1:5173');
})();
