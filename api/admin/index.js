import { verifyJWT } from '../lib/auth.js';

export default async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Check JWT authentication for security
    const user = verifyJWT(req);
    if (!user) {
      // Redirect to login if not authenticated
      res.setHeader('Location', '/login');
      return res.status(302).end();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Admin feeds — AI News</title>
  <style>
    body{font-family:system-ui,Segoe UI,Roboto,Arial;background:radial-gradient(circle at 20% 20%,rgba(0,240,255,0.08),transparent 35%),radial-gradient(circle at 80% 10%,rgba(255,45,166,0.08),transparent 30%),linear-gradient(180deg,#071021,#041018);color:#e6f7ff;padding:1.5rem;margin:0}
    .admin{max-width:1100px;margin:0 auto}
    h1{font-family:Orbitron,monospace;color:#ff2da6;margin-bottom:.5rem}
    .controls{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center;margin-bottom:1rem;padding:0.75rem 1rem;border:1px solid rgba(255,255,255,0.05);border-radius:10px;background:rgba(255,255,255,0.03)}
    .controls label{display:flex;align-items:center;gap:.5rem;font-weight:600;color:#cfe6ff}
    .controls input{min-width:240px}
    input{padding:.55rem .65rem;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);color:var(--text,#e6f7ff);width:100%}
    input:focus{outline:none;border-color:#00f0ff;box-shadow:0 0 0 3px rgba(0,240,255,0.12)}
    button{padding:.55rem .9rem;border-radius:10px;border:0;background:linear-gradient(120deg,#00f0ff,#ff2da6);color:#041018;font-weight:800;cursor:pointer;transition:transform .1s ease,box-shadow .1s ease}
    button:hover{transform:translateY(-1px);box-shadow:0 10px 25px rgba(0,0,0,0.35)}
    button:disabled{opacity:.6;cursor:not-allowed;box-shadow:none;transform:none}
    
    .panel{background:rgba(255,255,255,0.04);padding:1.1rem;border-radius:12px;margin-top:1rem;border:1px solid rgba(255,255,255,0.06);box-shadow:0 18px 40px rgba(0,0,0,0.25)}
    .panel h2{margin-top:0;margin-bottom:.75rem;color:#cce9ff}
    .form{display:grid;grid-template-columns:2fr 1fr auto;gap:.6rem;align-items:center}
    .form button{width:100%;height:100%}
    
    #feeds-list li, #blacklisted-list li{
      display:flex;
      gap:1rem;
      align-items:flex-start;
      padding:0.9rem;
      border-bottom:1px dashed rgba(255,255,255,0.05);
      background:rgba(255,255,255,0.02);
      border-radius:10px;
      margin-bottom:.6rem;
    }
    
    #feeds-list li > div:first-child, #blacklisted-list li > div:first-child{
      flex:1 1 auto;
      min-width:0;
    }
    #feeds-list li strong{display:block;font-size:1.05rem;color:#fff}
    #feeds-list li small{display:block;color:#9aa3b2;font-size:.92rem;word-break:break-all;margin-top:0.25rem}
    
    .feed-actions{
      display:flex;
      gap:.5rem;
      align-items:center;
      margin-left:0;
    }
    .feed-actions button{background:transparent;position:relative;color:#ff7acc;border:1px solid rgba(255,45,166,0.28);padding:.38rem .7rem;border-radius:8px;font-size:.9rem;font-weight:700}
    .feed-actions button:hover{background:rgba(255,45,166,0.08)}
    
    .edit-form{display:grid;grid-template-columns:1.1fr 1.4fr auto auto;gap:.45rem;margin-top:.6rem}
    .edit-form input{width:100%}
    
    .msg{color:#9aa3b2;margin-top:.5rem}
    
    .feed-sample{margin-top:.6rem;padding:.85rem;border-radius:10px;background:rgba(255,255,255,0.03);font-size:.95rem;border:1px solid rgba(255,255,255,0.04)}
    .feed-sample .item{margin-bottom:.6rem}
    .feed-sample .item a{color:#e8f7ff;text-decoration:none;font-weight:600}
    .feed-sample .item a:hover{text-decoration:underline;color:#00f0ff}
    .feed-sample .mini-tag{display:inline-block;margin-left:.35rem;padding:.18rem .45rem;border-radius:6px;background:rgba(0,240,255,0.12);color:#00f0ff;font-weight:700;font-size:.82rem}
    
    pre{background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.05);padding:.8rem;border-radius:10px;overflow:auto}
    .notes{margin-top:1rem;color:#9aa3b2;font-size:.95rem}
    
    @media (max-width:900px){
      .form{grid-template-columns:1fr;}
      .form button{width:100%}
      .edit-form{grid-template-columns:1fr;}
    }
    @media (max-width:720px){
      #feeds-list li, #blacklisted-list li{flex-direction:column;align-items:stretch}
      .feed-actions{justify-content:flex-start;flex-wrap:wrap}
      .feed-actions button{font-size:.85rem;padding:.4rem .6rem}
    }
  </style>
</head>
<body>
  <main class="admin">
    <h1>🔧 Gestion des flux RSS</h1>
    <div class="controls">
      <button id="refresh">🔄 Rafraîchir</button>
      <button id="cleanup">🧹 Nettoyer descriptions</button>
      <button id="logout">🚪 Déconnexion</button>
    </div>

    <section class="panel">
      <h2>Ajouter un flux</h2>
      <div class="form">
        <input id="add-url" placeholder="URL du flux (ex: https://exemple.com/rss)" />
        <input id="add-name" placeholder="Nom (optionnel)" />
        <button id="add-btn">Ajouter</button>
      </div>
      <div id="add-msg" class="msg"></div>
    </section>

    <section class="panel">
      <h2>Feeds</h2>
      <ul id="feeds-list"></ul>
    </section>

    <section class="panel">
      <h2>Blacklisted</h2>
      <ul id="blacklisted-list"></ul>
    </section>

    <section class="panel">
      <h2>Failures</h2>
      <pre id="failures"></pre>
    </section>

    <section class="panel">
      <h2>Alternatives</h2>
      <pre id="alternatives"></pre>
    </section>
    <section class="panel">
      <h2>Historique des nettoyages</h2>
      <div style="display:flex;gap:.6rem;align-items:center;margin-bottom:.6rem"><button id="refresh-logs">🔁 Rafraîchir</button><button id="run-cleanup">🧹 Nettoyer maintenant</button></div>
      <pre id="cleanup-logs" style="max-height:320px;overflow:auto;padding:.8rem;border-radius:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.04)"></pre>
    </section>
    <div class="notes">Note: si vous avez défini <code>ADMIN_TOKEN</code> dans votre \`.env\`, renseignez le token ci-dessus et cliquez sur <em>Rafraîchir</em>.</div>
  </main>

  <script src="/admin.js"><\/script>
  <script>
    (function(){
      const cleanupBtn = document.getElementById('cleanup');
      const msgEl = document.getElementById('add-msg');
      const logsEl = document.getElementById('cleanup-logs');
      const refreshLogsBtn = document.getElementById('refresh-logs');
      const runNowBtn = document.getElementById('run-cleanup');

      async function loadLogs(){
        if(!logsEl) return;
        logsEl.textContent = 'Chargement...';
        try{
          const res = await fetch('/admin/cleanup-logs', { credentials: 'same-origin' });
          const data = await res.json().catch(()=>({}));
          if(!res.ok) { logsEl.textContent = 'Erreur: '+(data.error||res.status); return; }
          if(!data.logs || !data.logs.length){ logsEl.textContent = 'Aucun historique.'; return; }
          logsEl.textContent = data.logs.map(l=>`${l.ts} — ${l.user} — ${l.changedCount} fichiers modifiés\n${JSON.stringify(l.results,null,2)}`).join('\n\n');
        }catch(e){ logsEl.textContent = 'Erreur: '+(e && e.message ? e.message : String(e)); }
      }

      if(refreshLogsBtn) refreshLogsBtn.addEventListener('click', loadLogs);

      if(runNowBtn){
        runNowBtn.addEventListener('click', async function(){
          if(!confirm('Exécuter le nettoyage des descriptions dans le dossier data ?')) return;
          runNowBtn.disabled = true; runNowBtn.textContent = 'Nettoyage...';
          try{
            const res = await fetch('/admin/cleanup-descriptions', { method: 'POST', credentials: 'same-origin' });
            const data = await res.json().catch(()=>({}));
            if(!res.ok) { alert('Erreur: '+(data.error||res.status)); return; }
            alert('Nettoyé: '+(data.changedCount||0)+' fichier(s) modifié(s).');
            loadLogs();
          }catch(e){ alert('Erreur: '+(e && e.message ? e.message : String(e))); }
          finally{ runNowBtn.disabled = false; runNowBtn.textContent = '🧹 Nettoyer maintenant'; }
        });
      }

      if(cleanupBtn){
        cleanupBtn.addEventListener('click', async function(){
          if(!confirm('Exécuter le nettoyage des descriptions dans le dossier data ?')) return;
          msgEl.textContent = 'Nettoyage en cours...';
          cleanupBtn.disabled = true;
          try{
            const res = await fetch('/admin/cleanup-descriptions', { method: 'POST', credentials: 'same-origin' });
            const data = await res.json().catch(()=>({}));
            if(!res.ok) { msgEl.textContent = 'Erreur: ' + (data.error || res.status); return; }
            const changed = (data.results || []).filter(r=>r.changed).length;
            msgEl.textContent = `Nettoyé: ${changed} fichier(s) modifié(s).`;
            loadLogs();
          }catch(e){ msgEl.textContent = 'Erreur: ' + (e && e.message ? e.message : String(e)); }
          finally{ cleanupBtn.disabled = false; }
        });
      }

      // auto-load on open
      document.addEventListener('DOMContentLoaded', loadLogs);
    })();
  <\/script>
</body>
</html>`;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
