import { RSS_FEEDS, feedFailures, blacklistedFeeds } from '../../../lib/news.js';
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

    const before = RSS_FEEDS.length;
    for (let i = RSS_FEEDS.length - 1; i >= 0; --i) {
      if (RSS_FEEDS[i].url === url) {
        RSS_FEEDS.splice(i, 1);
      }
    }
    feedFailures.delete(url);
    blacklistedFeeds.delete(url);
    return res.status(200).json({ ok: true, removed: before - RSS_FEEDS.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}