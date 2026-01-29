import fetch from 'node-fetch';
import Parser from 'rss-parser';
import fs from 'fs/promises';
import path from 'path';
// avoid MaxListeners warnings during frequent reloads in dev
if (typeof process !== 'undefined' && process.setMaxListeners) process.setMaxListeners(20);
const DATA_DIR = path.join(process.cwd(), 'data');
const REMOVED_TAGS_FILE = path.join(DATA_DIR, 'removedTags.json');
const FEEDS_FILE = path.join(DATA_DIR, 'feeds.json');

// Default feeds used as fallback
const DEFAULT_FEEDS = [
  // Google News search RSS targeting Limoges municipales 2026 (reliable)
  { url: 'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Limoges municipales 2026)' },
  { url: 'https://www.francebleu.fr/rss/infos.xml', name: 'France Bleu' },
  
  // Local and regional sources with strong Limoges coverage
  { url: 'https://news.google.com/rss/search?q=site:lepopulaire.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Le Populaire - Limoges)' },
  { url: 'https://news.google.com/rss/search?q=site:lepopulaire.fr+Haute-Vienne+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Le Populaire - Haute-Vienne)' },

  { url: 'https://news.google.com/rss/search?q=site:actu.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Actu.fr - Limoges)' },

  // Regional feeds
  { url: 'https://france3-regions.francetvinfo.fr/nouvelle-aquitaine/rss', name: 'France 3 Nouvelle Aquitaine' },
  { url: 'https://news.google.com/rss/search?q=site:francebleu.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (France Bleu - Limoges)' },

  // Google News searches for specific electoral coverage
  { url: 'https://news.google.com/rss/search?q=élections+municipales+Limoges+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (élections municipales)' },
  { url: 'https://news.google.com/rss/search?q=municipales+Limoges+candidats&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (candidats Limoges)' }
];

async function loadFeeds(){
  try{
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(FEEDS_FILE, 'utf8');
    const feeds = JSON.parse(raw);
    return Array.isArray(feeds) && feeds.length > 0 ? feeds : DEFAULT_FEEDS;
  }catch(e){
    if(e.code !== 'ENOENT') console.warn('loadFeeds failed:', e.message || String(e));
    return DEFAULT_FEEDS;
  }
}

async function readRemovedTags(){
  try{
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(REMOVED_TAGS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){ 
    if(e.code === 'ENOENT') return []; 
    console.warn('readRemovedTags failed:', e.message || String(e)); 
    return []; 
  }
}

export { readRemovedTags, loadFeeds };

export const parser = new Parser();
export const RSS_FEEDS = [...DEFAULT_FEEDS];

// Load feeds from file on module initialization (non-blocking, for local development)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (async () => {
    try {
      RSS_FEEDS.length = 0; // Clear array
      const loaded = await loadFeeds();
      RSS_FEEDS.push(...loaded);
      console.log(`Loaded ${RSS_FEEDS.length} feeds from ${FEEDS_FILE}`);
    } catch(e) {
      console.warn('Failed to load feeds:', e.message || String(e));
    }
  })();
}

// Save feeds to file (for persistence across serverless instances)
export async function saveFeeds() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FEEDS_FILE, JSON.stringify(RSS_FEEDS, null, 2), 'utf8');
    console.log(`Saved ${RSS_FEEDS.length} feeds to ${FEEDS_FILE}`);
    return true;
  } catch(e) {
    console.warn('saveFeeds failed:', e.message || String(e));
    return false;
  }
}

export const ALTERNATIVE_FEEDS = {
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
  ],
  'actu.fr': [
    'https://news.google.com/rss/search?q=site:actu.fr+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr'
  ]
};

export const feedFailures = new Map();
export const blacklistedFeeds = new Set();
export const MAX_FEED_FAILURES = 3;
export const MAX_AGE_DAYS = 60;

