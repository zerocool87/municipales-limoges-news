import { RSS_FEEDS, blacklistedFeeds, feedFailures, ALTERNATIVE_FEEDS } from '../../../lib/news.js';

function checkAdminAuth(req){
  const token = process.env.ADMIN_TOKEN;
  if(!token) return true;
  const header = req.headers['x-admin-token'];
  return header === token;
}

export default async function handler(req, res){
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  res.status(200).json({ feeds: RSS_FEEDS, blacklisted: Array.from(blacklistedFeeds), failures: Object.fromEntries(feedFailures), alternatives: ALTERNATIVE_FEEDS });
}