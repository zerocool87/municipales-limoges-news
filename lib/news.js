// Mots-clés et communes utilisés pour le matching (doivent être déclarés avant toute fonction qui les utilise)
export const KEYWORDS = [
  'mairie','municipales','élection','election','élections','elections','candidat','candidats','2026',
  // nearby towns / communes to consider as regional evidence
  'damien maudet','maudet','Albin Freychet','freychet',
  'émile roger lombertie','emile roger lombertie','lombertie',
  'thierry miguel','miguel',
  'vincent léonie','vincent leonie','leonie'
];

export const TOWN_KEYS = [
  'aixe sur vienne', 'aixe-sur-vienne', 'ambazac', 'arnac la poste', 'arnac-la-poste', 'augne', 'aureil', 'azat le ris',
  'azat-le-ris', 'balledent', 'beaumont du lac', 'beaumont-du-lac', 'bellac', 'berneuil', 'bersac sur rivalier', 'bersac-sur-rivalier',
  'bessines sur gartempe', 'bessines-sur-gartempe', 'beynac', 'blanzac', 'blond', 'boisseuil', 'bonnac la cote', 'bonnac-la-cote',
  'bosmie l aiguille', 'bosmie-l aiguille', 'bosmie-l-aiguille', 'breuilaufa', 'bujaleuf', 'burgnac', 'bussiere galant', 'bussiere-galant',
  'chaillac sur vienne', 'chaillac-sur-vienne', 'chalus', 'chamboret', 'champagnac la riviere', 'champagnac-la-riviere', 'champnetery', 'champsac',
  'chaptelat', 'chateau chervix', 'chateau-chervix', 'chateauneuf la foret', 'chateauneuf-la-foret', 'chateauponsac', 'cheissoux', 'cheronnac',
  'cieux', 'cognac la foret', 'cognac-la-foret', 'compreignac', 'condat sur vienne', 'condat-sur-vienne', 'coussac bonneval', 'coussac-bonneval',
  'couzeix', 'cromac', 'cussac', 'dinsac', 'dompierre les eglises', 'dompierre-les-eglises', 'domps', 'dournazac',
  'droux', 'eybouleuf', 'eyjeaux', 'eymoutiers', 'feytiat', 'flavignac', 'folles', 'fromental',
  'gajoubert', 'glandon', 'glanges', 'gorre', 'isle', 'jabreilles les bordes', 'jabreilles-les-bordes', 'janailhac',
  'javerdat', 'jouac', 'jourgnac', 'la bazeuge', 'la chapelle montbrandeix', 'la chapelle-montbrandeix', 'la croisille sur briance', 'la croisille-sur-briance',
  'la croix sur gartempe', 'la croix-sur-gartempe', 'la geneytouse', 'la jonchere saint maurice', 'la jonchere-saint-maurice', 'la meyze', 'la porcherie', 'la roche l abeille',
  'la roche-l abeille', 'la-bazeuge', 'la-chapelle-montbrandeix', 'la-croisille-sur-briance', 'la-croix-sur-gartempe', 'la-geneytouse', 'la-jonchere-saint-maurice', 'la-meyze',
  'la-porcherie', 'la-roche-l-abeille', 'ladignac le long', 'ladignac-le-long', 'lauriere', 'lavignac', 'le buis', 'le chalard',
  'le chatenet en dognon', 'le chatenet-en-dognon', 'le dorat', 'le palais sur vienne', 'le palais-sur-vienne', 'le-palais-sur vienne', 'le vigen', 'le-buis', 'le-chalard',
  'le-chatenet-en-dognon', 'le-dorat', 'le-palais-sur-vienne', 'le-vigen', 'les billanges', 'les cars', 'les grands chezeaux', 'les grands-chezeaux',
  'les salles lavauguyon', 'les salles-lavauguyon', 'les-billanges', 'les-cars', 'les-grands-chezeaux', 'les-salles-lavauguyon', 'limoges', 'linards',
  'lussac les eglises', 'lussac-les-eglises', 'magnac bourg', 'magnac laval', 'magnac-bourg', 'magnac-laval', 'mailhac sur benaize', 'mailhac-sur-benaize',
  'maisonnais sur tardoire', 'maisonnais-sur-tardoire', 'marval', 'masleon', 'meilhac', 'meuzac', 'moissannes', 'montrol senard',
  'montrol-senard', 'mortemart', 'nantiat', 'nedde', 'neuvic entier', 'neuvic-entier', 'nexon', 'nieul',
  'nouic', 'oradour saint genest', 'oradour sur glane', 'oradour sur vayres', 'oradour-saint-genest', 'oradour-sur-glane', 'oradour-sur-vayres', 'pageas',
  'panazol', 'pensol', 'peyrat de bellac', 'peyrat le chateau', 'peyrat-de-bellac', 'peyrat-le-chateau', 'peyrilhac', 'pierre buffiere',
  'pierre-buffiere', 'rancon', 'razes', 'rempnat', 'rilhac lastours', 'rilhac rancon', 'rilhac-lastours', 'rilhac-rancon',
  'rochechouart', 'royeres', 'roziers saint georges', 'roziers-saint-georges', 'saillat sur vienne', 'saillat-sur-vienne', 'saint amand le petit', 'saint amand magnazeix',
  'saint auvent', 'saint bazile', 'saint bonnet briance', 'saint bonnet de bellac', 'saint brice sur vienne', 'saint cyr', 'saint denis des murs', 'saint gence',
  'saint genest sur roselle', 'saint georges les landes', 'saint germain les belles', 'saint gilles les forets', 'saint hilaire bonneval', 'saint hilaire la treille', 'saint hilaire les places', 'saint jean ligoure',
  'saint jouvent', 'saint julien le petit', 'saint junien', 'saint junien les combes', 'saint just le martel', 'saint laurent les eglises', 'saint laurent sur gorre', 'saint leger la montagne',
  'saint leger magnazeix', 'saint leonard de noblat', 'saint martial sur isop', 'saint martin de jussac', 'saint martin le mault', 'saint martin le vieux', 'saint martin terressus', 'saint mathieu',
  'saint maurice les brousses', 'saint meard', 'saint ouen sur gartempe', 'saint pardoux le lac', 'saint paul', 'saint priest ligoure', 'saint priest sous aixe', 'saint priest taurion',
  'saint sornin la marche', 'saint sornin leulac', 'saint sulpice lauriere', 'saint sulpice les feuilles', 'saint sylvestre', 'saint victurnien', 'saint vitte sur briance', 'saint yrieix la perche',
  'saint yrieix sous aixe', 'saint-amand-le-petit', 'saint-amand-magnazeix', 'saint-auvent', 'saint-bazile', 'saint-bonnet-briance', 'saint-bonnet-de-bellac', 'saint-brice-sur-vienne',
  'saint-cyr', 'saint-denis-des-murs', 'saint-gence', 'saint-genest-sur-roselle', 'saint-georges-les-landes', 'saint-germain-les-belles', 'saint-gilles-les-forets', 'saint-hilaire-bonneval',
  'saint-hilaire-la-treille', 'saint-hilaire-les-places', 'saint-jean-ligoure', 'saint-jouvent', 'saint-julien-le-petit', 'saint-junien', 'saint-junien-les-combes', 'saint-just-le-martel',
  'saint-laurent-les-eglises', 'saint-laurent-sur-gorre', 'saint-leger-la-montagne', 'saint-leger-magnazeix', 'saint-leonard-de-noblat', 'saint-martial-sur-isop', 'saint-martin-de-jussac', 'saint-martin-le-mault',
  'saint-martin-le-vieux', 'saint-martin-terressus', 'saint-mathieu', 'saint-maurice-les-brousses', 'saint-meard', 'saint-ouen-sur-gartempe', 'saint-pardoux-le-lac', 'saint-paul',
  'saint-priest-ligoure', 'saint-priest-sous-aixe', 'saint-priest-taurion', 'saint-sornin-la-marche', 'saint-sornin-leulac', 'saint-sulpice-lauriere', 'saint-sulpice-les-feuilles', 'saint-sylvestre',
  'saint-victurnien', 'saint-vitte-sur-briance', 'saint-yrieix-la-perche', 'saint-yrieix-sous-aixe', 'sainte anne saint priest', 'sainte marie de vaux', 'sainte-anne-saint-priest', 'sainte-marie-de-vaux',
  'sauviat sur vige', 'sauviat-sur-vige', 'sereilhac', 'solignac', 'surdoux', 'sussac', 'tersannes', 'thouron',
  'val d issoire', 'val d oire et gartempe', 'val-d oire-et-gartempe', 'val-d-issoire', 'val-d-oire-et-gartempe', 'vaulry', 'vayres', 'verneuil moustiers',
  'verneuil sur vienne', 'verneuil-moustiers', 'verneuil-sur-vienne', 'veyrac', 'vicq sur breuilh', 'vicq-sur-breuilh', 'videix', 'villefavard'
];