// Sources considered highly trusted / prioritized for permissive matching
const SOURCE_PRIORITY = [
  'lepopulaire','le populaire','la montagne','lamontagne','france bleu','francebleu','actu.fr','france 3','france3','limoges.fr'
];

// Clean up old entries to prevent memory leak
function cleanupOldFailures() {
  const MAX_ENTRIES = 100;
  if (feedFailures.size > MAX_ENTRIES) {
    const entries = Array.from(feedFailures.entries());
    // Keep only the most recent 50% of entries
    const toKeep = entries.slice(-Math.floor(MAX_ENTRIES / 2));
    feedFailures.clear();
    toKeep.forEach(([k, v]) => feedFailures.set(k, v));
  }
}

// Run cleanup every 10 minutes (guarded to avoid duplicate intervals on reload)
if (typeof setInterval !== 'undefined') {
  if (!global.__NEWS_CLEANUP_INTERVAL_SET) {
    global.__NEWS_CLEANUP_INTERVAL_SET = true;
    setInterval(cleanupOldFailures, 10 * 60 * 1000);
  }
}

const EXCLUDED_SOURCES = ['linternaute.com', 'linternaute'];

function isExcludedSource(item){
  const url = (item.url || '').toLowerCase();
  const source = (item.source || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  return EXCLUDED_SOURCES.some(s => url.includes(s) || source.includes(s) || title.includes(s) || description.includes(s));
}

// Normalize text by lowercasing and removing accents
export function normalizeTextSimple(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

// Compare two strings after normalization, collapsing whitespace and trimming
export function sameText(a, b){ const norm = s => (normalizeTextSimple(s)||'').replace(/\s+/g,' ').trim(); return norm(a) === norm(b); }

export async function handleFeedFailure(url, name, reason){
  const count = (feedFailures.get(url) || 0) + 1;
  feedFailures.set(url, count);
  console.warn(`Failed to fetch feed ${url} ${reason ? reason : ''} (failure ${count}/${MAX_FEED_FAILURES})`);
  if (count < MAX_FEED_FAILURES) return;

  try {
    const host = (new URL(url)).hostname.replace(/^www\./,'');
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
        blacklistedFeeds.add(url);
        console.log(`Replaced ${url} with ${added} alternative feed(s).`);
        return;
      }
    }

    // add generic alternative
    try{
      const genericAlt = `https://news.google.com/rss/search?q=site:${host}+Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr`;
      if (!RSS_FEEDS.some(f => f.url === genericAlt) && !blacklistedFeeds.has(genericAlt)){
        RSS_FEEDS.push({ url: genericAlt, name: `Generic alternative for ${host}` });
        feedFailures.set(genericAlt, 0);
        console.log(`Added generic alternative feed for ${host}: ${genericAlt}`);
        blacklistedFeeds.add(url);
        return;
      }
    } catch(e){ console.warn('Failed to add generic alternative for', host, e && e.message ? e.message : e); }

    blacklistedFeeds.add(url);
    console.warn(`Blacklisting feed ${url} after ${count} failures.`);
  } catch (err){
    console.warn('Error handling feed failure for', url, err && err.message ? err.message : err);
    blacklistedFeeds.add(url);
  }
}

const KEYWORDS = [
  'limoges','mairie','municipales','élection','election','élections','elections','candidat','candidats','2026',
  'limousin','haute vienne','haute-vienne','hautevienne','87',
  // nearby towns / communes to consider as regional evidence
  'damien maudet','maudet','Albin Freychet','freychet',
  'émile roger lombertie','emile roger lombertie','lombertie',
  'thierry miguel','miguel',
  'vincent léonie','vincent leonie','leonie'
];

