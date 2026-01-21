import { getMatches, fetchRssFeeds, readRemovedTags, normalizeTextSimple, isStrictMatch, normalizeText } from '../lib/news.js';
import fetch from 'node-fetch';

// Near-duplicate title deduplication helpers
function titleKey(title){ return (normalizeText(title||'')||'').replace(/[^a-z0-9]+/g,' ').trim(); }
function wordsOfTitle(t){ return (titleKey(t)||'').split(/\s+/).filter(Boolean); }
const preferredHosts = ['lepopulaire.fr','francebleu.fr','lamontagne.fr','actu.fr','france3','lepopulaire','francebleu','lamontagne'];
const candidateNames = ['damien maudet','maudet','émile roger lombertie','emile roger lombertie','lombertie','emile roger','yoann balestrat','balestrat','hervé beaudet','herve beaudet','beaudet'];

function findCandidatesInTitle(t){
  const s = (t || '').toLowerCase();
  return candidateNames.filter(c => s.includes(c));
}

function isSimilarTitle(a, b){
  // if titles mention different candidates, do not treat as similar
  const ca = findCandidatesInTitle(a.title);
  const cb = findCandidatesInTitle(b.title);
  if (ca.length > 0 && cb.length > 0){
    // if both mention candidates and they differ, consider distinct
    if (!ca.some(x => cb.includes(x))) return false;
  }

  const wa = new Set(wordsOfTitle(a.title || ''));
  const wb = new Set(wordsOfTitle(b.title || ''));
  if (wa.size === 0 || wb.size === 0) return false;
  const inter = [...wa].filter(w => wb.has(w)).length;
  const minLen = Math.min(wa.size, wb.size);
  return (inter / Math.max(1, minLen)) >= 0.6; // threshold: 60%
}

function preferArticle(arr){
  // score: preferred host -> +100, non-google url -> +50, more matches -> +20 each, longer description -> +1 per char, newer -> +timestamp score
  const scoreFor = (it) => {
    const hostScore = preferredHosts.some(h => (it.source||'').toLowerCase().includes(h)) ? 100 : 0;
    const nonGoogle = (it.url && !it.url.includes('news.google.com')) ? 50 : 0;
    const matchesScore = (it.matches || []).length * 20;
    const descLen = (it.description || '').length;
    const timeScore = it.publishedAt ? new Date(it.publishedAt).getTime() / 1e12 : 0;
    return hostScore + nonGoogle + matchesScore + descLen + timeScore;
  };
  return arr.slice().sort((a,b) => scoreFor(b) - scoreFor(a))[0];
}

function deduplicateSimilarTitles(articles){
  const deduped = [];
  const usedIdx = new Set();
  for (let i = 0; i < articles.length; i++){
    if (usedIdx.has(i)) continue;
    const a = articles[i];
    const group = [a];
    usedIdx.add(i);
    for (let j = i + 1; j < articles.length; j++){
      if (usedIdx.has(j)) continue;
      const b = articles[j];
      if (isSimilarTitle(a, b)) { group.push(b); usedIdx.add(j); }
    }
    const chosen = group.length > 1 ? preferArticle(group) : a;
    deduped.push(chosen);
  }
  return deduped;
}

