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
    const { url, name } = req.body || {};
    if (!url) {
      return res.status(400).json({ ok: false, error: 'url required' });
    }

    if (RSS_FEEDS.some(f => f.url === url)) {
      return res.status(200).json({ ok: false, message: 'already exists' });
    }

    RSS_FEEDS.push({ url, name: name || 'manual' });
    feedFailures.set(url, 0);
    blacklistedFeeds.delete(url);
    return res.status(200).json({ ok: true, url });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
}
  }catch(e){ return res.status(500).json({ ok:false, error: e.message || String(e) }); }
}