// Town keys used for UI and strict matching (full Haute-Vienne communes, space and hyphen variants)
export const TOWN_KEYS = [
  'aixe sur vienne',   'aixe-sur-vienne',   'ambazac',   'arnac la poste',   'arnac-la-poste',   'augne',   'aureil',   'azat le ris',
  'azat-le-ris',   'balledent',   'beaumont du lac',   'beaumont-du-lac',   'bellac',   'berneuil',   'bersac sur rivalier',   'bersac-sur-rivalier',
  'bessines sur gartempe',   'bessines-sur-gartempe',   'beynac',   'blanzac',   'blond',   'boisseuil',   'bonnac la cote',   'bonnac-la-cote',
  'bosmie l aiguille',   'bosmie-l aiguille',   'bosmie-l-aiguille',   'breuilaufa',   'bujaleuf',   'burgnac',   'bussiere galant',   'bussiere-galant',
  'chaillac sur vienne',   'chaillac-sur-vienne',   'chalus',   'chamboret',   'champagnac la riviere',   'champagnac-la-riviere',   'champnetery',   'champsac',
  'chaptelat',   'chateau chervix',   'chateau-chervix',   'chateauneuf la foret',   'chateauneuf-la-foret',   'chateauponsac',   'cheissoux',   'cheronnac',
  'cieux',   'cognac la foret',   'cognac-la-foret',   'compreignac',   'condat sur vienne',   'condat-sur-vienne',   'coussac bonneval',   'coussac-bonneval',
  'couzeix',   'cromac',   'cussac',   'dinsac',   'dompierre les eglises',   'dompierre-les-eglises',   'domps',   'dournazac',
  'droux',   'eybouleuf',   'eyjeaux',   'eymoutiers',   'feytiat',   'flavignac',   'folles',   'fromental',
  'gajoubert',   'glandon',   'glanges',   'gorre',   'isle',   'jabreilles les bordes',   'jabreilles-les-bordes',   'janailhac',
  'javerdat',   'jouac',   'jourgnac',   'la bazeuge',   'la chapelle montbrandeix',   'la chapelle-montbrandeix',   'la croisille sur briance',   'la croisille-sur-briance',
  'la croix sur gartempe',   'la croix-sur-gartempe',   'la geneytouse',   'la jonchere saint maurice',   'la jonchere-saint-maurice',   'la meyze',   'la porcherie',   'la roche l abeille',
  'la roche-l abeille',   'la-bazeuge',   'la-chapelle-montbrandeix',   'la-croisille-sur-briance',   'la-croix-sur-gartempe',   'la-geneytouse',   'la-jonchere-saint-maurice',   'la-meyze',
  'la-porcherie',   'la-roche-l-abeille',   'ladignac le long',   'ladignac-le-long',   'lauriere',   'lavignac',   'le buis',   'le chalard',
  'le chatenet en dognon',   'le chatenet-en-dognon',   'le dorat',   'le palais sur vienne',   'le palais-sur-vienne',   'le-palais-sur vienne',   'le vigen',   'le-buis',   'le-chalard',
  'le-chatenet-en-dognon',   'le-dorat',   'le-palais-sur-vienne',   'le-vigen',   'les billanges',   'les cars',   'les grands chezeaux',   'les grands-chezeaux',
  'les salles lavauguyon',   'les salles-lavauguyon',   'les-billanges',   'les-cars',   'les-grands-chezeaux',   'les-salles-lavauguyon',   'limoges',   'linards',
  'lussac les eglises',   'lussac-les-eglises',   'magnac bourg',   'magnac laval',   'magnac-bourg',   'magnac-laval',   'mailhac sur benaize',   'mailhac-sur-benaize',
  'maisonnais sur tardoire',   'maisonnais-sur-tardoire',   'marval',   'masleon',   'meilhac',   'meuzac',   'moissannes',   'montrol senard',
  'montrol-senard',   'mortemart',   'nantiat',   'nedde',   'neuvic entier',   'neuvic-entier',   'nexon',   'nieul',
  'nouic',   'oradour saint genest',   'oradour sur glane',   'oradour sur vayres',   'oradour-saint-genest',   'oradour-sur-glane',   'oradour-sur-vayres',   'pageas',
  'panazol',   'pensol',   'peyrat de bellac',   'peyrat le chateau',   'peyrat-de-bellac',   'peyrat-le-chateau',   'peyrilhac',   'pierre buffiere',
  'pierre-buffiere',   'rancon',   'razes',   'rempnat',   'rilhac lastours',   'rilhac rancon',   'rilhac-lastours',   'rilhac-rancon',
  'rochechouart',   'royeres',   'roziers saint georges',   'roziers-saint-georges',   'saillat sur vienne',   'saillat-sur-vienne',   'saint amand le petit',   'saint amand magnazeix',
  'saint auvent',   'saint bazile',   'saint bonnet briance',   'saint bonnet de bellac',   'saint brice sur vienne',   'saint cyr',   'saint denis des murs',   'saint gence',
  'saint genest sur roselle',   'saint georges les landes',   'saint germain les belles',   'saint gilles les forets',   'saint hilaire bonneval',   'saint hilaire la treille',   'saint hilaire les places',   'saint jean ligoure',
  'saint jouvent',   'saint julien le petit',   'saint junien',   'saint junien les combes',   'saint just le martel',   'saint laurent les eglises',   'saint laurent sur gorre',   'saint leger la montagne',
  'saint leger magnazeix',   'saint leonard de noblat',   'saint martial sur isop',   'saint martin de jussac',   'saint martin le mault',   'saint martin le vieux',   'saint martin terressus',   'saint mathieu',
  'saint maurice les brousses',   'saint meard',   'saint ouen sur gartempe',   'saint pardoux le lac',   'saint paul',   'saint priest ligoure',   'saint priest sous aixe',   'saint priest taurion',
  'saint sornin la marche',   'saint sornin leulac',   'saint sulpice lauriere',   'saint sulpice les feuilles',   'saint sylvestre',   'saint victurnien',   'saint vitte sur briance',   'saint yrieix la perche',
  'saint yrieix sous aixe',   'saint-amand-le-petit',   'saint-amand-magnazeix',   'saint-auvent',   'saint-bazile',   'saint-bonnet-briance',   'saint-bonnet-de-bellac',   'saint-brice-sur-vienne',
  'saint-cyr',   'saint-denis-des-murs',   'saint-gence',   'saint-genest-sur-roselle',   'saint-georges-les-landes',   'saint-germain-les-belles',   'saint-gilles-les-forets',   'saint-hilaire-bonneval',
  'saint-hilaire-la-treille',   'saint-hilaire-les-places',   'saint-jean-ligoure',   'saint-jouvent',   'saint-julien-le-petit',   'saint-junien',   'saint-junien-les-combes',   'saint-just-le-martel',
  'saint-laurent-les-eglises',   'saint-laurent-sur-gorre',   'saint-leger-la-montagne',   'saint-leger-magnazeix',   'saint-leonard-de-noblat',   'saint-martial-sur-isop',   'saint-martin-de-jussac',   'saint-martin-le-mault',
  'saint-martin-le-vieux',   'saint-martin-terressus',   'saint-mathieu',   'saint-maurice-les-brousses',   'saint-meard',   'saint-ouen-sur-gartempe',   'saint-pardoux-le-lac',   'saint-paul',
  'saint-priest-ligoure',   'saint-priest-sous-aixe',   'saint-priest-taurion',   'saint-sornin-la-marche',   'saint-sornin-leulac',   'saint-sulpice-lauriere',   'saint-sulpice-les-feuilles',   'saint-sylvestre',
  'saint-victurnien',   'saint-vitte-sur-briance',   'saint-yrieix-la-perche',   'saint-yrieix-sous-aixe',   'sainte anne saint priest',   'sainte marie de vaux',   'sainte-anne-saint-priest',   'sainte-marie-de-vaux',
  'sauviat sur vige',   'sauviat-sur-vige',   'sereilhac',   'solignac',   'surdoux',   'sussac',   'tersannes',   'thouron',
  'val d issoire',   'val d oire et gartempe',   'val-d oire-et-gartempe',   'val-d-issoire',   'val-d-oire-et-gartempe',   'vaulry',   'vayres',   'verneuil moustiers',
  'verneuil sur vienne',   'verneuil-moustiers',   'verneuil-sur-vienne',   'veyrac',   'vicq sur breuilh',   'vicq-sur-breuilh',   'videix',   'villefavard'
];

