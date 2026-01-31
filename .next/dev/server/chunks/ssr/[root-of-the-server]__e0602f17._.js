module.exports = [
"[project]/src/pages/index.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
;
;
;
function Home() {
    // États React pour les données dynamiques
    const [articles, setArticles] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState([]);
    const [monthlyArticles, setMonthlyArticles] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState({});
    const [months, setMonths] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState([]);
    const [currentMonth, setCurrentMonth] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState('');
    const [status, setStatus] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState('Chargement des dernières news municipales (Limoges 2026)...');
    const [updated, setUpdated] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState('–');
    const [articleCount, setArticleCount] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState(0);
    const [activeTag, setActiveTag] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState('');
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        fetch('/api/news?limit=200').then((res)=>res.json()).then((json)=>{
            setArticles(json.articles || []);
            setArticleCount((json.articles || []).length);
            setUpdated(new Date().toLocaleString());
            setStatus('');
            setMonthlyArticles(json.monthlyArticles || {});
            setMonths(json.months || []);
        }).catch(()=>setStatus('Impossible de charger les news.'));
    }, []);
    // Filtrage par mois et tag
    const hauteVienneVilles = [
        'Aixe-sur-Vienne',
        'Ambazac',
        'Arnac-la-Poste',
        'Augne',
        'Aureil',
        'Azat-le-Ris',
        'Balledent',
        'Beaumont-du-Lac',
        'Bellac',
        'Berneuil',
        'Bersac-sur-Rivalier',
        'Bessines-sur-Gartempe',
        'Beynac',
        'Blanzac',
        'Blond',
        'Boisseuil',
        'Bonnac-la-Côte',
        "Bosmie-l'Aiguille",
        'Breuilaufa',
        'Bujaleuf',
        'Burgnac',
        'Bussière-Boffy',
        'Bussière-Galant',
        'Bussière-Poitevine',
        'Châlus',
        'Chamboret',
        'Champagnac-la-Rivière',
        'Champnétery',
        'Champsac',
        'Chaptelat',
        'Château-Chervix',
        'Châteauneuf-la-Forêt',
        'Châteauponsac',
        'Le Châtenet-en-Dognon',
        'Cheissoux',
        'Chéronnac',
        'Cieux',
        'Cognac-la-Forêt',
        'Condat-sur-Vienne',
        'Coussac-Bonneval',
        'Couzeix',
        'Cromac',
        'Cussac',
        'Darnac',
        'Dinsac',
        'Domps',
        'Draix',
        'Eybouleuf',
        'Eyjeaux',
        'Eymoutiers',
        'Feytiat',
        'Flavignac',
        'Folles',
        'Fromental',
        'Gajoubert',
        'Glandon',
        'Glanges',
        'Gorre',
        'Janailhac',
        'Isle',
        'Jabreilles-les-Bordes',
        'Javerdat',
        'Jouac',
        'Jourgnac',
        'La Bazeuge',
        'La Chapelle-Montbrandeix',
        'La Croisille-sur-Briance',
        'La Genétouze',
        'La Jonchère-Saint-Maurice',
        'La Meyze',
        "La Roche-l'Abeille",
        'Laurière',
        'Lavignac',
        'Le Buis',
        'Le Chalard',
        'Le Dorat',
        'Le Grand-Bourg',
        'Le Palais-sur-Vienne',
        'Le Vigen',
        'Les Billanges',
        'Les Cars',
        'Les Grands-Chézeaux',
        'Limoges',
        'Linards',
        'Lussac-les-Églises',
        'Magnac-Bourg',
        'Magnac-Laval',
        'Mailhac-sur-Benaize',
        'Maisonnais-sur-Tardoire',
        'Marval',
        'Masléon',
        'Meilhac',
        'Meuzac',
        'Moissannes',
        'Montrol-Sénard',
        'Mortemart',
        'Nantiat',
        'Nedde',
        'Neuvic-Entier',
        'Nexon',
        'Nieul',
        'Nouic',
        'Oradour-Saint-Genest',
        'Oradour-sur-Glane',
        'Oradour-sur-Vayres',
        'Pageas',
        'Panazol',
        'Pensol',
        'Peyrat-de-Bellac',
        'Peyrat-le-Château',
        'Peyrilhac',
        'Pierre-Buffière',
        'La Porcherie',
        'Rancon',
        'Razès',
        'Rempnat',
        'Rilhac-Rancon',
        'Rilhac-Lastours',
        'Rochechouart',
        'Saint-Amand-Magnazeix',
        'Saint-Auvent',
        'Saint-Bazile',
        'Saint-Bonnet-Briance',
        'Saint-Bonnet-de-Bellac',
        'Saint-Brice-sur-Vienne',
        'Saint-Cyr',
        'Saint-Denis-des-Murs',
        'Saint-Gence',
        'Saint-Genest-sur-Roselle',
        'Saint-Georges-les-Landes',
        'Saint-Germain-les-Belles',
        'Saint-Gilles-les-Forêts',
        'Saint-Hilaire-Bonneval',
        'Saint-Hilaire-la-Treille',
        'Saint-Hilaire-les-Places',
        'Saint-Jean-Ligoure',
        'Saint-Jouvent',
        'Saint-Junien',
        'Saint-Junien-les-Combes',
        'Saint-Just-le-Martel',
        'Saint-Laurent-les-Églises',
        'Saint-Laurent-sur-Gorre',
        'Saint-Léger-la-Montagne',
        'Saint-Léger-Magnazeix',
        'Saint-Léonard-de-Noblat',
        'Saint-Martial-sur-Isop',
        'Saint-Martin-de-Jussac',
        'Saint-Martin-le-Mault',
        'Saint-Martin-le-Vieux',
        'Saint-Martin-Terressus',
        'Saint-Maurice-les-Brousses',
        'Saint-Méard',
        'Saint-Ouen-sur-Gartempe',
        'Saint-Pardoux',
        'Saint-Paul',
        'Saint-Priest-Ligoure',
        'Saint-Priest-Taurion',
        'Saint-Sornin-Leulac',
        'Saint-Sornin-la-Marche',
        'Saint-Sulpice-Laurière',
        'Saint-Sulpice-les-Feuilles',
        'Saint-Sylvestre',
        'Saint-Victurnien',
        'Saint-Vitte-sur-Briance',
        'Saint-Yrieix-la-Perche',
        'Saint-Yrieix-sous-Aixe',
        'Sainte-Anne-Saint-Priest',
        'Sainte-Marie-de-Vaux',
        'Saillat-sur-Vienne',
        'Sauviat-sur-Vige',
        'Séreilhac',
        'Solignac',
        'Surdoux',
        'Sussac',
        'Tersannes',
        'Thiat',
        'Thouron',
        'Vaulry',
        'Vayres',
        'Verneuil-Moustiers',
        'Verneuil-sur-Vienne',
        'Veyrac',
        'Vicq-sur-Breuilh',
        'Videix',
        'Villefavard'
    ];
    // Suppression des doublons par URL
    const uniqueArticles = [];
    const seenKeys = new Set();
    for (const a of articles){
        const normalize = (s)=>(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Détection avancée des doublons : titre normalisé sans espaces ni ponctuation, date (jour), et source
        const cleanTitle = normalize(a.title || '').replace(/[^a-z0-9]/gi, '');
        const key = cleanTitle + '|' + normalize(a.publishedAt || '').slice(0, 10) + '|' + normalize(a.source || '');
        if (!seenKeys.has(key)) {
            uniqueArticles.push(a);
            seenKeys.add(key);
        }
    }
    const filteredArticles = uniqueArticles.filter((a)=>{
        if (currentMonth && monthlyArticles[currentMonth]) {
            return monthlyArticles[currentMonth].some((m)=>m.url === a.url);
        }
        return true;
    }).filter((a)=>{
        // Filtre strict : au moins une ville du département dans les matches (normalisé)
        const normalize = (s)=>(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Filtre Haute-Vienne + election
        return a.matches && a.matches.some((m)=>hauteVienneVilles.some((v)=>normalize(m) === normalize(v))) && a.matches.some((m)=>normalize(m) === 'municipales');
    }).filter((a)=>{
        if (activeTag) {
            return a.matches && a.matches.some((m)=>m.toLowerCase() === activeTag.toLowerCase());
        }
        return true;
    }).sort((a, b)=>{
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
    });
    // ThemeToggle component: cycles through dark → cyberpunk → light
    function ThemeToggle() {
        const THEMES = [
            'dark',
            'cyberpunk',
            'light'
        ];
        const [theme, setTheme] = __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["default"].useState('dark');
        // initialize from document/localStorage if available
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
            try {
                const current = ("TURBOPACK compile-time value", "undefined") !== 'undefined' && (document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme'));
                if (current && THEMES.includes(current)) //TURBOPACK unreachable
                ;
            } catch (e) {}
        }, []);
        // keep in sync if theme is changed elsewhere
        (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
            try {
                const docTheme = document.documentElement.getAttribute('data-theme');
                if (docTheme && THEMES.includes(docTheme) && docTheme !== theme) setTheme(docTheme);
            } catch (e) {}
        }, [
            theme
        ]);
        const cycle = ()=>{
            const idx = THEMES.indexOf(theme);
            const newTheme = THEMES[(idx + 1) % THEMES.length];
            setTheme(newTheme);
            try {
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
            } catch (e) {}
        };
        const icons = {
            dark: '☀️',
            cyberpunk: '⚡',
            light: '🌙'
        };
        const icon = icons[theme] || icons.dark;
        const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        const titleText = theme === 'dark' ? 'Passer en mode cyberpunk' : theme === 'cyberpunk' ? 'Passer en mode clair' : 'Passer en mode sombre';
        // Use the existing #theme-toggle CSS from public/styles.css (no inline styles)
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
            id: "theme-toggle",
            "aria-label": `Changer le thème — prochain: ${nextTheme}`,
            title: titleText,
            onClick: cycle,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "icon",
                    children: icon
                }, void 0, false, {
                    fileName: "[project]/src/pages/index.tsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this),
                "Mode"
            ]
        }, void 0, true, {
            fileName: "[project]/src/pages/index.tsx",
            lineNumber: 118,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "Municipales 2026 News V3"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        charSet: "utf-8"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width,initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "theme-color",
                        content: "#071021"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 131,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "apple-mobile-web-app-capable",
                        content: "yes"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.tsx",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        children: [
                            "Municipales 2026 News V3 ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                id: "article-count",
                                children: [
                                    "(",
                                    filteredArticles.length,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 135,
                                columnNumber: 38
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: "subtitle",
                        children: [
                            "Dernière mise à jour: ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                id: "updated",
                                children: updated
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 136,
                                columnNumber: 55
                            }, this),
                            " • ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("small", {
                                className: "info",
                                children: "Articles ≤ 1 mois, triés du plus récent au moins récent"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 136,
                                columnNumber: 93
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 136,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            margin: '1em 0'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                style: {
                                    marginRight: '0.5em',
                                    background: '#071021',
                                    color: '#fff',
                                    border: '1px solid #00f0ff',
                                    borderRadius: '4px',
                                    boxShadow: 'none'
                                },
                                onClick: ()=>setCurrentMonth(''),
                                children: "Tous les mois"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 139,
                                columnNumber: 11
                            }, this),
                            months.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setCurrentMonth(m),
                                    style: {
                                        marginRight: '0.5em',
                                        fontWeight: currentMonth === m ? 'bold' : undefined,
                                        background: '#071021',
                                        color: '#fff',
                                        border: '1px solid #00f0ff',
                                        borderRadius: '4px',
                                        boxShadow: 'none'
                                    },
                                    children: m
                                }, m, false, {
                                    fileName: "[project]/src/pages/index.tsx",
                                    lineNumber: 141,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            margin: '1em 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                htmlFor: "ville-select",
                                children: "Filtrer par ville :"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                id: "ville-select",
                                value: activeTag,
                                onChange: (e)=>{
                                    const val = e.target.value;
                                    setActiveTag((prev)=>prev === val ? '' : val);
                                },
                                style: {
                                    background: '#071021',
                                    color: '#fff',
                                    border: '1px solid #00f0ff',
                                    borderRadius: '4px',
                                    boxShadow: 'none',
                                    padding: '0.45rem 0.6rem'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                        value: "",
                                        children: "Toutes les villes"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/index.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    [
                                        'Limoges',
                                        'Saint-Junien',
                                        'Panazol',
                                        'Couzeix',
                                        'Isle',
                                        'Feytiat',
                                        'Condat-sur-Vienne',
                                        'Le Palais-sur-Vienne'
                                    ].map((ville)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                            value: ville,
                                            children: ville
                                        }, ville, false, {
                                            fileName: "[project]/src/pages/index.tsx",
                                            lineNumber: 164,
                                            columnNumber: 15
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 153,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: ()=>setActiveTag((prev)=>prev === 'maudet' ? '' : 'maudet'),
                                "aria-pressed": activeTag === 'maudet',
                                style: {
                                    background: '#071021',
                                    color: '#fff',
                                    border: activeTag === 'maudet' ? '2px solid #ff2da6' : '2px solid red',
                                    borderRadius: '4px',
                                    boxShadow: 'none',
                                    padding: '0.45rem 0.85rem'
                                },
                                children: "Filtrer Maudet"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(ThemeToggle, {}, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 175,
                                columnNumber: 11
                            }, this),
                            activeTag && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                style: {
                                    background: '#071021',
                                    color: '#fff',
                                    border: '1px solid #00f0ff',
                                    borderRadius: '4px',
                                    boxShadow: 'none',
                                    padding: '0.45rem 0.85rem'
                                },
                                onClick: ()=>setActiveTag(''),
                                children: "Réinitialiser le filtre"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 176,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 151,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        id: "status",
                        children: status
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                        id: "articles",
                        children: filteredArticles.map((a, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                className: "article",
                                style: a.matches && a.matches.some((m)=>m.toLowerCase() === 'maudet') ? {
                                    border: '2px solid red',
                                    borderRadius: '6px',
                                    padding: '0.5em'
                                } : {},
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                        className: "title",
                                        href: a.url,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        children: a.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/index.tsx",
                                        lineNumber: 182,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "meta",
                                        children: [
                                            a.source,
                                            " — ",
                                            a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/index.tsx",
                                        lineNumber: 183,
                                        columnNumber: 15
                                    }, this),
                                    a.matches && a.matches.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "matches",
                                        children: a.matches.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "tag",
                                                style: {
                                                    fontWeight: m === a.primaryMatch ? 'bold' : undefined
                                                },
                                                children: m
                                            }, m, false, {
                                                fileName: "[project]/src/pages/index.tsx",
                                                lineNumber: 187,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/index.tsx",
                                        lineNumber: 185,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, i, true, {
                                fileName: "[project]/src/pages/index.tsx",
                                lineNumber: 181,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.tsx",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e0602f17._.js.map