import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import fs from 'fs/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
// Optional NewsAPI caching: set NEWSAPI_CACHE=true to enable (30 min default)
const NEWSAPI_CACHE = (process.env.NEWSAPI_CACHE || 'false') === 'true';
const NEWSAPI_CACHE_TTL = parseInt(process.env.NEWSAPI_CACHE_TTL || '30', 10); // minutes
let newsApiCache = { articles: null, timestamp: 0 };

// RSS feeds used as fallback (no API key required) — focus on French / regional sources
// Note: some local sites no longer expose stable RSS at the previous URLs; we include a Google News search RSS as a reliable fallback.
const RSS_FEEDS = [
  // Google News search RSS targeting Limoges municipales 2026 (reliable)
    { url: 'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Limoges municipales 2026)' },
    { url: 'https://www.francebleu.fr/rss/infos.xml', name: 'France Bleu' },
    
    // Local and regional sources with strong Limoges coverage
    { url: 'https://news.google.com/rss/search?q=site:lepopulaire.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Le Populaire - Limoges)' },
    { url: 'https://news.google.com/rss/search?q=site:lepopulaire.fr+Haute-Vienne+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Le Populaire - Haute-Vienne)' },
    { url: 'https://news.google.com/rss/search?q=site:lamontagne.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (La Montagne - Limoges)' },
    { url: 'https://news.google.com/rss/search?q=site:actu.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Actu.fr - Limoges)' },

    // Local political / institutional feeds
    { url: 'https://87.pcf.fr/rss.xml', name: 'PCF 87 (Parti Communiste Français)' },
    { url: 'https://limousin.eelv.fr/feed/', name: 'EELV Limousin' },
    { url: 'http://republicains87.fr/feed/', name: 'Les Républicains 87 (Fédération)' },
    { url: 'https://www.haute-vienne.fr/rss.xml', name: 'Conseil Départemental Haute-Vienne' },

    // Official Limoges city website (replaced by Google News site search to avoid 403/404)
    { url: 'https://news.google.com/rss/search?q=site:limoges.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Ville de Limoges)' },
    
    // More specific regional / department feeds
    { url: 'https://www.francebleu.fr/rss/infos/limousin.xml', name: 'France Bleu Limousin' },

    // Google News searches for specific electoral coverage
    { url: 'https://news.google.com/rss/search?q=élections+municipales+Limoges+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (élections municipales)' },
    { url: 'https://news.google.com/rss/search?q=municipales+Limoges+candidats&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (candidats Limoges)' }
];

const parser = new Parser();
// In-memory blacklist for feeds that repeatedly fail (prevents log spam)
const blacklistedFeeds = new Set();
// Track failures per feed and only blacklist after several consecutive failures
const feedFailures = new Map();
const MAX_FEED_FAILURES = 3;
// Maximum article age in days (1 month ≈ 30 days)
const MAX_AGE_DAYS = 30; // articles older than this are ignored

// --- Persistent storage for globally removed tags (file-based fallback)
const DATA_DIR = path.join(__dirname, 'data');
const REMOVED_TAGS_FILE = path.join(DATA_DIR, 'removedTags.json');

async function ensureDataDir(){
  try{ await fs.mkdir(DATA_DIR, { recursive: true }); }catch(e){ console.warn('Could not create data dir', e && e.message ? e.message : e); }
}

