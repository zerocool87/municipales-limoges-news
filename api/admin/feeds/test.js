import { fetchAndParseFeed } from '../../../lib/news.js';
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
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ ok: false, error: 'url required' });
    }

    const items = await fetchAndParseFeed(url, 8);
    return res.status(200).json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}