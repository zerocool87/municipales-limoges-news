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
    const html = `<!doctype html>
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
    button{background:linear-gradient(120deg,#00f0ff,#ff2da6);color:#041018;border:0;padding:.55rem .9rem;border-radius:10px;cursor:pointer;font-weight:800;transition:transform .1s ease,box-shadow .1s ease;box-shadow:0 10px 25px rgba(0,0,0,0.35)}
    @media (hover: hover){
      button:hover{box-shadow:0 12px 30px rgba(0,0,0,0.35);transform:translateY(-1px)}
    }
    
    #status{color:var(--muted);margin-bottom:1rem}
    
    #articles{list-style:none;padding:0;margin:0;display:grid;gap:1rem}
    .article{position:relative; background: rgba(255,255,255,0.03); padding:1.1rem;border-radius:12px;border:1px solid rgba(255,255,255,0.06); box-shadow:0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02); overflow:hidden; transition:transform .18s ease, box-shadow .18s ease}
    .article::before{content:'';position:absolute;left:-30%;top:-60%;width:160%;height:180%;background:linear-gradient(120deg, rgba(255,45,166,0.02), rgba(0,240,255,0.02)); transform:rotate(15deg); pointer-events:none}
    @media (hover: hover){
      .article:hover{transform:translateY(-6px); box-shadow:0 24px 50px rgba(0,0,0,0.5), 0 0 40px rgba(255,45,166,0.08)}
    }
    
    .title{font-weight:900;color:var(--title);text-decoration:none; font-size:1.05rem; text-shadow:0 0 6px rgba(115,164,255,0.06)}
    .title:hover{filter:brightness(1.06);text-decoration:underline}
    
    .meta{color:var(--muted);font-size:.86rem;margin:.35rem 0}
    .desc{margin:0;color:var(--desc)}
    
    .article .meta::before{content:'';display:inline-block;width:10px;height:10px;margin-right:.6rem;border-radius:3px;background:linear-gradient(90deg,#ff3b3b 0%,#39ff66 50%,#00f0ff 100%);box-shadow:0 0 8px rgba(255,59,59,0.06), 0 0 12px rgba(57,255,102,0.06), 0 0 18px rgba(0,240,255,0.06)}
    
    .toast{position:fixed;right:1rem;bottom:1rem;background:rgba(3,15,30,0.9);color:var(--text);padding:.6rem .9rem;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);opacity:0;transform:translateY(8px);transition:opacity .18s ease, transform .18s ease;z-index:9999}
    .toast.visible{opacity:1;transform:translateY(0)}
    
    @media (max-width:480px){
      h1{font-size:1.3rem}
      .subtitle{font-size:.9rem}
    }
  </style>
</head>
<body>
  <main>
    <h1>Municipales 2026 News V2</h1>
    <p class="subtitle">Dernière mise à jour: <span id="updated">–</span></p>

    <div class="controls">
      <button id="refresh">🔄 Rafraîchir</button>
    </div>
    <div id="status">Chargement des dernières news municipales (Limoges 2026)...</div>
    <ul id="articles"></ul>
  </main>

  <script>
    const statusEl = document.getElementById('status');
    const articlesEl = document.getElementById('articles');
    const updatedEl = document.getElementById('updated');
    const refreshBtn = document.getElementById('refresh');

    function showToast(msg, timeout) {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('visible'), 10);
      setTimeout(() => {
        t.classList.remove('visible');
        setTimeout(() => t.remove(), 400);
      }, timeout || 3000);
    }

    async function loadNews(opts) {
      const notify = opts && opts.notify;
      statusEl.textContent = 'Chargement...';
      articlesEl.innerHTML = '';

      try {
        const resp = await fetch('/api/news');
        if (!resp.ok) {
          throw new Error('HTTP ' + resp.status);
        }

        const data = await resp.json();
        if (!data.articles || !Array.isArray(data.articles)) {
          throw new Error('Invalid response format');
        }

        updatedEl.textContent = new Date().toLocaleString('fr-FR');
        
        if (data.articles.length === 0) {
          statusEl.textContent = 'Aucun article trouvé';
          return;
        }

        statusEl.textContent = data.articles.length + ' articles chargés';
        renderArticles(data.articles);
        
        if (notify) {
          showToast(data.articles.length + ' articles chargés');
        }
      } catch (e) {
        statusEl.textContent = 'Erreur: ' + e.message;
        console.error('loadNews failed:', e);
        if (notify) {
          showToast('Erreur: ' + e.message, 5000);
        }
      }
    }

    function renderArticles(articles) {
      articlesEl.innerHTML = articles.map(function(article) {
        return '<li class="article">' +
          '<a href="' + escapeHTML(article.url) + '" target="_blank" rel="noopener noreferrer" class="title">' +
          escapeHTML(article.title) +
          '</a>' +
          '<div class="meta">' +
          escapeHTML(article.source) + ' • ' + new Date(article.publishedAt).toLocaleDateString('fr-FR') +
          '</div>' +
          (article.description ? '<p class="desc">' + escapeHTML(article.description) + '</p>' : '') +
          '</li>';
      }).join('');
    }

    function escapeHTML(str) {
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return (str || '').replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', function() {
        loadNews({ notify: true });
      });
    }

    document.addEventListener('DOMContentLoaded', function() {
      loadNews();
    });

    setInterval(function() {
      loadNews();
    }, 5 * 60 * 1000);
  </script>
</body>
</html>`;
    return res.status(200).send(html);
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};

