import { getMatches, isStrictMatch, fetchRssFeeds } from '../lib/news.js';
import fetch from 'node-fetch';

export default async function handler(req, res){
  try{
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const strict = url.searchParams.get('strict') === 'false' ? false : true;
    const debugReq = url.searchParams.get('debug') === 'true';
    let debugSamples = null;
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

    if (NEWSAPI_KEY){
      const q = encodeURIComponent('"municipales Limoges 2026" OR "élections municipales Limoges 2026" OR "municipales Limoges" OR "élections municipales Limoges" OR (Limoges AND (municipales OR élections OR mairie OR candidats OR 2026))');
      const from = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const urlApi = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=${limit}&language=fr&apiKey=${NEWSAPI_KEY}`;
      try{
        const r = await fetch(urlApi);
        const data = await r.json();
        if (data.status === 'ok' && (data.articles || []).length > 0){
          const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
          const articlesAll = (data.articles || []).map(a=>{
            const title = a.title; const description = a.description;
            const matches = getMatches((title || '') + ' ' + (description || ''));
            const primaryMatch = matches.length ? matches[0] : null;
            return { title, description, url: a.url, source: a.source?.name, publishedAt: a.publishedAt, matches, primaryMatch };
          }).filter(a => a.matches && a.matches.length > 0);

          const articles = articlesAll.filter(a => {
            if (!a.publishedAt) return false;
            const pd = new Date(a.publishedAt); if (isNaN(pd)) return false;
            if (pd < cutoff) return false;
            return !strict || isStrictMatch(a.matches, { source: a.source, url: a.url });
          }).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

          if (strict && articlesAll.length > 0 && articles.length === 0){
            debugSamples = articlesAll.slice(0,5).map(a=>({title:a.title,matches:a.matches}));
          }

          if (articles.length > 0) return res.status(200).json({ articles: articles.slice(0, limit), source: 'newsapi', strict, debug: debugReq ? { samples: debugSamples } : undefined });
        }
      } catch(e){ console.warn('NewsAPI fetch failed, falling back to RSS', e && e.message ? e.message : e); }
    }

    // RSS fallback
    try{
      const rssResult = await fetchRssFeeds(limit, debugReq);
      let articles = Array.isArray(rssResult) ? rssResult : rssResult.items;
      const reports = rssResult.reports || null;

      if (!articles || articles.length === 0) {
        return res.status(200).json({ articles: [], source: 'rss', strict, note: 'No RSS articles found', debug: debugReq ? { samples: debugSamples, feeds: reports } : undefined });
      }

      const beforeCount = articles.length;
      if (strict) articles = articles.filter(a => isStrictMatch(a.matches, { source: a.source, url: a.url }));
      const afterCount = articles.length;
      if (strict && beforeCount > 0 && afterCount === 0){
        const sample = (await fetchRssFeeds(limit, false)).slice(0,5).map(a=>({title:a.title,matches:a.matches}));
        debugSamples = sample;
      }

      if (!articles || articles.length === 0) return res.status(200).json({ articles: [], source: 'rss', strict, note: 'No matching RSS articles found (strict filter).', debug: debugReq ? { samples: debugSamples, feeds: reports } : undefined });
      return res.status(200).json({ articles: articles.slice(0, limit), source: 'rss', strict, debug: debugReq ? { feeds: reports } : undefined });
    } catch(err){
      console.error(err);
      return res.status(500).json({ articles: [], source: 'none', strict, error: 'Failed to fetch news (NewsAPI and RSS).' });
    }

  } catch(e){ console.error(e); return res.status(500).json({ error: 'internal' }); }
}