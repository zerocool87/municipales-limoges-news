import { RSS_FEEDS } from '../../../lib/news.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
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

  // Verify JWT authentication
  if (!requireAuth(req, res)) {
    return;
  }

  try {
    const { url, name } = req.body || {};
    if (!url) {
      return res.status(400).json({ ok: false, error: 'url required' });
    }

    let found = false;
    for (const f of RSS_FEEDS) {
      if (f.url === url) {
        f.name = name || f.name;
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({ ok: false, error: 'not found' });
    }

    res.status(200).json({ ok: true, url, name });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}