async function readRemovedTags(){
  try{
    await ensureDataDir();
    const raw = await fs.readFile(REMOVED_TAGS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    if(e.code === 'ENOENT') return [];
    console.warn('readRemovedTags failed', e && e.message ? e.message : e);
    return [];
  }
}

async function writeRemovedTags(arr){
  try{
    await ensureDataDir();
    await fs.writeFile(REMOVED_TAGS_FILE, JSON.stringify(Array.from(new Set(arr)), null, 2), 'utf8');
  }catch(e){ console.warn('writeRemovedTags failed', e && e.message ? e.message : e); }
}

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

// Sources / hosts to exclude from results (case-insensitive). Add domains or source names here to block.
const BLOCKED_SOURCES = ['france info'];
const BLOCKED_HOSTS = ['franceinfo.fr', 'francetvinfo.fr'];

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

// Keywords to identify articles about Limoges municipales elections (including 2026)
// Includes declared candidates to ensure their mentions are captured
const KEYWORDS = [
  // Core electoral terms
  'municipales','municipale','élection','election','élections','elections',
  'scrutin','vote','campagne','candidat','candidats','candidature',
  'investiture','tête de liste','défilé','meeting','débat',
  'sondage','résultats','bulletin','suffrage',
  'mairie','conseil municipal','dépôt candidature',
  
  // Location terms (strict: include Limoges, Haute-Vienne and variants)
  'limoges','haute-vienne','haute vienne','hautevienne','limousin',
  
  // Year
  '2026',
  
  // Declared candidates / political figures
  'damien maudet','maudet',
  'émile roger lombertie','emile roger lombertie','lombertie','emile roger',
  'guillaume guérin','guillaume guerin','guerin',
  'thierry miguel','miguel',
  'vincent léonie','vincent leonie','leonie',
  
  // Topics specific to elections
  'programme élection','enjeux élection','campagne municipale','coalition',
  'belle vie','renaissance','renaissance citoyenne'
];
function normalizeText(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function normalizeTextSimple(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

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

// Strict filter: require at least one electoral keyword AND one haute-vienne keyword
// (removed temporary haute-vienne-only strict filter)

// Strict match: require Limoges (text or source) and at least one declared candidate OR an election keyword (e.g. "municipales", "élection")
// This function accepts an optional context object { source, url, publishedAt } to use as evidence
function isStrictMatch(matches, context = {}){
  if(!matches || matches.length === 0) return false;
  const norm = matches.map(m => normalizeText(m));

  // check text matches
  let hasLimoges = norm.some(n => n.includes('limoges'));

  const candidateKeys = [
    'damien maudet','maudet',
    'émile roger lombertie','emile roger lombertie','lombertie','emile roger',
    'guillaume guérin','guillaume guerin','guerin',
    'thierry miguel','miguel',
    'vincent léonie','vincent leonie','leonie'
  ];
  const hasCandidate = candidateKeys.some(c => norm.some(n => n.includes(normalizeText(c))));

  // election-related keywords (allow matches like "municipales", "élection")
  const electionKeys = ['municipales','municipale','élection municipale','élection','election','élections','elections','scrutin','vote'];
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

async function fetchRssFeeds(limit = 20, maxAgeHours = MAX_AGE_DAYS * 24) {
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
      const cutoff = new Date(Date.now() - (maxAgeHours || MAX_AGE_DAYS * 24) * 3600 * 1000);

      // read global removed tags once for this fetch (normalize + substring-aware). Always include server-default removals like 'municipal'
      const fileRemoved = (await readRemovedTags()).map(r => normalizeTextSimple(r));
      const removedSet = new Set([...fileRemoved, 'municipal']);

      const filtered = feedItems.map(it => {
        const text = (it.title || '') + ' ' + (it.description || '');
        let matches = getMatches(text);
        matches = matches.filter(m => {
          const nm = normalizeTextSimple(m);
          // remove match if it contains or is contained by any removed token
          return ![...removedSet].some(rn => nm.includes(rn) || rn.includes(nm));
        });
        // also sanitize source and description of removed tokens for cleanliness
        const sanitizedSource = (it.source || '').replace(/\bmunicipal\w*\b/gi, '').replace(/\s+/g,' ').trim();
        const primaryMatch = matches.length ? matches[0] : null;
        return Object.assign({}, it, { matches, primaryMatch, source: sanitizedSource });
      }).filter(it => {
        if (!it.publishedAt) return false;
        const pubDate = new Date(it.publishedAt);
        if (isNaN(pubDate)) return false;
        // ignore articles older than cutoff
        if (pubDate < cutoff) return false;
        // require a strict Limoges-municipales match for RSS items to reduce false positives
        return (it.matches && it.matches.length > 0 && isStrictMatch(it.matches, { source: it.source, url: it.url, publishedAt: it.publishedAt }));
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
  const limit = Math.min(parseInt(req.query.limit) || 50, 300);
  // We'll apply a strict Limoges-municipales filter server-side when requested
  const strict = req.query.strict === 'true' ? true : false;
  // allow requesting a custom recency window in hours (e.g., ?hours=24)
  const maxAgeHours = req.query.hours ? Math.max(1, parseInt(req.query.hours, 10) || 24) : MAX_AGE_DAYS * 24; 
  let debugSamples = null;
  let newsApiArticles = [];
  let newsApiDebugObj = undefined;

  // Try NewsAPI if key is present
  if (NEWSAPI_KEY) {
    // Require "Limoges" in NewsAPI queries to avoid catching national articles that do not mention the city
    const q = encodeURIComponent('(Limoges) AND (municipales OR "élections municipales" OR mairie OR candidats OR 2026)');
    // Cap NewsAPI lookback to server limit to avoid 'parameterInvalid' errors (e.g., allowed = MAX_AGE_DAYS)
    const allowedHoursForNewsApi = MAX_AGE_DAYS * 24; // server-enforced cap
    let usedHoursForNewsApi = maxAgeHours;
    let newsApiCapped = false;
    if (maxAgeHours > allowedHoursForNewsApi) { usedHoursForNewsApi = allowedHoursForNewsApi; newsApiCapped = true; }

    try {
      let data;
      const now = Date.now();
      if (NEWSAPI_CACHE && newsApiCache.articles && (now - newsApiCache.timestamp < NEWSAPI_CACHE_TTL * 60 * 1000)) {
        console.log('Serving NewsAPI from cache');
        data = { status: 'ok', articles: newsApiCache.articles };
      } else {
        const from = new Date(now - usedHoursForNewsApi * 3600 * 1000).toISOString().split('T')[0];
        const url = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=100&language=fr&apiKey=${NEWSAPI_KEY}`;
        const r = await fetch(url);
        data = await r.json();
        if (NEWSAPI_CACHE && data && data.status === 'ok') {
          newsApiCache = { articles: data.articles, timestamp: now };
        }
      }

      if (data.status === 'ok' && (data.articles || []).length > 0) {
        const cutoff = new Date(Date.now() - (maxAgeHours || MAX_AGE_DAYS * 24) * 3600 * 1000);
        // Support multiple pages if user requests more than 100 items
        const maxPages = 3; // limit pages to avoid excessive NewsAPI usage
        const pages = Math.min(Math.ceil(limit / 100), maxPages);
        let collected = (data.articles || []).slice();
        // fetch additional pages if needed
        for(let p = 2; p <= pages; p++){
          try{
            const from = new Date(Date.now() - usedHoursForNewsApi * 3600 * 1000).toISOString().split('T')[0];
            const pageUrl = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=100&page=${p}&language=fr&apiKey=${NEWSAPI_KEY}`;
            const rr = await fetch(pageUrl);
            const extra = await rr.json();
            if(extra && extra.status === 'ok' && extra.articles && extra.articles.length) collected.push(...extra.articles);
          }catch(e){ console.warn('additional NewsAPI page failed', e && e.message ? e.message : e); break; }
        }

        const articlesAll = collected.map(a => {
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
        }).filter(a => {
          // Require strict match AND explicit regional evidence in the article (title/description/url/source)
          const strictOk = isStrictMatch(a.matches, { source: a.source, url: a.url });
          const evidence = ((a.title || '') + ' ' + (a.description || '') + ' ' + (a.url || '') + ' ' + (a.source || '')).toLowerCase();
          const hasRegion = /limoges|limousin|haute[- ]?vienne|\b87\b/i.test(evidence);
          return strictOk && hasRegion;
        });

        const beforeCount = articlesAll.length;
        // In non-strict mode we only filter by the cutoff date; keep all matched articles
        const articles = articlesAll.filter(a => {
          if (!a.publishedAt) return false;
          const pd = new Date(a.publishedAt);
          if (isNaN(pd)) return false;
          if (pd < cutoff) return false;
          return true;
        }).sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        const afterCount = articles.length; 

        if (articles.length > 0) {
          // apply server-side removed tags (including default 'municipal') to NewsAPI matches and sources
          const fileRemoved = (await readRemovedTags()).map(r => normalizeTextSimple(r));
          const removedSet = new Set([...fileRemoved, 'municipal'].map(r => normalizeTextSimple(r)));
          const sanitized = articles.slice(0, limit).map(a => {
            let matches = (a.matches || []).filter(m => {
              const nm = normalizeTextSimple(m);
              return ![...removedSet].some(rn => nm.includes(rn) || rn.includes(nm));
            });
            const primaryMatch = matches.length ? matches[0] : null;
            let source = a.source || '';
            try{
              // remove any removed tokens from source for cleanliness
              for(const tok of removedSet){
                if(!tok) continue;
                const re = new RegExp('\\b' + tok.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&') + '\\w*\\b','gi');
                source = source.replace(re, '');
              }
              source = (source || '').replace(/\s+/g,' ').trim();
            }catch(e){}
            return Object.assign({}, a, { matches, primaryMatch, source });
          });
          newsApiArticles = sanitized;
          newsApiDebugObj = req.query.debug === 'true' ? { samples: debugSamples, newsApiCapped: !!newsApiCapped, requestedHours: maxAgeHours, usedHoursForNewsApi } : undefined;
        }
      }
      // If NewsAPI returned empty or not ok, fall back to RSS
      console.warn('NewsAPI returned no articles or non-ok status, falling back to RSS', data);
    } catch (err) {
      console.warn('NewsAPI fetch failed, falling back to RSS', err.message);
    }
  }
  // RSS fallback (no key required)
  try {
    let articles = await fetchRssFeeds(limit, maxAgeHours);
    if (!articles || articles.length === 0) return res.json({ articles: [], source: 'rss', strict, note: 'No RSS articles found' });

    // Apply strict Limoges-municipales filter server-side
    const filteredRss = articles.filter(a => {
      if(!isStrictMatch(a.matches, { source: a.source, url: a.url })) return false;
      const s = (a.source || '').toLowerCase();
      const u = (a.url || '').toLowerCase();
      for(const b of BLOCKED_SOURCES) if(s.includes(b)) return false;
      for(const h of BLOCKED_HOSTS) if(u.includes(h)) return false;
      return true;
    });

    if (!filteredRss || filteredRss.length === 0) return res.json({ articles: [], source: 'rss', strict, note: 'No matching RSS articles found.', debug: req.query.debug === 'true' ? { samples: debugSamples } : undefined });

    const rssArticles = filteredRss;

    // Merge NewsAPI (if any) + RSS, deduplicating by URL (fallback key: title+source)
    const seen = new Set();
    const combined = [];
    function keyFor(a){
      if(a.url) return a.url.split('#')[0];
      return `${(a.title||'').slice(0,140)}|${(a.source||'').slice(0,80)}`;
    }

    // add NewsAPI items first
    for(const a of newsApiArticles){
      if (combined.length >= limit) break;
      const k = keyFor(a);
      if(seen.has(k)) continue;
      seen.add(k);
      combined.push(a);
    }

    // then fill with RSS items
    for(const a of rssArticles){
      if (combined.length >= limit) break;
      const k = keyFor(a);
      if(seen.has(k)) continue;
      seen.add(k);
      combined.push(a);
    }

    // Final sort: most recent first (descending)
    combined.sort((a,b)=>{
      const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return tb - ta;
    });

    // Prefer results that explicitly mention the region (Limoges / Haute-Vienne / 87)
    // This behaviour can be toggled with the PREFER_REGION environment variable (true/false).
    const PREFER_REGION = (process.env.PREFER_REGION || 'true') === 'true';
    if (PREFER_REGION) {
      const regionRegex = /limoges|limousin|haute[- ]?vienne|\b87\b/i;
      const combinedRegional = combined.filter(a => regionRegex.test(((a.title||'') + ' ' + (a.description||'') + ' ' + (a.source||'') + ' ' + (a.url||'')).toLowerCase()));
      if (combinedRegional && combinedRegional.length) combined = combinedRegional;
    }

    const source = (newsApiArticles.length && rssArticles.length) ? 'combined' : (newsApiArticles.length ? 'newsapi' : 'rss');
    const debugObj = req.query.debug === 'true' ? Object.assign({}, newsApiDebugObj || {}, { rssCount: rssArticles.length || 0, newsCount: newsApiArticles.length || 0 }) : undefined;
    return res.json({ articles: combined.slice(0, limit), source, strict, debug: debugObj });
  } catch (err) {
    console.error(err);
    return res.json({ articles: [], source: 'none', strict, error: 'Failed to fetch news (NewsAPI and RSS).' });
  }
});

// --- Admin endpoints for feed management ---

// --- Global filters persistence API ---
app.get('/api/filters', async (req, res) => {
  try{
    const removed = await readRemovedTags();
    return res.json({ removed });
  }catch(e){
    console.error('GET /api/filters error', e && e.message ? e.message : e);
    return res.status(500).json({ removed: [] });
  }
});

app.post('/api/filters', async (req, res) => {
  try{
    const { action, tag } = req.body || {};
    const normalized = (tag || '').toString();
    const current = new Set(await readRemovedTags());

    if(action === 'add'){
      if(normalized) current.add(normalized);
      await writeRemovedTags(Array.from(current));
      return res.json({ ok: true, removed: Array.from(current) });
    }
    if(action === 'remove'){
      if(normalized){ current.delete(normalized); current.delete(normalized.toLowerCase()); }
      await writeRemovedTags(Array.from(current));
      return res.json({ ok: true, removed: Array.from(current) });
    }
    if(action === 'clear'){
      await writeRemovedTags([]);
      return res.json({ ok: true, removed: [] });
    }
    return res.status(400).json({ ok: false, error: 'invalid action' });
  }catch(e){ console.error('POST /api/filters error', e && e.message ? e.message : e); return res.status(500).json({ ok: false }); }
});
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
    const fileRemoved = (await readRemovedTags()).map(r => normalizeTextSimple(r));
    const removedSet = new Set([...fileRemoved, 'municipal'].map(r => normalizeTextSimple(r)));

    const items = (feed.items || []).slice(0, limit).map(it => {
      const title = it.title;
      const description = it.contentSnippet || it.content || it.summary || '';
      const urlItem = it.link;
      const publishedAt = it.isoDate || it.pubDate || null;
      let matches = getMatches((title || '') + ' ' + (description || ''));
      // filter matches against removed tokens
      matches = matches.filter(m => {
        const nm = normalizeTextSimple(m);
        return ![...removedSet].some(rn => nm.includes(rn) || rn.includes(nm));
      });
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
