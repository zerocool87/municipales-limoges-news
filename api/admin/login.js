const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SESSION_SECRET || 'municipales-limoges-2026-secret-key';

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ADMIN_USER = process.env.ADMIN_USER || process.env.ADMIN_USERNAME;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;

  console.log('[LOGIN] Attempting login. User configured:', !!ADMIN_USER, 'Pass configured:', !!ADMIN_PASS);

  // If nothing is configured, keep it open for local/dev
  if (!ADMIN_USER && !ADMIN_PASS) {
    const token = jwt.sign({ user: 'dev', mode: 'open' }, JWT_SECRET, { expiresIn: '24h' });
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
    return res.status(200).json({ ok: true, token });
  }

  const { username, password } = req.body || {};

  console.log('[LOGIN] Received:', username, '/ pass length:', password?.length);

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Missing username or password' });
  }

  // Check credentials
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '24h' });
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax; Secure`);
    console.log('[LOGIN] Success for user:', username);
    return res.status(200).json({ ok: true, token });
  }

  console.log('[LOGIN] Failed - invalid credentials');
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
};
