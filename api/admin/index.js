import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyJWT } from '../lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminPath = path.join(__dirname, '../../public/admin.html');

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Check JWT authentication for security
    const user = verifyJWT(req);
    if (!user) {
      // Redirect to login if not authenticated
      res.setHeader('Location', '/login');
      return res.status(302).end();
    }

    try {
      const html = fs.readFileSync(adminPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch (e) {
      return res.status(404).json({ ok: false, error: 'admin.html not found' });
    }
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
