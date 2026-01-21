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
  'isle','feytiat','le palais sur vienne','le palais-sur-vienne',
  
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

  // also consider source or url as evidence of region (include town names)
  const src = (context.source || '') || '';
  const url = (context.url || '') || '';
  const srcNorm = normalizeText(src + ' ' + url);
  const townKeys = ['saint junien','saint-junien','panazol','couzeix','malemort','condat-sur-vienne','isle','feytiat','le palais sur vienne','le palais-sur-vienne'];
  const hasRegionInSource = srcNorm.includes('limoges') || srcNorm.includes('limousin') || srcNorm.includes('haute vienne') || srcNorm.includes('haute-vienne') || srcNorm.includes('87') || townKeys.some(t => srcNorm.includes(t));
  if (hasRegionInSource) hasLimoges = true;

  // also consider matches containing town names as region evidence
  if (!hasLimoges){
    if (townKeys.some(t => norm.some(n => n.includes(normalizeText(t))))) hasLimoges = true;
  }

  // Require Limoges (or region in source) AND (either a candidate OR an election-related keyword)
  return hasLimoges && (hasCandidate || hasElection);
}

// Delegate RSS fetching to shared implementation in lib/news.js
async function fetchRssFeeds(limit = 20, debug = false) {
  // lib.fetchRssFeeds(limit, debug) returns an array when debug=false or { items, reports } when debug=true
  const lib = await import('./lib/news.js');
  return await lib.fetchRssFeeds(limit, debug);
}

app.get('/api/news', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 200);
  // strict mode: require Limoges + election-related keyword (municipales/élection) by default
  // Also allow ?strict=true/false query param to override
  const strictParam = req.query.strict;
  const strictEnv = process.env.STRICT_DEFAULT;
  const strict = strictParam !== undefined 
    ? strictParam === 'true' 
    : (strictEnv === undefined || strictEnv === '' ? true : strictEnv === 'true');
  const debugReq = req.query.debug === 'true';

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

  // 6. Remove Google News wrappers when a direct source exists for the same title
  function titleKey(title){ return (normalizeText(title||'')||'').replace(/[^a-z0-9]+/g,' ').trim(); }
  const preferredHosts = ['lepopulaire.fr','francebleu.fr','lamontagne.fr','actu.fr','france3','lepopulaire','francebleu','lamontagne'];
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

  // 6b. Deduplicate near-duplicate titles across sources (e.g., Radio France vs France Bleu)
  function wordsOfTitle(t){ return (titleKey(t)||'').split(/\s+/).filter(Boolean); }
  function isSimilarTitle(a, b){
    // if titles mention different candidates, do not treat as similar
    const candidateNames = ['damien maudet','maudet','émile roger lombertie','emile roger lombertie','lombertie','emile roger','yoann balestrat','balestrat','hervé beaudet','herve beaudet','beaudet'];
    function findCandidatesInTitle(t){
      const s = (t || '').toLowerCase();
      return candidateNames.filter(c => s.includes(c));
    }
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

  const deduped = [];
  const usedIdx = new Set();
  for (let i = 0; i < allArticles.length; i++){
    if (usedIdx.has(i)) continue;
    const a = allArticles[i];
    const group = [a];
    usedIdx.add(i);
    for (let j = i + 1; j < allArticles.length; j++){
      if (usedIdx.has(j)) continue;
      const b = allArticles[j];
      if (isSimilarTitle(a, b)) { group.push(b); usedIdx.add(j); }
    }
    const chosen = group.length > 1 ? preferArticle(group) : a;
    deduped.push(chosen);
  }
  allArticles = deduped;

  // 7. Deduplicate by exact URL to remove strict duplicates
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
    return res.json({ 
      articles: [], 
      source: sources.join('+') || 'none', 
      strict, 
      note: 'No matching articles found.' 
    });
  }

  return res.json({ 
    articles: finalArticles, 
    source: sources.join('+'), 
    strict,
    count: finalArticles.length,
    debug: debugReq ? { totalBeforeLimit: allArticles.length } : undefined
  });
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