// Combined keys for matching (keywords + towns)
// Build lazily to avoid initialization order problems (ensure TOWN_KEYS is defined first)
let MATCH_KEYS_CACHE = null;
export function getMatchKeys(){
  if (!MATCH_KEYS_CACHE) {
    MATCH_KEYS_CACHE = [...new Set([...KEYWORDS, ...TOWN_KEYS])];
  }
  return MATCH_KEYS_CACHE;
}

export function getMatches(text){
  const n = normalizeTextSimple(text);
  const found = [];
  const keys = getMatchKeys();
  for(const k of keys){
    const nk = normalizeTextSimple(k);
    if(nk && n.includes(nk)) found.push(k);
  }
  return [...new Set(found)];
}

// Strict match: require Limoges/region evidence (text or source/url). Election keywords boost but are no longer mandatory.
// Towns like Saint-Junien are treated as region evidence so local communes are included.
// Excludes articles mentioning other departments/regions (Normandie, Dordogne 24, etc.)
export function isStrictMatch(matches, context = {}){
  const safeMatches = Array.isArray(matches) ? matches : [];
  const norm = safeMatches.map(m => normalizeTextSimple(m));
  
  // Full text for exclusion check (title + description + source + url)
  const fullText = normalizeTextSimple(
    (context.title || '') + ' ' + 
    (context.description || '') + ' ' + 
    (context.source || '') + ' ' + 
    (context.url || '')
  );

  // Exclude articles mentioning other departments/regions (blacklist)
  const excludeRegions = [
    'normandie', 'bretagne', 'alsace', 'lorraine', 'bourgogne', 'franche-comte', 'franche comte',
    'occitanie', 'provence', 'corse', 'rhone alpes', 'rhone-alpes', 'auvergne rhone',
    'ile de france', 'ile-de-france', 'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'nantes',
    'strasbourg', 'montpellier', 'nice', 'rennes', 'lille', 'reims',
    // Départements limitrophes mais hors Haute-Vienne
    'dordogne', '24420', '24', 'perigueux', 'bergerac', 'sarlat', 'sarliac', // Dordogne
    // Vendée
    'vendee', 'vendée', '85', 'la roche sur yon', 'la-roche-sur-yon', 'les sables d\'olonne', 'les sables', 'challans',
    'correze', '19', 'tulle', 'brive', 'brive la gaillarde', 'brive-la-gaillarde', 'malemort', 'ussel', 'egletons', // Corrèze
    'creuse', '23', 'gueret', 'aubusson', // Creuse
    'charente', '16', 'angouleme', 'cognac', // Charente
    'vienne', '86', 'poitiers', 'chatellerault', 'loudun', // Vienne (attention à ne pas confondre avec Haute-Vienne)
    'indre', '36', 'chateauroux', 'issoudun', // Indre
    'deux sevres', 'deux-sevres', '79', 'niort', // Deux-Sèvres
    'charente maritime', 'charente-maritime', '17', 'la rochelle', 'rochefort', 'saintes', // Charente-Maritime
    'lot et garonne', 'lot-et-garonne', '47', 'agen', // Lot-et-Garonne
    'gironde', '33', 'bordeaux', // Gironde (pour être sûr)
    'puy de dome', 'puy-de-dome', '63', 'clermont-ferrand', // Puy-de-Dôme
    'allier', '03', 'moulins', 'montlucon', // Allier
    'cantal', '15', 'aurillac' // Cantal
  ];
  
  // Check if TITLE or DESCRIPTION mentions excluded regions
  const titleAndDesc = normalizeTextSimple(
    (context.title || '') + ' ' + (context.description || '')
  );
  if (excludeRegions.some(r => titleAndDesc.includes(r))) {
    // Exception: if title/description also clearly mentions Limoges/Haute-Vienne, keep it
    // (don't just rely on source/URL which may generically mention "Limoges municipales")
    const hasStrongLocalEvidenceInContent = titleAndDesc.includes('limoges') || titleAndDesc.includes('haute vienne') || titleAndDesc.includes('haute-vienne') || titleAndDesc.includes(' 87 ') || titleAndDesc.includes('87000') || titleAndDesc.includes('87100');
    if (!hasStrongLocalEvidenceInContent) return false;
  }

  // check for Limoges/region in matches (include ONLY Haute-Vienne towns)
  let hasRegion = norm.some(n => n.includes('limoges'));
  if (!hasRegion) {
    if (TOWN_KEYS.some(t => norm.some(n => n.includes(normalizeTextSimple(t))))) hasRegion = true;
  }

  // also consider source or url as evidence of region
  const townKeys = TOWN_KEYS.map(t => normalizeTextSimple(t));
  const src = normalizeTextSimple((context.source || '') + ' ' + (context.url || ''));
  const hasRegionInSource = src.includes('limoges') || src.includes('limousin') || src.includes('haute vienne') || src.includes('haute-vienne') || src.includes('87') || townKeys.some(t => src.includes(t));
  if (hasRegionInSource) hasRegion = true;

  // election-related keywords (required), with exceptions when context/source explicitly suggests an election
  const electionKeys = ['municipales','municipale','élection','election','élections','elections','scrutin','vote','candidat','candidats','liste','listes'];
  // Candidate keywords that can act as election evidence when present in title/description/source/url
  const candidateKeys = ['Albin Freychet','damien maudet','maudet','émile roger lombertie','emile roger lombertie','lombertie','thierry miguel','miguel','vincent leonie','vincent leonie','leonie'];

  // check matches first (explicit keywords detected by getMatches)
  const hasElectionInMatches = electionKeys.some(k => norm.some(n => n.includes(normalizeTextSimple(k))));

  // also inspect the context (title/description/source/url) for either election keywords or candidate names
  const ctxText = normalizeTextSimple((context.title || '') + ' ' + (context.description || '') + ' ' + (context.source || '') + ' ' + (context.url || ''));
  const hasElectionInContext = electionKeys.some(k => ctxText.includes(normalizeTextSimple(k)));
  const hasCandidateInContext = candidateKeys.some(c => ctxText.includes(normalizeTextSimple(c)));

  const hasElection = hasElectionInMatches || hasElectionInContext || hasCandidateInContext;

  if (!hasElection) return false;
  // Correction: do not show news with only 'candidat', 'candidats', 'municipales', or 'elections' as match
  const onlyElectionTags = ['municipales','elections','élections','election','2026'];
  if (
    norm.length === 1 &&
    (norm[0] === 'candidat' || norm[0] === 'candidats' || onlyElectionTags.includes(norm[0]))
  ) return false;
  return hasRegion;
}

