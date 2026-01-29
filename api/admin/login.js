import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'municipales-limoges-2026-secret-key';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    return res.status(200).json({ ok: true, mode: 'open', token });
  }

  // Validate user/pass
  const { username, password } = req.body || {};
  console.log('[LOGIN] Received username:', username);

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    console.warn('[LOGIN] Authentication failed for user:', username);
    return res.status(401).json({ ok: false, error: 'invalid credentials' });
  }

  // Create JWT token
  const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '24h' });

  // Set cookie
  res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);

  console.log('[LOGIN] Authentication successful for user:', username);
  return res.status(200).json({ ok: true, token });
}
