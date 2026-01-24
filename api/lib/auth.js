import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'municipales-limoges-2026-secret-key';

export function verifyJWT(req) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token;
  
  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = verifyJWT(req);
  if (!user) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return false;
  }
  return true;
}