export async function fetchRssFeeds(limit = 300, debug = false){
  const items = [];
  const reports = []; // per-feed debug reports
  const preferDepartement = (process.env.PREFER_DEPARTEMENT || 'false').toString().toLowerCase() === 'true';

  const scoreFor = (it) => {
    let score = 0;
    const src = (it.source || '').toLowerCase();

    // Source priority
    if (SOURCE_PRIORITY.some(p => src.includes(p))) score += 120;

    // Prefer department if enabled and article mentions Haute-Vienne / Limousin / department indicators
    const matches = (it.matches || []).map(m => normalizeTextSimple(m));
    if (preferDepartement && matches.some(m => m.includes('haute vienne') || m.includes('haute-vienne') || m.includes('limousin') || m.includes('87'))) score += 200;

    // More matches => higher score
    score += (it.matches || []).length * 20;

    // Non-google URL (direct site) gets boost
    if (it.url && !it.url.includes('news.google.com')) score += 50;

    // recency
    const timeScore = it.publishedAt ? new Date(it.publishedAt).getTime() / 1e12 : 0;
    score += timeScore;

    // small tiebreaker: description length
    score += (it.description || '').length / 5000;

    return score;
  };

  await Promise.all(RSS_FEEDS.map(async (f) =>{
    if (blacklistedFeeds.has(f.url)){
      reports.push({ url: f.url, name: f.name, status: 'blacklisted', httpStatus: null, itemsFound: 0 });
      return;
    }
    try{
      const resp = await fetch(f.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      });

      if (!resp.ok){
        await handleFeedFailure(f.url, f.name, `Status code ${resp.status}`);
        reports.push({ url: f.url, name: f.name, status: 'error', httpStatus: resp.status, itemsFound: 0, error: `Status code ${resp.status}` });
        return;
      }

      const xml = await resp.text();
      const feed = await parser.parseString(xml);
      const feedItems = (feed.items || []).map(it => {
        const title = it.title;
        let description = it.contentSnippet || it.content || it.summary || '';
        if (sameText(title, description)) description = null;
        return {
          title,
          description,
          url: it.link,
          source: f.name || feed.title || (new URL(f.url)).hostname,
          publishedAt: it.isoDate || it.pubDate || null
        };
      });

      // load global removed tags and use to filter matches (normalize & substring-aware)
      const removedArr = (await readRemovedTags()).map(r => normalizeTextSimple(r));

      const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 24 * 3600 * 1000);
      const filtered = feedItems.map(it => {
        const text = (it.title || '') + ' ' + (it.description || '');
        let matches = getMatches(text);
        // remove any matches that are globally removed (normalize + substring-aware)
        matches = matches.filter(m => {
          const nm = normalizeTextSimple(m);
          return !removedArr.some(rn => nm.includes(rn) || rn.includes(nm));
        });
        const primaryMatch = matches.length ? matches[0] : null;
        const scored = Object.assign({}, it, { matches, primaryMatch, score: scoreFor(Object.assign({}, it, { matches })) });
        return scored;
      }).filter(it => {
        if (isExcludedSource(it)) return false;
        if (!it.publishedAt) return false;
        const pubDate = new Date(it.publishedAt);
        if (isNaN(pubDate)) return false;
        if (pubDate < cutoff) return false;
        return (it.matches && it.matches.length > 0);
      });

      reports.push({ url: f.url, name: f.name, status: 'ok', httpStatus: resp.status, itemsFound: filtered.length });
      items.push(...filtered);
    } catch (err){
      await handleFeedFailure(f.url, f.name, err && err.message ? err.message : err);
      reports.push({ url: f.url, name: f.name, status: 'error', httpStatus: null, itemsFound: 0, error: err && err.message ? err.message : String(err) });
    }
  }));

  // sort by score desc, then by date desc
  const final = items.filter(i => i.publishedAt).slice().sort((a,b)=>{
    if ((b.score||0) !== (a.score||0)) return (b.score||0) - (a.score||0);
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  if (debug) return { items: final.slice(0, limit), reports };
  return final.slice(0, limit);
}

export async function fetchAndParseFeed(url, limit = 5){
  try{
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      }
    });
    if(!resp.ok){ await handleFeedFailure(url, null, `Status code ${resp.status}`); throw new Error('Fetch failed: ' + resp.status); }
    const xml = await resp.text();
    const feed = await parser.parseString(xml);
    const items = (feed.items || []).slice(0, limit).map(it => {
      const title = it.title;
      let description = it.contentSnippet || it.content || it.summary || '';
      if (sameText(title, description)) description = null;
      const urlItem = it.link;
      const publishedAt = it.isoDate || it.pubDate || null;
      const matches = getMatches((title || '') + ' ' + (description || ''));
      return { title, description, url: urlItem, publishedAt, matches };
    });
    feedFailures.set(url, 0);
    return items;
  } catch(err){ throw err; }
}