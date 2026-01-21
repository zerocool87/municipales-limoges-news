import fetch from 'node-fetch';
import { getMatches, normalizeTextSimple, isStrictMatch, fetchAndParseFeed } from '../lib/news.js';

function extractYoutubeId(url){
  if(!url) return null;
  // common patterns: v=ID, youtu.be/ID, /embed/ID
  const m1 = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
  if(m1) return m1[1];
  const m2 = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
  if(m2) return m2[1];
  const m3 = url.match(/embed\/([a-zA-Z0-9_-]{6,})/);
  if(m3) return m3[1];
  return null;
}

export default async function handler(req, res){
  try{
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50);
    const strictParam = url.searchParams.get('strict');
    const strictEnv = process.env.STRICT_DEFAULT;
    const strict = strictParam !== null ? strictParam === 'true' : (strictEnv === undefined || strictEnv === '' ? true : strictEnv === 'true');

    const YT_KEY = process.env.YOUTUBE_API_KEY;

    // Build a query similar to /api/news
    const q = '"municipales Limoges 2026" OR "élections municipales Limoges 2026" OR "municipales Limoges" OR "élections municipales Limoges" OR (Limoges AND (municipales OR élections OR mairie OR candidats OR 2026))';

    let videos = [];

    if (YT_KEY){
      // Use official YouTube Data API
      const publishedAfter = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();

      const params = new URLSearchParams({
        key: YT_KEY,
        part: 'snippet',
        q,
        type: 'video',
        maxResults: String(limit),
        publishedAfter
      });

      const apiUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
      const r = await fetch(apiUrl);
      const data = await r.json();
      if (data && Array.isArray(data.items)){
        videos = (data.items || []).map(it => {
          const id = it.id && it.id.videoId ? it.id.videoId : null;
          const sn = it.snippet || {};
          const title = sn.title || '';
          const description = sn.description || '';
          const urlVideo = id ? `https://www.youtube.com/watch?v=${id}` : (sn.channelId ? `https://www.youtube.com/channel/${sn.channelId}` : '');
          const thumbnail = (sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.default || sn.thumbnails.high)) ? (sn.thumbnails.medium || sn.thumbnails.default || sn.thumbnails.high).url : null;
          const publishedAt = sn.publishedAt || null;
          const matches = getMatches((title || '') + ' ' + (description || ''));
          const primaryMatch = matches.length ? matches[0] : null;
          return { title, description, url: urlVideo, source: 'YouTube', publishedAt, thumbnail, matches, primaryMatch };
        }).filter(v => v.title && v.url);
      }
    } else {
      // Fallback: use Google News RSS searches to find YouTube links
      const searches = [
        'https://news.google.com/rss/search?q=site:youtube.com+("municipales+Limoges+2026"+OR+"élections+municipales+Limoges+2026"+OR+"municipales+Limoges")&hl=fr&gl=FR&ceid=FR:fr',
        'https://news.google.com/rss/search?q=("municipales+Limoges+2026"+OR+"élections+municipales+Limoges+2026")+youtube&hl=fr&gl=FR&ceid=FR:fr'
      ];

      const items = [];
      for(const s of searches){
        try{
          const res = await fetchAndParseFeed(s, limit);
          if(Array.isArray(res) && res.length) items.push(...res);
          else if(res && Array.isArray(res.items)) items.push(...res.items);
        } catch(e){ console.warn('rss fallback failed for', s, e && e.message ? e.message : e); }
      }

      videos = (items || []).map(it => {
        const title = it.title || '';
        const description = it.description || '';
        const urlVideo = it.url || '';
        const id = extractYoutubeId(urlVideo) || (description && (description.match(/[?&]v=([a-zA-Z0-9_-]{6,})/) || [])[1]);
        const thumbnail = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
        const publishedAt = it.publishedAt || null;
        const matches = getMatches((title || '') + ' ' + (description || ''));
        const primaryMatch = matches.length ? matches[0] : null;
        return { title, description, url: urlVideo, source: 'YouTube (rss)', publishedAt, thumbnail, matches, primaryMatch };
      }).filter(v => v.title && v.url);
    }

    // Apply strict filtering if requested
    let final = videos;
    if (strict) {
      final = final.filter(v => isStrictMatch(v.matches || [], { source: v.source, url: v.url }));
    }

    // Deduplicate by url
    const seen = new Set();
    final = final.filter(v => {
      if (!v.url) return false;
      const n = v.url.toLowerCase().replace(/\/$/, '');
      if (seen.has(n)) return false;
      seen.add(n);
      return true;
    });

    // Sort by date desc
    final.sort((a,b)=>{
      const da = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
      const db = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
      return db - da;
    });

    return res.status(200).json({ videos: final.slice(0, limit), source: YT_KEY ? 'youtube' : 'google-rss', count: final.length });
  } catch (err){
    console.error('videos api error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'internal' });
  }
}
