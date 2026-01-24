export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="theme-color" content="#071021" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <title>Municipales 2026 News V2</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Roboto+Condensed:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#071021;
      --bg-accent: radial-gradient(circle at 20% 20%,rgba(0,240,255,0.1),transparent 35%),radial-gradient(circle at 80% 10%,rgba(255,45,166,0.1),transparent 30%),linear-gradient(180deg,#071021,#041018);
      --card: rgba(255,255,255,0.04);
      --muted: #9aa3b2;
      --neon-pink: #ff2da6;
      --neon-blue: #00f0ff;
      --title: #cce9ff;
      --neon-green: #9eff6b;
      --glass-border: rgba(255,255,255,0.06);
      --text: #e6f7ff;
      --desc: #dbeeff;
    }
    
    *{box-sizing:border-box}
    html,body{height:100%}
    body{font-family:system-ui,'Segoe UI',Roboto,Arial,sans-serif; color:var(--text); background:var(--bg-accent), var(--bg); margin:0; padding:1.5rem; transition: background .25s ease, color .2s ease}
    
    main{max-width:1100px;margin:0 auto;background:transparent;padding-bottom:4rem}
    #articles{padding-bottom:1rem}
    
    h1{
      margin:0 0 .5rem;
      font-family:Orbitron,monospace;
      color:#ff2da6;
      font-weight:700;
      letter-spacing:.5px;
      font-size:2rem;
      animation:none;
    }
    .subtitle{margin:.25rem 0 1.5rem;color:var(--muted);font-size:.95rem}
    
    .controls{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:1.5rem;padding:0.75rem 1rem;border:1px solid rgba(255,255,255,0.05);border-radius:10px;background:rgba(255,255,255,0.03)}
    .visually-hidden{position:absolute!important;height:1px;width:1px;overflow:hidden;clip:rect(1px,1px,1px,1px);white-space:nowrap;border:0;padding:0;margin:-1px}
    button{background:linear-gradient(120deg,#00f0ff,#ff2da6);color:#041018;border:0;padding:.55rem .9rem;border-radius:10px;cursor:pointer;font-weight:800;transition:transform .1s ease,box-shadow .1s ease;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:manipulation;box-shadow:0 10px 25px rgba(0,0,0,0.35)}
    @media (hover: hover){
      button:hover{box-shadow:0 12px 30px rgba(0,0,0,0.35);transform:translateY(-1px)}
    }
    
    button#filter-maudet.active{
      background:linear-gradient(120deg,#ff7acc,#ff2da6);
      box-shadow:0 12px 36px rgba(255,45,166,0.25);
    }
    button#filter-maudet.active:hover{
      box-shadow:0 15px 40px rgba(255,45,166,0.35);
      transform:translateY(-2px);
    }
    
    select{
      padding:.55rem .65rem;
      border-radius:8px;
      background:rgba(255,255,255,0.02);
      border:1px solid rgba(255,255,255,0.08);
      color:var(--text);
      min-width:160px;
      cursor:pointer;
      transition: border-color .15s ease,box-shadow .15s ease;
      -webkit-appearance:none;
      appearance:none;
      background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
      background-position: calc(100% - .8rem) calc(50% - 3px), calc(100% - .8rem) calc(50% + 3px);
      background-size: .4rem .4rem, .4rem .4rem;
      background-repeat:no-repeat;
    }
    select:focus{ border-color:#00f0ff; box-shadow:0 0 0 3px rgba(0,240,255,0.12); outline:none}
    
    select#filter-town{
      background: linear-gradient(90deg, rgba(11,92,255,0.04), rgba(255,45,166,0.02)), rgba(255,255,255,0.02);
      color:var(--text);
      padding-right:2.2rem;
      min-width:220px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,0.04);
    }
    select#filter-town option{
      padding:.5rem 1rem;
      background:var(--card);
      color:var(--text);
    }
    select#filter-town option:hover{ background:rgba(255,255,255,0.03); }
    
    .custom-listbox{ position:relative; display:inline-block; min-width:220px; }
    .custom-listbox .cb-selected{ display:flex; align-items:center; justify-content:space-between; width:100%; padding:.5rem .9rem; border-radius:10px; background:linear-gradient(90deg, rgba(11,92,255,0.06), rgba(255,45,166,0.03)); color:var(--text); border:1px solid rgba(255,255,255,0.04); cursor:pointer; box-shadow: 0 8px 30px rgba(11,92,255,0.06), inset 0 1px 0 rgba(255,255,255,0.02);}
    .custom-listbox .cb-selected:focus{ outline:none; box-shadow:0 12px 36px rgba(11,92,255,0.12); transform:translateY(-1px); }
    .custom-listbox .cb-selected .cb-arrow{ opacity:0.9; margin-left:.6rem; }
    .custom-listbox.open .cb-selected{ box-shadow:0 18px 60px rgba(255,45,166,0.06), 0 6px 30px rgba(11,92,255,0.06); }
    
    .custom-listbox .cb-options{ position:absolute; right:0; left:0; margin-top:.5rem; padding:.35rem; border-radius:10px; list-style:none; background:linear-gradient(180deg, rgba(3,15,30,0.96), rgba(7,16,33,0.98)); border:1px solid rgba(255,255,255,0.04); box-shadow:0 24px 60px rgba(0,0,0,0.7); z-index:1000; max-height:260px; overflow:auto; }
    .custom-listbox .cb-option{ padding:.6rem .8rem; margin:.2rem 0; border-radius:6px; color:var(--text); cursor:pointer; transition:background .12s ease, transform .08s ease; }
    .custom-listbox .cb-option:hover{ background:linear-gradient(90deg, rgba(255,45,166,0.06), rgba(0,240,255,0.03)); transform:translateY(-2px); box-shadow: 0 6px 18px rgba(255,45,166,0.04); }
    .custom-listbox .cb-option.selected{ background:linear-gradient(90deg,#ff2da6,#00f0ff); color:#071021; font-weight:700; box-shadow:0 12px 36px rgba(0,240,255,0.06), 0 8px 24px rgba(255,45,166,0.04); }
    .custom-listbox .cb-option[aria-selected='true']{ outline:2px solid rgba(11,92,255,0.08); }
    
    #status{color:var(--muted);margin-bottom:1rem}
    
    #articles{list-style:none;padding:0;margin:0;display:grid;gap:1rem}
    .article{position:relative; background: rgba(255,255,255,0.03); padding:1.1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.06); box-shadow:0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02); overflow:hidden; transition:transform .18s ease, box-shadow .18s ease}
    .article::before{content:'';position:absolute;left:-30%;top:-60%;width:160%;height:180%;background:linear-gradient(120deg, rgba(255,45,166,0.02), rgba(0,240,255,0.02)); transform:rotate(15deg); pointer-events:none}
    @media (hover: hover){
      .article:hover{transform:translateY(-6px); box-shadow:0 24px 50px rgba(0,0,0,0.5), 0 0 40px rgba(255,45,166,0.08)}
    }
    
    .article.maudet{ transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
    @media (hover: hover){
      .article.maudet:hover{ transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 80px rgba(255,59,59,0.12), 0 0 64px rgba(255,45,166,0.08); }
    }
    
    .title{font-weight:900;color:var(--title);text-decoration:none; font-size:1.05rem; text-shadow:0 0 6px rgba(115,164,255,0.06)}
    .title:hover{filter:brightness(1.06);text-decoration:underline}
    
    .meta{color:var(--muted);font-size:.86rem;margin:.35rem 0}
    .desc{margin:0;color:var(--desc)}
    
    .article .meta::before{content:'';display:inline-block;width:10px;height:10px;margin-right:.6rem;border-radius:3px;background:linear-gradient(90deg,#ff3b3b 0%,#39ff66 50%,#00f0ff 100%);box-shadow:0 0 8px rgba(255,59,59,0.06), 0 0 12px rgba(57,255,102,0.06), 0 0 18px rgba(0,240,255,0.06)}
    
    .article.maudet{border:2px solid #ff3b3b;border-left:4px solid #ff3b3b}
    .article.maudet .title{color:var(--neon-pink);text-shadow:0 0 8px rgba(255,45,166,0.1);}
    
    .matches{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.6rem}
    .tag{display:inline-block;padding:.3rem .7rem;background:linear-gradient(90deg,rgba(0,240,255,0.1),rgba(255,45,166,0.05));border:1px solid rgba(255,45,166,0.3);border-radius:6px;color:var(--muted);font-size:.8rem;font-weight:600;text-decoration:none;transition:all .15s ease;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:manipulation;cursor:pointer}
    @media (hover: hover){
      .tag:hover{filter:brightness(1.08);transform:translateY(-2px);box-shadow:0 6px 16px rgba(255,45,166,0.15);border-color:rgba(255,45,166,0.5)}
    }
    .tag.primary{outline:2px solid rgba(0,240,255,0.4);box-shadow:0 8px 22px rgba(0,240,255,0.12)}
    .tag.maudet{background: linear-gradient(90deg,#ff2da6,#ff7ab0); color: #071021; border:none; box-shadow:0 8px 24px rgba(255,45,166,0.2); font-weight:700}
    .tag.maudet:hover{box-shadow:0 10px 28px rgba(255,45,166,0.3)}
    .tag.removed{opacity:0.6;text-decoration:line-through}
    
    @media (max-width:480px){
      h1{font-size:1.3rem}
      .subtitle{font-size:.9rem}
      .toast{left:1rem;right:1rem;bottom:1rem;width:calc(100% - 2rem)}
      .banner{padding:.6rem .8rem;font-size:.95rem}
      .custom-listbox .cb-options{max-height:50vh}
      .matches{gap:.3rem}
    }
    
    .banner{display:none;padding:.6rem 1rem;border-radius:8px;background:linear-gradient(90deg,rgba(255,45,166,0.06),rgba(0,240,255,0.02));color:var(--text);border:1px solid rgba(0,240,255,0.12);margin-bottom:1rem;position:relative}
    .banner.visible{display:block}
    #newsapi-banner-text{font-weight:700}
    #newsapi-banner-close{position:absolute;right:.6rem;top:.5rem;border:0;background:transparent;color:var(--muted);cursor:pointer;font-weight:700;padding:.1rem .4rem}
    #newsapi-banner-close:hover{color:var(--neon-pink)}
    
    .toast{position:fixed;right:1rem;bottom:1rem;background:rgba(3,15,30,0.9);color:var(--text);padding:.6rem .9rem;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);opacity:0;transform:translateY(8px);transition:opacity .18s ease, transform .18s ease;z-index:9999}
    .toast.visible{opacity:1;transform:translateY(0)}
    
    .month-tabs{display:flex;gap:.4rem;margin-top:calc(1rem + 8px);margin-bottom:1.5rem;overflow-x:auto;padding-bottom:.5rem;flex-wrap:wrap}
    .month-tabs button{padding:.5rem 1rem;border:1px solid rgba(0,240,255,0.2);background:transparent;color:var(--muted);border-radius:6px;cursor:pointer;font-family:inherit;font-size:.9rem;transition:all .18s ease;white-space:nowrap}
    .month-tabs button:hover{border-color:rgba(0,240,255,0.5);color:var(--neon-blue)}
    .month-tabs button.active{background:linear-gradient(90deg,rgba(0,240,255,0.1),rgba(255,45,166,0.05));border-color:var(--neon-blue);color:var(--neon-blue);box-shadow:0 0 12px rgba(0,240,255,0.15)}
  </style>
</head>
<body>
  <main>
    <h1>Municipales 2026 News V2</h1>
    <p class="subtitle">Dernière mise à jour: <span id="updated">–</span> • <small class="info">Articles ≤ 1 mois, triés du plus récent au moins récent</small></p>

    <div id="month-tabs" class="month-tabs" role="tablist" aria-label="Filtrer par mois">
    </div>

    <div id="newsapi-banner" class="banner" role="status" aria-live="polite" hidden>
      <span id="newsapi-banner-text"></span>
      <button id="newsapi-banner-close" aria-label="Fermer">✖</button>
    </div>

    <div class="controls">
      <button id="refresh">🔄 Rafraîchir</button>
      <button id="filter-maudet" title="Mettre en évidence Maudet">🔎 Maudet</button>
      <label for="filter-town" class="visually-hidden">Filtrer par ville</label>
      <select id="filter-town" title="Filtrer par ville" aria-hidden="true" style="position:absolute;left:-9999px;top:auto;opacity:0;pointer-events:none;">
        <option value="">Toutes les villes</option>
        <option value="limoges">Limoges</option>
        <option value="saint-junien">Saint-Junien</option>
        <option value="panazol">Panazol</option>
        <option value="couzeix">Couzeix</option>
        <option value="isle">Isle</option>
        <option value="feytiat">Feytiat</option>
        <option value="condat-sur-vienne">Condat-sur-Vienne</option>
        <option value="le palais sur vienne">Le Palais-sur-Vienne</option>
      </select>

      <div id="custom-town-listbox" class="custom-listbox" role="listbox" tabindex="0" aria-label="Filtrer par ville">
        <button class="cb-selected" aria-haspopup="listbox" aria-expanded="false">Toutes les villes <span class="cb-arrow">▾</span></button>
        <ul class="cb-options" role="presentation" hidden></ul>
      </div>
      <div id="active-filter" class="active-filter" hidden></div>
    </div>
    <div id="status">Chargement des dernières news municipales (Limoges 2026)...</div>
    <ul id="articles"></ul>
  </main>

  <script src="/index.js"><\/script>
</body>
</html>`);
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