export default async function handler(req, res){
  try{
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    // strict mode: require Limoges + election-related keyword (municipales/élection) by default
    // Also allow ?strict=true/false query param to override
    const strictParam = url.searchParams.get('strict');
    const strictEnv = process.env.STRICT_DEFAULT;
    const strict = strictParam !== null 
      ? strictParam === 'true' 
      : (strictEnv === undefined || strictEnv === '' ? true : strictEnv === 'true');
    const debugReq = url.searchParams.get('debug') === 'true';

    // RSS feeds are the PRIMARY source (better for local Limoges news)
    // NewsAPI is used as supplementary source to add more articles
    let allArticles = [];
    let sources = [];

    // 1. Always fetch RSS feeds first (primary source)
    try {
      const rssResult = await fetchRssFeeds(limit * 2, debugReq);
      let rssArticles = Array.isArray(rssResult) ? rssResult : rssResult.items || [];
      
      if (rssArticles.length > 0) {
        sources.push('rss');
        allArticles.push(...rssArticles);
      }
    } catch(e) { 
      console.warn('RSS fetch failed:', e && e.message ? e.message : e); 
    }

    // 2. Also fetch from NewsAPI if available (supplementary source)
    const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
    if (NEWSAPI_KEY) {
      try {
        const q = encodeURIComponent('"municipales Limoges 2026" OR "élections municipales Limoges 2026" OR "municipales Limoges" OR "élections municipales Limoges" OR (Limoges AND (municipales OR élections OR mairie OR candidats OR 2026))');
        const NEWSAPI_LOOKBACK_DAYS = parseInt(process.env.NEWSAPI_LOOKBACK_DAYS || '30', 10);
        const from = new Date(Date.now() - NEWSAPI_LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString().split('T')[0];
        const urlApi = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=${limit}&language=fr&apiKey=${NEWSAPI_KEY}`;
        
        const r = await fetch(urlApi);
        const data = await r.json();
        
        if (data.status === 'ok' && (data.articles || []).length > 0) {
          const newsapiArticles = (data.articles || []).map(a => {
            const title = a.title;
            const description = a.description;
            let matches = getMatches((title || '') + ' ' + (description || ''));
            const primaryMatch = matches.length ? matches[0] : null;
            return { 
              title, 
              description, 
              url: a.url, 
              source: a.source?.name || 'NewsAPI', 
              publishedAt: a.publishedAt, 
              matches, 
              primaryMatch 
            };
          }).filter(a => a.matches && a.matches.length > 0);

          if (newsapiArticles.length > 0) {
            sources.push('newsapi');
            allArticles.push(...newsapiArticles);
          }
        }
      } catch(e) { 
        console.warn('NewsAPI fetch failed:', e && e.message ? e.message : e); 
      }
    }

    // 3. Apply removed tags filter
    try {
      const removedArr = (await readRemovedTags()).map(r => normalizeTextSimple(r));
      allArticles.forEach(a => {
        if (a.matches) {
          a.matches = a.matches.filter(m => {
            const nm = normalizeTextSimple(m);
            return !removedArr.some(rn => nm.includes(rn) || rn.includes(nm));
          });
        }
      });
    } catch(e) { console.warn('removed tags filtering failed', e); }

    // 4. Filter by date (last 60 days)
    const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    allArticles = allArticles.filter(a => {
      if (!a.publishedAt) return true; // keep articles without date
      const pd = new Date(a.publishedAt);
      if (isNaN(pd)) return true;
      return pd >= cutoff;
    });

    // 5. Apply strict filtering (Limoges + election keywords) if requested
    if (strict) {
      allArticles = allArticles.filter(a => isStrictMatch(a.matches || [], { source: a.source, url: a.url }));
    }

    // 6a. Remove Google News wrappers when a direct source exists for the same title
    const grouped = new Map();
    for(const a of allArticles){
      const key = titleKey(a.title || '');
      const arr = grouped.get(key) || [];
      arr.push(a);
      grouped.set(key, arr);
    }
    const cleaned = [];
    for(const [k, arr] of grouped.entries()){
      if(arr.length === 1){ cleaned.push(arr[0]); continue; }
      // prefer an article that is not a Google wrapper and/or whose source matches preferred hosts
      let preferred = arr.find(x => x.url && !x.url.includes('news.google.com') && preferredHosts.some(h => (x.source||'').toLowerCase().includes(h)));
      if(!preferred) preferred = arr.find(x => x.url && !x.url.includes('news.google.com'));
      if(!preferred) preferred = arr[0];
      cleaned.push(preferred);
    }
    allArticles = cleaned;

    // 6b. Deduplicate near-duplicate titles across sources (Radio France vs France Bleu)
    allArticles = deduplicateSimilarTitles(allArticles);

    // 7. Deduplicate by URL
    const seen = new Set();
    allArticles = allArticles.filter(a => {
      if (!a.url) return true;
      const normalizedUrl = a.url.toLowerCase().replace(/\/$/, '');
      if (seen.has(normalizedUrl)) return false;
      seen.add(normalizedUrl);
      return true;
    });

    // 7. Sort by date (most recent first)
    allArticles.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
      return dateB - dateA;
    });

    // 8. Return results
    const finalArticles = allArticles.slice(0, limit);
    
    if (finalArticles.length === 0) {
      return res.status(200).json({ 
        articles: [], 
        source: sources.join('+') || 'none', 
        strict, 
        note: 'No matching articles found.' 
      });
    }

    return res.status(200).json({ 
      articles: finalArticles, 
      source: sources.join('+'), 
      strict,
      count: finalArticles.length,
      debug: debugReq ? { totalBeforeLimit: allArticles.length } : undefined
    });

  } catch(e) { 
    console.error(e); 
    return res.status(500).json({ error: 'internal' }); 
  }
}
