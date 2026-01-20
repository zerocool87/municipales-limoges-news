import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

// RSS feeds used as fallback (no API key required) — focus on French / regional sources
// Note: some local sites no longer expose stable RSS at the previous URLs; we include a Google News search RSS as a reliable fallback.
const RSS_FEEDS = [
    { url: 'https://www.lemonde.fr/rss/une.xml', name: 'Le Monde' },
    { url: 'https://www.francetvinfo.fr/titres.rss', name: 'France Info' },
  // Google News search RSS targeting Limoges municipales 2026 (reliable)
    { url: 'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Limoges municipal 2026)' },
    { url: 'https://france3-regions.francetvinfo.fr/nouvelle-aquitaine/rss', name: 'France 3 Nouvelle Aquitaine' },
    { url: 'https://www.francebleu.fr/rss/infos.xml', name: 'France Bleu' }

   
];

const parser = new Parser();
// In-memory blacklist for feeds that repeatedly fail (prevents log spam)
const blacklistedFeeds = new Set();
// Track failures per feed and only blacklist after several consecutive failures
const feedFailures = new Map();
const MAX_FEED_FAILURES = 3;
// Maximum article age in days (2 months ≈ 60 days)
const MAX_AGE_DAYS = 60; // articles older than this are ignored

// Alternative feeds to try when a feed is blacklisted (site-specific Google News searches)
const ALTERNATIVE_FEEDS = {
  'limoges.fr': [
    'https://news.google.com/rss/search?q=site:limoges.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr',
    'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr'
  ],
  'lamontagne.fr': [
    'https://news.google.com/rss/search?q=site:lamontagne.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr'
  ],
  'francebleu.fr': [
    'https://news.google.com/rss/search?q=site:francebleu.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr'
  ],
  'lepopulaire.fr': [
    'https://news.google.com/rss/search?q=site:lepopulaire.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr'
  ]
};

// Try to handle a failing feed: increment failures and, if threshold reached, attempt to add alternatives instead of only blacklisting
async function handleFeedFailure(url, name, reason){
  const count = (feedFailures.get(url) || 0) + 1;
  feedFailures.set(url, count);
  console.warn(`Failed to fetch feed ${url} ${reason ? reason : ''} (failure ${count}/${MAX_FEED_FAILURES})`);
  if (count < MAX_FEED_FAILURES) return;

  // threshold reached — look for alternatives
  try {
    const host = (new URL(url)).hostname.replace(/^www\./,'');
    // find alternatives by matching host keys
    const alts = [];
    for(const key of Object.keys(ALTERNATIVE_FEEDS)){
      if(host.includes(key)) alts.push(...ALTERNATIVE_FEEDS[key]);
    }

    if (alts.length > 0){
      let added = 0;
      for(const alt of alts){
        if (!RSS_FEEDS.some(f => f.url === alt) && !blacklistedFeeds.has(alt)){
          RSS_FEEDS.push({ url: alt, name: `Alternative for ${name || host}` });
          feedFailures.set(alt, 0);
          added++;
          console.log(`Added alternative feed for ${host}: ${alt}`);
        }
      }
      if (added > 0){
        console.log(`Replaced ${url} with ${added} alternative feed(s).`);
        // mark original as blacklisted to avoid further attempts
        blacklistedFeeds.add(url);
        return;
      }
    }

    // If no predefined alternatives, try a generic Google News search RSS for the host
    try {
      const genericAlt = `https://news.google.com/rss/search?q=site:${host}+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr`;
      if (!RSS_FEEDS.some(f => f.url === genericAlt) && !blacklistedFeeds.has(genericAlt)){
        RSS_FEEDS.push({ url: genericAlt, name: `Generic alternative for ${host}` });
        feedFailures.set(genericAlt, 0);
        console.log(`Added generic alternative feed for ${host}: ${genericAlt}`);
        blacklistedFeeds.add(url);
        return;
      }
    } catch(e){
      console.warn('Failed to add generic alternative for', host, e && e.message ? e.message : e);
    }

    // No alternatives or failed to add — blacklist original
    blacklistedFeeds.add(url);
    console.warn(`Blacklisting feed ${url} after ${count} failures.`);
  } catch (err) {
    console.warn('Error handling feed failure for', url, err && err.message ? err.message : err);
    blacklistedFeeds.add(url);
  }
}

