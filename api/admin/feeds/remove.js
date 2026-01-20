import { RSS_FEEDS, feedFailures, blacklistedFeeds } from '../../../../lib/news.js';

function checkAdminAuth(req){
  const token = process.env.ADMIN_TOKEN;
  if(!token) return true;
  const header = req.headers['x-admin-token'];
  return header === token;
}

async function readJSON(req){
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => { try{ resolve(data ? JSON.parse(data) : {}); }catch(e){ reject(e); } });
    req.on('error', reject);
  });
}

export default async function handler(req, res){
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  if(req.method !== 'POST') return res.status(405).json({ error: 'method' });
  try{
    const body = await readJSON(req);
    const { url } = body || {};
    if(!url) return res.status(400).json({ error: 'url required' });
    const before = RSS_FEEDS.length;
    for(let i = RSS_FEEDS.length - 1; i >= 0; --i) if(RSS_FEEDS[i].url === url) RSS_FEEDS.splice(i,1);
    feedFailures.delete(url);
    blacklistedFeeds.delete(url);
    return res.status(200).json({ ok: true, removed: before - RSS_FEEDS.length });
  }catch(e){ return res.status(500).json({ ok:false, error: e.message || String(e) }); }
}