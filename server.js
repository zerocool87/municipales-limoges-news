import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import { RSS_FEEDS, ALTERNATIVE_FEEDS as LIB_ALTERNATIVE_FEEDS, getMatches, isStrictMatch, normalizeTextSimple } from './lib/news.js';
import { 
  deduplicateSimilarTitles, 
  deduplicateByUrl, 
  sortByDate, 
  removeGoogleWrappers, 
  titleKey,
  PREFERRED_HOSTS 
} from './lib/deduplication.js';
import { fetchWithTimeout, parseJson } from './lib/fetch-utils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');

const app = express();

// CORS configuration - allow same-origin and credentials
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from same origin or from vercel domains
    if (!origin || 
        origin === 'http://localhost:3000' ||
        origin === 'http://localhost' ||
        origin.includes('vercel.app') ||
        origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now (can be restricted)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT verification middleware
const JWT_SECRET = process.env.SESSION_SECRET || 'municipales-limoges-2026-secret-key';

function verifyJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token;
  
  if (!token) {
    return res.status(401).json({ ok: false, error: 'no token' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn('[JWT] Invalid token:', err.message);
    return res.status(401).json({ ok: false, error: 'invalid token' });
  }
}

app.use(express.static(PUBLIC_DIR));

// Handle admin login with JWT auth
app.post('/admin/login', (req, res) => {
  const ADMIN_USER = process.env.ADMIN_USER || process.env.ADMIN_USERNAME;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;

  console.log('[LOGIN] Attempting login. User configured:', !!ADMIN_USER, 'Pass configured:', !!ADMIN_PASS);

  // If nothing is configured, keep it open for local/dev
  if(!ADMIN_USER && !ADMIN_PASS){
    const token = jwt.sign({ user: 'dev', mode: 'open' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.json({ ok: true, mode: 'open', token });
  }

  // Validate user/pass
  const { username, password } = req.body || {};
  console.log('[LOGIN] Received username:', username);
  
  if(username !== ADMIN_USER || password !== ADMIN_PASS){
    console.warn('[LOGIN] Authentication failed for user:', username);
    return res.status(401).json({ ok: false, error: 'invalid credentials' });
  }

  // Create JWT token
  const token = jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '24h' });
  
  // Set both header and cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });
  
  console.log('[LOGIN] Authentication successful for user:', username);
  return res.json({ ok: true, token });
});

// Logout endpoint (client-side just removes token)
app.post('/admin/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ ok: true });
});

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_ENABLED = (process.env.NEWSAPI_ENABLED !== 'false') && NEWSAPI_KEY; // Disable with NEWSAPI_ENABLED=false
// Optional NewsAPI caching: set NEWSAPI_CACHE=true to enable (30 min default)
const NEWSAPI_CACHE = (process.env.NEWSAPI_CACHE || 'false') === 'true';
const NEWSAPI_CACHE_TTL = parseInt(process.env.NEWSAPI_CACHE_TTL || '30', 10); // minutes
let newsApiCache = { articles: null, timestamp: 0 };

console.log('[INFO] NEWSAPI_KEY loaded:', NEWSAPI_KEY ? 'YES' : 'NO');
console.log('[INFO] NEWSAPI enabled:', NEWSAPI_ENABLED ? 'YES' : 'NO');

// RSS_FEEDS imported from lib/news.js for consistency with Vercel production

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
const FEEDS_FILE = path.join(DATA_DIR, 'feeds.json');

async function ensureDataDir(){
  try{ await fs.mkdir(DATA_DIR, { recursive: true }); }catch(e){ console.warn('Could not create data dir', e && e.message ? e.message : e); }
}

async function readRemovedTags(){
  try{
    await ensureDataDir();
    const raw = await fs.readFile(REMOVED_TAGS_FILE, 'utf8');
    const data = raw.trim() || '[]';
    return JSON.parse(data);
  }catch(e){
    if(e.code === 'ENOENT') return [];
    console.warn('readRemovedTags failed:', e.message || String(e));
    return [];
  }
}

async function writeRemovedTags(arr){
  try{
    await ensureDataDir();
    const norm = Array.from(new Set((arr || []).map(normalizeTextSimple).filter(Boolean)));
    await fs.writeFile(REMOVED_TAGS_FILE, JSON.stringify(norm, null, 2), 'utf8');
  }catch(e){ 
    console.error('writeRemovedTags failed:', e.message || String(e)); 
    throw e; // Re-throw to let caller handle
  }
}

async function readManualFeeds(){
  try{
    await ensureDataDir();
    const raw = await fs.readFile(FEEDS_FILE, 'utf8');
    const data = raw.trim() || '[]';
    return JSON.parse(data);
  }catch(e){
    if(e.code === 'ENOENT') return [];
    console.warn('readManualFeeds failed:', e.message || String(e));
    return [];
  }
}

async function writeManualFeeds(arr){
  try{
    await ensureDataDir();
    await fs.writeFile(FEEDS_FILE, JSON.stringify(arr || [], null, 2), 'utf8');
  }catch(e){ 
    console.error('writeManualFeeds failed:', e.message || String(e)); 
    throw e; // Re-throw to let caller handle
  }
}

let manualFeeds = await readManualFeeds();
for(const f of manualFeeds){
  if(f && f.url && !RSS_FEEDS.some(r => r.url === f.url)){
    RSS_FEEDS.push({ url: f.url, name: f.name || 'manual' });
  }
}

// Alternative feeds imported from lib/news.js as LIB_ALTERNATIVE_FEEDS
const ALTERNATIVE_FEEDS = LIB_ALTERNATIVE_FEEDS;

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

// Matching keywords are centralized in `lib/news.js` - use `getMatches` and `isStrictMatch` from there for consistent behavior across RSS and NewsAPI.
// Use normalization helpers exported from `lib/news.js` (we import `normalizeTextSimple` in this file).

// Returns the list of matching keywords found in the provided text
// Use `getMatches` from `lib/news.js` (imported at top) for consistent keyword matching.

// Strict filter: require at least one electoral keyword AND one haute-vienne keyword
// (removed temporary haute-vienne-only strict filter)

// Use `isStrictMatch` from `lib/news.js` (imported at top) for consistent strict matching.

// Delegate RSS fetching to shared implementation in lib/news.js
async function fetchRssFeeds(limit = 20, debug = false) {
  // lib.fetchRssFeeds(limit, debug) returns an array when debug=false or { items, reports } when debug=true
  const lib = await import('./lib/news.js');
  return await lib.fetchRssFeeds(limit, debug);
}

app.get('/api/news', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
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
  const EXCLUDED_SOURCES = ['linternaute.com', 'linternaute'];
  const isExcludedSource = (item) => {
    const url = (item.url || '').toLowerCase();
    const source = (item.source || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    return EXCLUDED_SOURCES.some(s => url.includes(s) || source.includes(s) || title.includes(s) || description.includes(s));
  };

  if (NEWSAPI_ENABLED) {
    try {
      const q = encodeURIComponent('"municipales Limoges 2026" OR "élections municipales Limoges 2026" OR "municipales Limoges" OR "élections municipales Limoges" OR (Limoges AND (municipales OR élections OR mairie OR candidats OR 2026))');
      const NEWSAPI_LOOKBACK_DAYS = parseInt(process.env.NEWSAPI_LOOKBACK_DAYS || '30', 10);
      const from = new Date(Date.now() - NEWSAPI_LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString().split('T')[0];

      // NewsAPI limits pageSize to 100, so request multiple pages when limit > 100
      const pageSize = 100;
      const pagesNeeded = Math.ceil(limit / pageSize);
      let accumulated = [];
      for (let page = 1; page <= pagesNeeded; page++) {
        const urlApi = `https://newsapi.org/v2/everything?q=${q}&from=${from}&sortBy=publishedAt&pageSize=${pageSize}&page=${page}&language=fr&apiKey=${NEWSAPI_KEY}`;
        let data;
        try {
          const r = await fetchWithTimeout(urlApi, {}, 8000);
          data = await parseJson(r);
        } catch (fetchErr) {
          console.warn(`NewsAPI page ${page} fetch failed:`, fetchErr.message);
          break;
        }
        if (data.status !== 'ok' || !(data.articles || []).length) break;
        const mapped = (data.articles || []).map(a => {
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
        }).filter(a => a.matches && a.matches.length > 0 && !isExcludedSource(a));
        accumulated.push(...mapped);
        if (accumulated.length >= limit) break;
      }

      const newsapiArticles = accumulated.slice(0, limit);
      if (newsapiArticles.length > 0) {
        sources.push('newsapi');
        allArticles.push(...newsapiArticles);
      }
    } catch(e) { 
      console.warn('NewsAPI fetch failed:', e && e.message ? e.message : e); 
    }
  }

  // 3. Exclude disallowed sources
  allArticles = allArticles.filter(a => !isExcludedSource(a));

  // 4. Apply removed tags filter
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

  // 5. Filter by date (last 60 days)
  const cutoff = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  allArticles = allArticles.filter(a => {
    if (!a.publishedAt) return true; // keep articles without date
    const pd = new Date(a.publishedAt);
    if (isNaN(pd)) return true;
    return pd >= cutoff;
  });

  // 6. Apply strict filtering (Limoges + election keywords) if requested
  if (strict) {
    allArticles = allArticles.filter(a => isStrictMatch(a.matches || [], { 
      source: a.source, 
      url: a.url, 
      title: a.title, 
      description: a.description 
    }));
  }

  // 7. Remove Google News wrappers when a direct source exists
  allArticles = removeGoogleWrappers(allArticles);

  // 7b. Deduplicate near-duplicate titles across sources
  allArticles = deduplicateSimilarTitles(allArticles);

  // 8. Deduplicate by exact URL to remove strict duplicates
  allArticles = deduplicateByUrl(allArticles);

  // 9. Sort by date (most recent first)
  allArticles = sortByDate(allArticles);

  // Group articles by month (YYYY-MM)
  const monthlyArticles = {};
  const monthOrder = [];
  
  for (const a of allArticles) {
    if (!a.publishedAt) continue;
    const d = new Date(a.publishedAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyArticles[monthKey]) {
      monthlyArticles[monthKey] = [];
      monthOrder.push(monthKey);
    }
    monthlyArticles[monthKey].push(a);
  }
  
  // Limit articles per month and keep total at ~50
  const articlesPerMonth = Math.max(5, Math.ceil(limit / Math.max(1, monthOrder.length)));
  for (const month of monthOrder) {
    monthlyArticles[month] = monthlyArticles[month].slice(0, articlesPerMonth);
  }

  // 10. Return results
  const finalArticles = allArticles.slice(0, limit);
  
  if (finalArticles.length === 0) {
    return res.json({ 
      articles: [], 
      monthlyArticles: {},
      months: [],
      source: sources.join('+') || 'none', 
      strict, 
      note: 'No matching articles found.' 
    });
  }

  return res.json({ 
    articles: finalArticles, 
    monthlyArticles,
    months: monthOrder,
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
    const normalized = normalizeTextSimple((tag || '').toString());
    const current = new Set((await readRemovedTags()).map(normalizeTextSimple));

    if(action === 'add'){
      if(normalized) current.add(normalized);
      await writeRemovedTags(Array.from(current));
      return res.json({ ok: true, removed: Array.from(current) });
    }
    if(action === 'remove'){
      if(normalized){ current.delete(normalized); }
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
  // Check if user is authenticated via JWT
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.auth_token;
  
  if (!token) {
    return false;
  }
  
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
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
    const removedSet = new Set(fileRemoved.map(r => normalizeTextSimple(r)));

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
app.post('/admin/feeds/update', async (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url, name, newUrl } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  const target = RSS_FEEDS.find(f => f.url === url);
  if(!target) return res.status(404).json({ ok: false, error: 'not found' });

  const finalUrl = newUrl && newUrl !== url ? newUrl : url;
  if(finalUrl !== url && RSS_FEEDS.some(f => f.url === finalUrl)){
    return res.status(400).json({ ok: false, error: 'url already exists' });
  }

  // update in-memory feed
  target.url = finalUrl;
  target.name = name || target.name;

  // persist manual feeds
  let manualUpdated = false;
  manualFeeds = manualFeeds.map(f => {
    if(f.url === url){
      manualUpdated = true;
      return { ...f, url: finalUrl, name: name || f.name || 'manual' };
    }
    return f;
  });
  if(manualUpdated) await writeManualFeeds(manualFeeds);

  // migrate failure/blacklist tracking to new URL
  if(finalUrl !== url){
    const prevFailures = feedFailures.get(url);
    feedFailures.delete(url);
    if(prevFailures !== undefined) feedFailures.set(finalUrl, prevFailures);
    if(blacklistedFeeds.has(url)){
      blacklistedFeeds.delete(url);
      // do not carry blacklist to new URL
    }
  }

  res.json({ ok: true, url: finalUrl, name: target.name });
});

app.post('/admin/feeds/add', async (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url, name } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  // Validate URL format
  try { new URL(url); } catch(e) { return res.status(400).json({ error: 'invalid url format' }); }
  if(RSS_FEEDS.some(f => f.url === url)) return res.json({ ok: false, message: 'already exists' });
  const entry = { url, name: name || 'manual' };
  RSS_FEEDS.push(entry);
  manualFeeds.push(entry);
  await writeManualFeeds(manualFeeds);
  feedFailures.set(url, 0);
  blacklistedFeeds.delete(url);
  res.json({ ok: true, url });
});

app.post('/admin/feeds/remove', async (req, res) => {
  if(!checkAdminAuth(req)) return res.status(401).json({ error: 'unauthorized' });
  const { url } = req.body || {};
  if(!url) return res.status(400).json({ error: 'url required' });
  const before = RSS_FEEDS.length;
  for(let i = RSS_FEEDS.length - 1; i >= 0; --i) if(RSS_FEEDS[i].url === url) RSS_FEEDS.splice(i,1);
  const manualBefore = manualFeeds.length;
  manualFeeds = manualFeeds.filter(f => f.url !== url);
  if(manualFeeds.length !== manualBefore) await writeManualFeeds(manualFeeds);
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

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve frontend (catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
