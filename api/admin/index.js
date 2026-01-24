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
  <link rel="stylesheet" href="/admin.css" />
</head>
<body>
  <main class="admin">
    <h1>🔧 Gestion des flux RSS</h1>
    <div class="controls">
      <button id="refresh">🔄 Rafraîchir</button>
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

    <div class="notes">Note: si vous avez défini <code>ADMIN_TOKEN</code> dans votre \`.env\`, renseignez le token ci-dessus et cliquez sur <em>Rafraîchir</em>.</div>
  </main>

  <script src="/admin.js"><\/script>
</body>
</html>`);
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