import fetch from 'node-fetch';
import Parser from 'rss-parser';


const parser = new Parser();

/**
 * Récupère et parse les flux RSS définis dans RSS_FEEDS.
 * @param {number} limit - Nombre maximum d'articles à retourner.
 * @param {boolean} debug - Si true, retourne aussi les rapports de récupération.
 * @returns {Promise<Array|Object>} Liste d'articles ou objet debug.
 */
export async function fetchRssFeeds(limit = 10, debug = false) {
  // Charger dynamiquement les flux RSS depuis feeds.json
  const fs = await import('fs/promises');
  const path = await import('path');
  const feedsPath = path.resolve(process.cwd(), 'data/feeds.json');
  let RSS_FEEDS = [];
  try {
    const feedsRaw = await fs.readFile(feedsPath, 'utf-8');
    RSS_FEEDS = JSON.parse(feedsRaw);
  } catch (e) {
    // fallback si erreur de lecture
    RSS_FEEDS = [
      { url: 'https://news.google.com/rss/search?q=Limoges+municipales+2026&hl=fr&gl=FR&ceid=FR:fr', name: 'Google News (Limoges municipales 2026)' },
      { url: 'https://www.francebleu.fr/rss/infos.xml', name: 'France Bleu' }
    ];
  }

  const items = [];
  const reports = [];

  await Promise.all(
    RSS_FEEDS.map(async (feed) => {
      try {
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*'
          }
        });

        if (!response.ok) {
          reports.push({ url: feed.url, name: feed.name, status: 'error', httpStatus: response.status });
          return;
        }

        const xml = await response.text();
        const parsedFeed = await parser.parseString(xml);


        // Ajout du champ matches pour chaque article (matching robuste sur TOWN_KEYS)
        const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-'’]/g, ' ').replace(/\s+/g, ' ').trim();
        const feedItems = (parsedFeed.items || []).map((item) => {
          const title = item.title || '';
          const description = item.contentSnippet || item.content || item.summary || '';
          const textNorm = normalize(title + ' ' + description);
          // Recherche des villes présentes dans le texte normalisé
          const matches = TOWN_KEYS.filter(k => {
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
            matches: (matches.length > 0 && hasElection) ? matches : []
          };
        });

        items.push(...feedItems);
        reports.push({ url: feed.url, name: feed.name, status: 'ok', httpStatus: response.status, itemsFound: feedItems.length });
      } catch (error) {
        reports.push({ url: feed.url, name: feed.name, status: 'error', error: error.message });
      }
    })
  );

  // Trier les articles par date de publication (du plus récent au plus ancien)
  const sortedItems = items
    .filter((item) => item.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);

  if (debug) {
    return { items: sortedItems, reports };
  }

  return sortedItems;
}