// Keywords to identify articles about Limoges municipal elections (including 2026)
// Includes declared candidates to ensure their mentions are captured
const KEYWORDS = [
  'limoges','mairie','municipal','municipales','élection','election','élections','elections','candidat','candidats','2026',
  /* regional keywords */
  'limousin','haute vienne','haute-vienne','hautevienne','87',
  /* declared candidates */
  'damien maudet','maudet',
  'émile roger lombertie','emile roger lombertie','lombertie',
  'thierry miguel','miguel',
  'vincent léonie','vincent leonie','leonie'
];
function normalizeText(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

// Returns the list of matching keywords found in the provided text
function getMatches(text){
  const n = normalizeText(text);
  const found = [];
  for(const k of KEYWORDS){
    const nk = normalizeText(k);
    if(nk && n.includes(nk)) found.push(k);
  }
  // return unique list preserving order
  return [...new Set(found)];
}

// Strict match: require Limoges (text or source) and at least one declared candidate OR an election keyword (e.g. "municipal", "élection")
// This function accepts an optional context object { source, url, publishedAt } to use as evidence
function isStrictMatch(matches, context = {}){
  if(!matches || matches.length === 0) return false;
  const norm = matches.map(m => normalizeText(m));

  // check text matches
  let hasLimoges = norm.some(n => n.includes('limoges'));

  const candidateKeys = [
    'damien maudet','maudet',
    'émile roger lombertie','emile roger lombertie','lombertie','emile roger',
    'thierry miguel','miguel',
    'vincent léonie','vincent leonie','leonie'
  ];
  const hasCandidate = candidateKeys.some(c => norm.some(n => n.includes(normalizeText(c))));

  // election-related keywords (allow matches like "municipal", "municipales", "élection")
  const electionKeys = ['municipal','municipales','élection','election','élections','elections'];
  const hasElection = electionKeys.some(k => norm.some(n => n.includes(normalizeText(k))));

  // also consider source or url as evidence of Limoges/region
  const src = (context.source || '') || '';
  const url = (context.url || '') || '';
  const srcNorm = normalizeText(src + ' ' + url);
  const hasRegionInSource = srcNorm.includes('limoges') || srcNorm.includes('limousin') || srcNorm.includes('haute vienne') || srcNorm.includes('haute-vienne') || srcNorm.includes('87');
  if (hasRegionInSource) hasLimoges = true;

  // Require Limoges (or region in source) AND (either a candidate OR an election-related keyword)
  return hasLimoges && (hasCandidate || hasElection);
}

async function fetchRssFeeds(limit = 20) {
  const items = [];
  await Promise.all(RSS_FEEDS.map(async (f) => {
    if (blacklistedFeeds.has(f.url)) return; // skip known-broken feeds

    try {
      // Try fetching the feed ourselves so we can set browser-like headers that some sites require
      const resp = await fetch(f.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!resp.ok) {
        await handleFeedFailure(f.url, f.name, `Status code ${resp.status}`);
        return;
      }

      const xml = await resp.text();
      const feed = await parser.parseString(xml);

      const feedItems = (feed.items || []).map(it => ({
        title: it.title,
        description: it.contentSnippet || it.content || it.summary || '',
        url: it.link,
        source: f.name || feed.title || (new URL(f.url)).hostname,
        publishedAt: it.isoDate || it.pubDate || null
      }));

      // Filter items to those that mention Limoges/municipales and are recent enough
      const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000);
      const filtered = feedItems.map(it => {
        const text = (it.title || '') + ' ' + (it.description || '');
        const matches = getMatches(text);
        const primaryMatch = matches.length ? matches[0] : null;
        return Object.assign({}, it, { matches, primaryMatch });
      }).filter(it => {
        if (!it.publishedAt) return false;
        const pubDate = new Date(it.publishedAt);
        if (isNaN(pubDate)) return false;
        // ignore articles older than cutoff
        if (pubDate < cutoff) return false;
        return (it.matches && it.matches.length > 0);
      });

      items.push(...filtered);
    } catch (err) {
      await handleFeedFailure(f.url, f.name, err && err.message ? err.message : err);
    }
  }));

  const sorted = items
    .filter(i => i.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return sorted.slice(0, limit);
}

app.get('/api/news', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  // default: strict filtering is ON by request
  const strict = req.query.strict === 'false' ? false : true;
  let debugSamples = null;

  // Try NewsAPI if key is present
  if (NEWSAPI_KEY) {
    const q = encodeURIComponent('"municipales Limoges 2026" OR "élections municipales Limoges 2026" OR "municipales Limoges" OR "élections municipales Limoges" OR (Limoges AND (municipales OR élections OR mairie OR candidats OR 2026))');
    const from = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000).toISOString().split('T')[0]; // from ~2 months ago
    const url = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=${limit}&language=fr&apiKey=${NEWSAPI_KEY}`;

    try {
      const r = await fetch(url);
      const data = await r.json();
      if (data.status === 'ok' && (data.articles || []).length > 0) {
        const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000);
        const articlesAll = (data.articles || []).map(a => {
          const title = a.title;
          const description = a.description;
          const matches = getMatches((title || '') + ' ' + (description || ''));
          const primaryMatch = matches.length ? matches[0] : null;
          return {
            title,
            description,
            url: a.url,
            source: a.source?.name,
            publishedAt: a.publishedAt,
            matches,
            primaryMatch
          };
        }).filter(a => a.matches && a.matches.length > 0);

        const beforeCount = articlesAll.length;
        const articles = articlesAll.filter(a => {
          if (!a.publishedAt) return false;
          const pd = new Date(a.publishedAt);
          if (isNaN(pd)) return false;
          if (pd < cutoff) return false;
          return !strict || isStrictMatch(a.matches, { source: a.source, url: a.url });
        }).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        const afterCount = articles.length;
        if (strict && beforeCount > 0 && afterCount === 0) {
          console.warn('Strict filter removed all NewsAPI articles; sample matches from fetched articles:', articlesAll.slice(0,5).map(a=>({title:a.title,matches:a.matches}))); 
          debugSamples = articlesAll.slice(0,5).map(a=>({title:a.title,matches:a.matches}));
        }

        if (articles.length > 0) return res.json({ articles: articles.slice(0, limit), source: 'newsapi', strict, debug: req.query.debug === 'true' ? { samples: debugSamples } : undefined });
      }
      // If NewsAPI returned empty or not ok, fall back to RSS
      console.warn('NewsAPI returned no articles or non-ok status, falling back to RSS', data);
    } catch (err) {
      console.warn('NewsAPI fetch failed, falling back to RSS', err.message);
    }
  }

  // RSS fallback (no key required)
  try {
    let articles = await fetchRssFeeds(limit);
    if (!articles || articles.length === 0) return res.json({ articles: [], source: 'rss', strict, note: 'No RSS articles found' });
    const beforeCount = articles.length;
    if (strict) articles = articles.filter(a => isStrictMatch(a.matches, { source: a.source, url: a.url }));
    const afterCount = articles.length;
    if (strict && beforeCount > 0 && afterCount === 0) {
      const sample = (await fetchRssFeeds(limit)).slice(0,5).map(a=>({title:a.title,matches:a.matches}));
      console.warn('Strict filter removed all RSS articles; sample matches from fetched items:', sample); 
      debugSamples = sample;
    }
    if (!articles || articles.length === 0) return res.json({ articles: [], source: 'rss', strict, note: 'No matching RSS articles found (strict filter).', debug: req.query.debug === 'true' ? { samples: debugSamples } : undefined });
    return res.json({ articles: articles.slice(0, limit), source: 'rss', strict });
  } catch (err) {
    console.error(err);
    return res.json({ articles: [], source: 'none', strict, error: 'Failed to fetch news (NewsAPI and RSS).' });
  }
});

// --- Admin endpoints for feed management ---
function checkAdminAuth(req){
  const token = process.env.ADMIN_TOKEN;
  if(!token) return true; // no token configured => open for local/dev usage
  const header = req.headers['x-admin-token'];
  return header === token;
}

app.get('/admin/feeds', (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  res.json({
    feeds: RSS_FEEDS,
    blacklisted: Array.from(blacklistedFeeds),
    failures: Object.fromEntries(feedFailures),
    alternatives: ALTERNATIVE_FEEDS
  });
});

// Helper: fetch and parse a single feed and return the first N parsed items with matches
async function fetchAndParseFeed(url, limit = 5){
  try{
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    if(!resp.ok){
      await handleFeedFailure(url, null, `Status code ${resp.status}`);
      throw new Error('Fetch failed: ' + resp.status);
    }
    const xml = await resp.text();
    const feed = await parser.parseString(xml);
    const items = (feed.items || []).slice(0, limit).map(it => {
      const title = it.title;
      const description = it.contentSnippet || it.content || it.summary || '';
      const urlItem = it.link;
      const publishedAt = it.isoDate || it.pubDate || null;
      const matches = getMatches((title || '') + ' ' + (description || ''));
      return { title, description, url: urlItem, publishedAt, matches };
    });
    // reset failure counter for this feed on success
    feedFailures.set(url, 0);
    return items;
  } catch(err){
    // already handled via handleFeedFailure in many cases
    throw err;
  }
}

// Test a feed (fetch and return sample items)
app.post('/admin/feeds/test', async (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  try{
    const items = await fetchAndParseFeed(url, 8);
    return res.json({ ok: true, items });
  }catch(e){
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// Update feed metadata (e.g., name)
app.post('/admin/feeds/update', (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url, name } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  let found = false;
  for(const f of RSS_FEEDS){
    if(f.url === url){ f.name = name || f.name; found = true; break; }
  }
  if(!found) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, url, name });
});

app.post('/admin/feeds/add', (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url, name } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  if(RSS_FEEDS.some(f => f.url === url)) return res.json({ ok: false, message: 'already exists' });
  RSS_FEEDS.push({ url, name: name || 'manual' });
  feedFailures.set(url, 0);
  blacklistedFeeds.delete(url);
  res.json({ ok: true, url });
});

app.post('/admin/feeds/remove', (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  const before = RSS_FEEDS.length;
  for(let i = RSS_FEEDS.length - 1; i >= 0; --i) if(RSS_FEEDS[i].url === url) RSS_FEEDS.splice(i,1);
  feedFailures.delete(url);
  blacklistedFeeds.delete(url);
  res.json({ ok: true, removed: before - RSS_FEEDS.length });
});

app.post('/admin/feeds/unblacklist', (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  blacklistedFeeds.delete(url);
  feedFailures.set(url, 0);
  res.json({ ok: true, url });
});

// Serve admin UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve frontend (catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
