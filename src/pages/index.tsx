import React, { useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  // États React pour les données dynamiques
  const [articles, setArticles] = React.useState([]);
const [monthlyArticles, setMonthlyArticles] = React.useState({});
const [months, setMonths] = React.useState([]);
const [currentMonth, setCurrentMonth] = React.useState('');
const [status, setStatus] = React.useState('Chargement des dernières news municipales (Limoges 2026)...');
const [updated, setUpdated] = React.useState('–');
const [articleCount, setArticleCount] = React.useState(0);
const [activeTag, setActiveTag] = React.useState('');
// TODO: Ajouter la gestion des filtres et du thème
// Types pour les articles
interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  matches?: string[];
  primaryMatch?: string;
}

interface MonthlyArticles {
  [month: string]: Article[];
}

  useEffect(() => {
    fetch('/api/news?limit=200')
      .then(res => res.json())
      .then(json => {
        setArticles(json.articles || []);
        setArticleCount((json.articles || []).length);
        setUpdated(new Date().toLocaleString());
        setStatus('');
        setMonthlyArticles(json.monthlyArticles || {});
        setMonths(json.months || []);
      })
      .catch(() => setStatus('Impossible de charger les news.'));
  }, []);

  // Filtrage par mois et tag
  const hauteVienneVilles = [
    'Aixe-sur-Vienne', 'Ambazac', 'Arnac-la-Poste', 'Augne', 'Aureil', 'Azat-le-Ris', 'Balledent', 'Beaumont-du-Lac', 'Bellac', 'Berneuil', 'Bersac-sur-Rivalier', 'Bessines-sur-Gartempe', 'Beynac', 'Blanzac', 'Blond', 'Boisseuil', 'Bonnac-la-Côte', "Bosmie-l'Aiguille", 'Breuilaufa', 'Bujaleuf', 'Burgnac', 'Bussière-Boffy', 'Bussière-Galant', 'Bussière-Poitevine', 'Châlus', 'Chamboret', 'Champagnac-la-Rivière', 'Champnétery', 'Champsac', 'Chaptelat', 'Château-Chervix', 'Châteauneuf-la-Forêt', 'Châteauponsac', 'Le Châtenet-en-Dognon', 'Cheissoux', 'Chéronnac', 'Cieux', 'Cognac-la-Forêt', 'Condat-sur-Vienne', 'Coussac-Bonneval', 'Couzeix', 'Cromac', 'Cussac', 'Darnac', 'Dinsac', 'Domps', 'Draix', 'Eybouleuf', 'Eyjeaux', 'Eymoutiers', 'Feytiat', 'Flavignac', 'Folles', 'Fromental', 'Gajoubert', 'Glandon', 'Glanges', 'Gorre', 'Janailhac', 'Isle', 'Jabreilles-les-Bordes', 'Javerdat', 'Jouac', 'Jourgnac', 'La Bazeuge', 'La Chapelle-Montbrandeix', 'La Croisille-sur-Briance', 'La Genétouze', 'La Jonchère-Saint-Maurice', 'La Meyze', "La Roche-l'Abeille", 'Laurière', 'Lavignac', 'Le Buis', 'Le Chalard', 'Le Dorat', 'Le Grand-Bourg', 'Le Palais-sur-Vienne', 'Le Vigen', 'Les Billanges', 'Les Cars', 'Les Grands-Chézeaux', 'Limoges', 'Linards', 'Lussac-les-Églises', 'Magnac-Bourg', 'Magnac-Laval', 'Mailhac-sur-Benaize', 'Maisonnais-sur-Tardoire', 'Marval', 'Masléon', 'Meilhac', 'Meuzac', 'Moissannes', 'Montrol-Sénard', 'Mortemart', 'Nantiat', 'Nedde', 'Neuvic-Entier', 'Nexon', 'Nieul', 'Nouic', 'Oradour-Saint-Genest', 'Oradour-sur-Glane', 'Oradour-sur-Vayres', 'Pageas', 'Panazol', 'Pensol', 'Peyrat-de-Bellac', 'Peyrat-le-Château', 'Peyrilhac', 'Pierre-Buffière', 'La Porcherie', 'Rancon', 'Razès', 'Rempnat', 'Rilhac-Rancon', 'Rilhac-Lastours', 'Rochechouart', 'Saint-Amand-Magnazeix', 'Saint-Auvent', 'Saint-Bazile', 'Saint-Bonnet-Briance', 'Saint-Bonnet-de-Bellac', 'Saint-Brice-sur-Vienne', 'Saint-Cyr', 'Saint-Denis-des-Murs', 'Saint-Gence', 'Saint-Genest-sur-Roselle', 'Saint-Georges-les-Landes', 'Saint-Germain-les-Belles', 'Saint-Gilles-les-Forêts', 'Saint-Hilaire-Bonneval', 'Saint-Hilaire-la-Treille', 'Saint-Hilaire-les-Places', 'Saint-Jean-Ligoure', 'Saint-Jouvent', 'Saint-Junien', 'Saint-Junien-les-Combes', 'Saint-Just-le-Martel', 'Saint-Laurent-les-Églises', 'Saint-Laurent-sur-Gorre', 'Saint-Léger-la-Montagne', 'Saint-Léger-Magnazeix', 'Saint-Léonard-de-Noblat', 'Saint-Martial-sur-Isop', 'Saint-Martin-de-Jussac', 'Saint-Martin-le-Mault', 'Saint-Martin-le-Vieux', 'Saint-Martin-Terressus', 'Saint-Maurice-les-Brousses', 'Saint-Méard', 'Saint-Ouen-sur-Gartempe', 'Saint-Pardoux', 'Saint-Paul', 'Saint-Priest-Ligoure', 'Saint-Priest-Taurion', 'Saint-Sornin-Leulac', 'Saint-Sornin-la-Marche', 'Saint-Sulpice-Laurière', 'Saint-Sulpice-les-Feuilles', 'Saint-Sylvestre', 'Saint-Victurnien', 'Saint-Vitte-sur-Briance', 'Saint-Yrieix-la-Perche', 'Saint-Yrieix-sous-Aixe', 'Sainte-Anne-Saint-Priest', 'Sainte-Marie-de-Vaux', 'Saillat-sur-Vienne', 'Sauviat-sur-Vige', 'Séreilhac', 'Solignac', 'Surdoux', 'Sussac', 'Tersannes', 'Thiat', 'Thouron', 'Vaulry', 'Vayres', 'Verneuil-Moustiers', 'Verneuil-sur-Vienne', 'Veyrac', 'Vicq-sur-Breuilh', 'Videix', 'Villefavard'
  ];
  // Suppression des doublons par URL
  const uniqueArticles = [];
  const seenKeys = new Set();
  for (const a of articles) {
    const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Détection avancée des doublons : titre normalisé sans espaces ni ponctuation, date (jour), et source
    const cleanTitle = normalize(a.title || '').replace(/[^a-z0-9]/gi, '');
    const key = cleanTitle + '|' + normalize(a.publishedAt || '').slice(0,10) + '|' + normalize(a.source || '');
    if (!seenKeys.has(key)) {
      uniqueArticles.push(a);
      seenKeys.add(key);
    }
  }
  const filteredArticles = uniqueArticles.filter(a => {
    if (currentMonth && monthlyArticles[currentMonth]) {
      return monthlyArticles[currentMonth].some(m => m.url === a.url);
    }
    return true;
  }).filter(a => {
    // Filtre strict : au moins une ville du département dans les matches (normalisé)
    const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Filtre Haute-Vienne + election
    return a.matches &&
      a.matches.some(m => hauteVienneVilles.some(v => normalize(m) === normalize(v))) &&
      a.matches.some(m => normalize(m) === 'municipales');
  }).filter(a => {
    if (activeTag) {
      return a.matches && a.matches.some(m => m.toLowerCase() === activeTag.toLowerCase());
    }
    return true;
  }).sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  // ThemeToggle component: cycles through dark → cyberpunk → light
  function ThemeToggle() {
    const THEMES = ['dark','cyberpunk','light'];
    const [theme, setTheme] = React.useState('dark');

    // initialize from document/localStorage if available
    useEffect(() => {
      try {
        const current = typeof window !== 'undefined' && (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme'));
        if (current && THEMES.includes(current)) setTheme(current);
      } catch (e) { /* noop */ }
    }, []);

    // keep in sync if theme is changed elsewhere
    useEffect(() => {
      try {
        const docTheme = document.documentElement.getAttribute('data-theme');
        if (docTheme && THEMES.includes(docTheme) && docTheme !== theme) setTheme(docTheme);
      } catch (e) {}
    }, [theme]);

    const cycle = () => {
      const idx = THEMES.indexOf(theme);
      const newTheme = THEMES[(idx + 1) % THEMES.length];
      setTheme(newTheme);
      try { document.documentElement.setAttribute('data-theme', newTheme); localStorage.setItem('theme', newTheme); } catch(e){}
    };

    const icons = { dark: '☀️', cyberpunk: '⚡', light: '🌙' };
    const icon = icons[theme] || icons.dark;
    const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    const titleText = theme === 'dark' ? 'Passer en mode cyberpunk' : theme === 'cyberpunk' ? 'Passer en mode clair' : 'Passer en mode sombre';

    // Use the existing #theme-toggle CSS from public/styles.css (no inline styles)
    return (
      <button id="theme-toggle" aria-label={`Changer le thème — prochain: ${nextTheme}`} title={titleText} onClick={cycle}>
        <span className="icon">{icon}</span>
        Mode
      </button>
    );
  }

  return (
    <>
      <Head>
        <title>Municipales 2026 News V3</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#071021" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      <main>
        <h1>Municipales 2026 News V3 <span id="article-count">({filteredArticles.length})</span></h1>
        <p className="subtitle">Dernière mise à jour: <span id="updated">{updated}</span> • <small className="info">Articles ≤ 1 mois, triés du plus récent au moins récent</small></p>
        {/* Pagination par mois */}
        <div style={{ margin: '1em 0' }}>
          <button style={{marginRight: '0.5em', background: '#071021', color: '#fff', border: '1px solid #00f0ff', borderRadius: '4px', boxShadow: 'none'}} onClick={() => setCurrentMonth('')}>Tous les mois</button>
          {months.map(m => (
            <button
              key={m}
              onClick={() => setCurrentMonth(m)}
              style={{ marginRight: '0.5em', fontWeight: currentMonth === m ? 'bold' : undefined, background: '#071021', color: '#fff', border: '1px solid #00f0ff', borderRadius: '4px', boxShadow: 'none' }}
            >
              {m}
            </button>
          ))}
        </div>
        {/* Filtres par ville (listbox) + filtre Maudet */}
        <div style={{ margin: '1em 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label htmlFor="ville-select">Filtrer par ville&nbsp;:</label>
          <select
            id="ville-select"
            value={activeTag}
            onChange={e => {
              const val = e.target.value;
              setActiveTag(prev => (prev === val ? '' : val));
            }}
            style={{ background: '#071021', color: '#fff', border: '1px solid #00f0ff', borderRadius: '4px', boxShadow: 'none', padding: '0.45rem 0.6rem' }}
          >
            <option value="">Toutes les villes</option>
            {['Limoges', 'Saint-Junien', 'Panazol', 'Couzeix', 'Isle', 'Feytiat', 'Condat-sur-Vienne', 'Le Palais-sur-Vienne'].map(ville => (
              <option key={ville} value={ville}>{ville}</option>
            ))}
          </select>
          <button
            onClick={() => setActiveTag(prev => (prev === 'maudet' ? '' : 'maudet'))}
            aria-pressed={activeTag === 'maudet'}
            style={{ background: '#071021', color: '#fff', border: activeTag === 'maudet' ? '2px solid #ff2da6' : '2px solid red', borderRadius: '4px', boxShadow: 'none', padding: '0.45rem 0.85rem' }}
          >
            Filtrer Maudet
          </button>
          {/* Theme toggle component (client-side) */}
          <ThemeToggle />
          {activeTag && <button style={{ background: '#071021', color: '#fff', border: '1px solid #00f0ff', borderRadius: '4px', boxShadow: 'none', padding: '0.45rem 0.85rem' }} onClick={() => setActiveTag('')}>Réinitialiser le filtre</button>}
        </div>
        <div id="status">{status}</div>
        <ul id="articles">
          {filteredArticles.map((a, i) => (
            <li key={i} className="article" style={a.matches && a.matches.some(m => m.toLowerCase() === 'maudet') ? {border: '2px solid red', borderRadius: '6px', padding: '0.5em'} : {}}>
              <a className="title" href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
              <div className="meta">{a.source} — {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}</div>
              {a.matches && a.matches.length > 0 && (
                <div className="matches">
                  {a.matches.map(m => (
                    <span key={m} className="tag" style={{ fontWeight: m === a.primaryMatch ? 'bold' : undefined }}>{m}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
