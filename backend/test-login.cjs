const BASE = 'http://localhost:5001/api/auth';

async function login(email, password) {
  try {
    const res = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  } catch (e) {
    return { status: 'NETWORK_ERROR', body: e.message };
  }
}

(async () => {
  const cases = [
    ['admin@ethiobridge.et', 'admin123', 'correct admin'],
    ['bole@ethiobridge.et', 'bole123', 'correct bole'],
    ['yeka@ethiobridge.et', 'yeka123', 'correct yeka'],
    ['lemmi@ethiobridge.et', 'lemmi123', 'correct lemmi'],
    ['woreda03@ethiobridge.et', 'woreda123', 'correct woreda'],
    ['admin@ethiobridge.et', 'WRONGPASS', 'wrong admin password'],
    ['nonexistent@ethiobridge.et', 'whatever', 'unknown user'],
  ];

  for (const [email, password, label] of cases) {
    const r = await login(email, password);
    const msg = r.body && typeof r.body === 'object' ? r.body.message : r.body;
    const role = r.body && typeof r.body === 'object' && r.body.user ? r.body.user.role : '-';
    console.log(`[${label}] status=${r.status} role=${role} msg=${msg}`);
  }
})();
