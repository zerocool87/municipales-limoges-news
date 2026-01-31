module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/news.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// Mots-clés et communes utilisés pour le matching (doivent être déclarés avant toute fonction qui les utilise)
__turbopack_context__.s([
    "KEYWORDS",
    ()=>KEYWORDS,
    "TOWN_KEYS",
    ()=>TOWN_KEYS,
    "fetchRssFeeds",
    ()=>fetchRssFeeds
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$2d$fetch__$5b$external$5d$__$28$node$2d$fetch$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$node$2d$fetch$29$__ = __turbopack_context__.i("[externals]/node-fetch [external] (node-fetch, esm_import, [project]/node_modules/node-fetch)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$rss$2d$parser__$5b$external$5d$__$28$rss$2d$parser$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$rss$2d$parser$29$__ = __turbopack_context__.i("[externals]/rss-parser [external] (rss-parser, cjs, [project]/node_modules/rss-parser)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$node$2d$fetch__$5b$external$5d$__$28$node$2d$fetch$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$node$2d$fetch$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$node$2d$fetch__$5b$external$5d$__$28$node$2d$fetch$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$node$2d$fetch$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
const KEYWORDS = [
    'mairie',
    'municipales',
    'élection',
    'election',
    'élections',
    'elections',
    'candidat',
    'candidats',
    '2026',
    // nearby towns / communes to consider as regional evidence
    'damien maudet',
    'maudet',
    'Albin Freychet',
    'freychet',
    'émile roger lombertie',
    'emile roger lombertie',
    'lombertie',
    'thierry miguel',
    'miguel',
    'vincent léonie',
    'vincent leonie',
    'leonie'
];
const TOWN_KEYS = [
    'aixe sur vienne',
    'aixe-sur-vienne',
    'ambazac',
    'arnac la poste',
    'arnac-la-poste',
    'augne',
    'aureil',
    'azat le ris',
    'azat-le-ris',
    'balledent',
    'beaumont du lac',
    'beaumont-du-lac',
    'bellac',
    'berneuil',
    'bersac sur rivalier',
    'bersac-sur-rivalier',
    'bessines sur gartempe',
    'bessines-sur-gartempe',
    'beynac',
    'blanzac',
    'blond',
    'boisseuil',
    'bonnac la cote',
    'bonnac-la-cote',
    'bosmie l aiguille',
    'bosmie-l aiguille',
    'bosmie-l-aiguille',
    'breuilaufa',
    'bujaleuf',
    'burgnac',
    'bussiere galant',
    'bussiere-galant',
    'chaillac sur vienne',
    'chaillac-sur-vienne',
    'chalus',
    'chamboret',
    'champagnac la riviere',
    'champagnac-la-riviere',
    'champnetery',
    'champsac',
    'chaptelat',
    'chateau chervix',
    'chateau-chervix',
    'chateauneuf la foret',
    'chateauneuf-la-foret',
    'chateauponsac',
    'cheissoux',
    'cheronnac',
    'cieux',
    'cognac la foret',
    'cognac-la-foret',
    'compreignac',
    'condat sur vienne',
    'condat-sur-vienne',
    'coussac bonneval',
    'coussac-bonneval',
    'couzeix',
    'cromac',
    'cussac',
    'dinsac',
    'dompierre les eglises',
    'dompierre-les-eglises',
    'domps',
    'dournazac',
    'droux',
    'eybouleuf',
    'eyjeaux',
    'eymoutiers',
    'feytiat',
    'flavignac',
    'folles',
    'fromental',
    'gajoubert',
    'glandon',
    'glanges',
    'gorre',
    'isle',
    'jabreilles les bordes',
    'jabreilles-les-bordes',
    'janailhac',
    'javerdat',
    'jouac',
    'jourgnac',
    'la bazeuge',
    'la chapelle montbrandeix',
    'la chapelle-montbrandeix',
    'la croisille sur briance',
    'la croisille-sur-briance',
    'la croix sur gartempe',
    'la croix-sur-gartempe',
    'la geneytouse',
    'la jonchere saint maurice',
    'la jonchere-saint-maurice',
    'la meyze',
    'la porcherie',
    'la roche l abeille',
    'la roche-l abeille',
    'la-bazeuge',
    'la-chapelle-montbrandeix',
    'la-croisille-sur-briance',
    'la-croix-sur-gartempe',
    'la-geneytouse',
    'la-jonchere-saint-maurice',
    'la-meyze',
    'la-porcherie',
    'la-roche-l-abeille',
    'ladignac le long',
    'ladignac-le-long',
    'lauriere',
    'lavignac',
    'le buis',
    'le chalard',
    'le chatenet en dognon',
    'le chatenet-en-dognon',
    'le dorat',
    'le palais sur vienne',
    'le palais-sur-vienne',
    'le-palais-sur vienne',
    'le vigen',
    'le-buis',
    'le-chalard',
    'le-chatenet-en-dognon',
    'le-dorat',
    'le-palais-sur-vienne',
    'le-vigen',
    'les billanges',
    'les cars',
    'les grands chezeaux',
    'les grands-chezeaux',
    'les salles lavauguyon',
    'les salles-lavauguyon',
    'les-billanges',
    'les-cars',
    'les-grands-chezeaux',
    'les-salles-lavauguyon',
    'limoges',
    'linards',
    'lussac les eglises',
    'lussac-les-eglises',
    'magnac bourg',
    'magnac laval',
    'magnac-bourg',
    'magnac-laval',
    'mailhac sur benaize',
    'mailhac-sur-benaize',
    'maisonnais sur tardoire',
    'maisonnais-sur-tardoire',
    'marval',
    'masleon',
    'meilhac',
    'meuzac',
    'moissannes',
    'montrol senard',
    'montrol-senard',
    'mortemart',
    'nantiat',
    'nedde',
    'neuvic entier',
    'neuvic-entier',
    'nexon',
    'nieul',
    'nouic',
    'oradour saint genest',
    'oradour sur glane',
    'oradour sur vayres',
    'oradour-saint-genest',
    'oradour-sur-glane',
    'oradour-sur-vayres',
    'pageas',
    'panazol',
    'pensol',
    'peyrat de bellac',
    'peyrat le chateau',
    'peyrat-de-bellac',
    'peyrat-le-chateau',
    'peyrilhac',
    'pierre buffiere',
    'pierre-buffiere',
    'rancon',
    'razes',
    'rempnat',
    'rilhac lastours',
    'rilhac rancon',
    'rilhac-lastours',
    'rilhac-rancon',
    'rochechouart',
    'royeres',
    'roziers saint georges',
    'roziers-saint-georges',
    'saillat sur vienne',
    'saillat-sur-vienne',
    'saint amand le petit',
    'saint amand magnazeix',
    'saint auvent',
    'saint bazile',
    'saint bonnet briance',
    'saint bonnet de bellac',
    'saint brice sur vienne',
    'saint cyr',
    'saint denis des murs',
    'saint gence',
    'saint genest sur roselle',
    'saint georges les landes',
    'saint germain les belles',
    'saint gilles les forets',
    'saint hilaire bonneval',
    'saint hilaire la treille',
    'saint hilaire les places',
    'saint jean ligoure',
    'saint jouvent',
    'saint julien le petit',
    'saint junien',
    'saint junien les combes',
    'saint just le martel',
    'saint laurent les eglises',
    'saint laurent sur gorre',
    'saint leger la montagne',
    'saint leger magnazeix',
    'saint leonard de noblat',
    'saint martial sur isop',
    'saint martin de jussac',
    'saint martin le mault',
    'saint martin le vieux',
    'saint martin terressus',
    'saint mathieu',
    'saint maurice les brousses',
    'saint meard',
    'saint ouen sur gartempe',
    'saint pardoux le lac',
    'saint paul',
    'saint priest ligoure',
    'saint priest sous aixe',
    'saint priest taurion',
    'saint sornin la marche',
    'saint sornin leulac',
    'saint sulpice lauriere',
    'saint sulpice les feuilles',
    'saint sylvestre',
    'saint victurnien',
    'saint vitte sur briance',
    'saint yrieix la perche',
    'saint yrieix sous aixe',
    'saint-amand-le-petit',
    'saint-amand-magnazeix',
    'saint-auvent',
    'saint-bazile',
    'saint-bonnet-briance',
    'saint-bonnet-de-bellac',
    'saint-brice-sur-vienne',
    'saint-cyr',
    'saint-denis-des-murs',
    'saint-gence',
    'saint-genest-sur-roselle',
    'saint-georges-les-landes',
    'saint-germain-les-belles',
    'saint-gilles-les-forets',
    'saint-hilaire-bonneval',
    'saint-hilaire-la-treille',
    'saint-hilaire-les-places',
    'saint-jean-ligoure',
    'saint-jouvent',
    'saint-julien-le-petit',
    'saint-junien',
    'saint-junien-les-combes',
    'saint-just-le-martel',
    'saint-laurent-les-eglises',
    'saint-laurent-sur-gorre',
    'saint-leger-la-montagne',
    'saint-leger-magnazeix',
    'saint-leonard-de-noblat',
    'saint-martial-sur-isop',
    'saint-martin-de-jussac',
    'saint-martin-le-mault',
    'saint-martin-le-vieux',
    'saint-martin-terressus',
    'saint-mathieu',
    'saint-maurice-les-brousses',
    'saint-meard',
    'saint-ouen-sur-gartempe',
    'saint-pardoux-le-lac',
    'saint-paul',
    'saint-priest-ligoure',
    'saint-priest-sous-aixe',
    'saint-priest-taurion',
    'saint-sornin-la-marche',
    'saint-sornin-leulac',
    'saint-sulpice-lauriere',
    'saint-sulpice-les-feuilles',
    'saint-sylvestre',
    'saint-victurnien',
    'saint-vitte-sur-briance',
    'saint-yrieix-la-perche',
    'saint-yrieix-sous-aixe',
    'sainte anne saint priest',
    'sainte marie de vaux',
    'sainte-anne-saint-priest',
    'sainte-marie-de-vaux',
    'sauviat sur vige',
    'sauviat-sur-vige',
    'sereilhac',
    'solignac',
    'surdoux',
    'sussac',
    'tersannes',
    'thouron',
    'val d issoire',
    'val d oire et gartempe',
    'val-d oire-et-gartempe',
    'val-d-issoire',
    'val-d-oire-et-gartempe',
    'vaulry',
    'vayres',
    'verneuil moustiers',
    'verneuil sur vienne',
    'verneuil-moustiers',
    'verneuil-sur-vienne',
    'veyrac',
    'vicq sur breuilh',
    'vicq-sur-breuilh',
    'videix',
    'villefavard'
];
;
;
const parser = new __TURBOPACK__imported__module__$5b$externals$5d2f$rss$2d$parser__$5b$external$5d$__$28$rss$2d$parser$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f$rss$2d$parser$29$__["default"]();
async function fetchRssFeeds(limit = 10, debug = false) {
    // Charger dynamiquement les flux RSS depuis feeds.json
    const fs = await __turbopack_context__.A("[externals]/fs/promises [external] (fs/promises, cjs, async loader)");
    const path = await __turbopack_context__.A("[externals]/path [external] (path, cjs, async loader)");
    const feedsPath = path.resolve(process.cwd(), 'data/feeds.json');
    let RSS_FEEDS = [];
    try {
        const feedsRaw = await fs.readFile(feedsPath, 'utf-8');
        RSS_FEEDS = JSON.parse(feedsRaw);
    } catch (e) {
        // fallback si erreur de lecture
        RSS_FEEDS = [
            {
                url: 'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr',
                name: 'Google News (Limoges municipales 2026)'
            },
            {
                url: 'https://www.francebleu.fr/rss/infos.xml',
                name: 'France Bleu'
            }
        ];
    }
    const items = [];
    const reports = [];
    await Promise.all(RSS_FEEDS.map(async (feed)=>{
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$2d$fetch__$5b$external$5d$__$28$node$2d$fetch$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$node$2d$fetch$29$__["default"])(feed.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                }
            });
            if (!response.ok) {
                reports.push({
                    url: feed.url,
                    name: feed.name,
                    status: 'error',
                    httpStatus: response.status
                });
                return;
            }
            const xml = await response.text();
            const parsedFeed = await parser.parseString(xml);
            // Ajout du champ matches pour chaque article (matching robuste sur TOWN_KEYS)
            const normalize = (s)=>(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim();
            const feedItems = (parsedFeed.items || []).map((item)=>{
                const title = item.title || '';
                const description = item.contentSnippet || item.content || item.summary || '';
                const textNorm = normalize(title + ' ' + description);
                // Recherche des villes présentes dans le texte normalisé
                const matches = TOWN_KEYS.filter((k)=>{
                    const kNorm = normalize(k);
                    return textNorm.includes(kNorm);
                });
                // Filtre strict : il faut aussi que le texte contienne "municipales" ou "candidat"
                const hasElection = textNorm.includes('municipales') || textNorm.includes('candidat') || textNorm.includes('candidats');
                return {
                    title,
                    description,
                    url: item.link,
                    source: feed.name || parsedFeed.title || new URL(feed.url).hostname,
                    publishedAt: item.isoDate || item.pubDate || null,
                    matches: matches.length > 0 && hasElection ? matches : []
                };
            });
            items.push(...feedItems);
            reports.push({
                url: feed.url,
                name: feed.name,
                status: 'ok',
                httpStatus: response.status,
                itemsFound: feedItems.length
            });
        } catch (error) {
            reports.push({
                url: feed.url,
                name: feed.name,
                status: 'error',
                error: error.message
            });
        }
    }));
    // Trier les articles par date de publication (du plus récent au plus ancien)
    const sortedItems = items.filter((item)=>item.publishedAt).sort((a, b)=>new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, limit);
    if (debug) {
        return {
            items: sortedItems,
            reports
        };
    }
    return sortedItems;
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/pages/api/news.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/news.js [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2e$js__$5b$api$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2e$js__$5b$api$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function handler(req, res) {
    try {
        const limit = parseInt(req.query.limit, 10) || 200;
        const debugReq = req.query.debug === 'true';
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$news$2e$js__$5b$api$5d$__$28$ecmascript$29$__["fetchRssFeeds"])(limit, debugReq);
        const articles = debugReq && result.items ? result.items : result;
        const reports = debugReq && result.reports ? result.reports : null;
        // Regrouper par mois pour la pagination
        const monthlyArticles = {};
        const months = [];
        articles.forEach((article)=>{
            if (article.publishedAt) {
                const month = new Date(article.publishedAt).toLocaleString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                });
                if (!monthlyArticles[month]) {
                    monthlyArticles[month] = [];
                    months.push(month);
                }
                monthlyArticles[month].push(article);
            }
        });
        const payload = {
            articles,
            monthlyArticles,
            months
        };
        if (reports) payload.reports = reports;
        res.status(200).json(payload);
    } catch (e) {
        res.status(500).json({
            articles: [],
            monthlyArticles: {},
            months: [],
            error: e.message
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__96c75879._.js.map