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
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connexion administrateur</title>
  <style>
    :root{
      --bg-top:#0b1226;
      --bg-bottom:#050a14;
      --card:#0f172a;
      --card-border:rgba(255,255,255,0.06);
      --accent:#00f0ff;
      --accent-strong:#ff2da6;
      --text:#e8f4ff;
      --muted:#9aa3b2;
      --shadow:0 20px 50px rgba(0,0,0,0.45);
    }
    
    body{
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(145deg,var(--bg-top),var(--bg-bottom));
      font-family:system-ui,"Segoe UI",Roboto,Arial,sans-serif;
      color:var(--text);
      padding:1.5rem;
    }
    
    .login-card{
      width:min(400px, 92vw);
      background:var(--card);
      border:1px solid var(--card-border);
      border-radius:16px;
      padding:1.75rem;
      box-shadow:var(--shadow);
    }
    
    .login-header h1{
      margin:0.15rem 0 0.35rem;
      font-size:1.6rem;
      letter-spacing:0.01em;
    }
    
    .login-header .eyebrow{
      margin:0;
      text-transform:uppercase;
      letter-spacing:0.08em;
      font-size:0.75rem;
      color:var(--accent);
      font-weight:700;
    }
    
    .login-header .lead{
      margin:0;
      color:var(--muted);
      font-size:0.95rem;
    }
    
    .login-form{
      margin-top:1.25rem;
      display:flex;
      flex-direction:column;
      gap:0.9rem;
    }
    
    .login-form label{
      display:block;
      font-weight:600;
      margin-bottom:0.35rem;
    }
    
    .login-form input{
      width:100%;
      padding:0.65rem 0.75rem;
      border-radius:10px;
      border:1px solid var(--card-border);
      background:rgba(255,255,255,0.04);
      color:var(--text);
      font-size:1rem;
      transition:border-color 0.15s ease, box-shadow 0.15s ease;
      box-sizing:border-box;
    }
    
    .login-form input:focus{
      outline:none;
      border-color:var(--accent);
      box-shadow:0 0 0 3px rgba(0,240,255,0.14);
    }
    
    .login-form button{
      margin-top:0.35rem;
      width:100%;
      padding:0.75rem 0.85rem;
      border-radius:12px;
      border:0;
      background:linear-gradient(120deg,var(--accent),var(--accent-strong));
      color:#041018;
      font-weight:800;
      font-size:1rem;
      letter-spacing:0.01em;
      cursor:pointer;
      transition:transform 0.12s ease, box-shadow 0.12s ease;
    }
    
    .login-form button:hover{
      transform:translateY(-1px);
      box-shadow:0 12px 30px rgba(0,0,0,0.35);
    }
    
    .helper{
      margin:1rem 0 0;
      color:var(--muted);
      font-size:0.9rem;
      text-align:center;
    }
    
    @media (max-width:540px){
      .login-card{padding:1.25rem;border-radius:12px}
      .login-header h1{font-size:1.4rem}
    }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="login-header">
      <p class="eyebrow">Accès admin</p>
      <h1>Connexion</h1>
      <p class="lead">Identifiez-vous pour gérer les flux.</p>
    </div>
    <form class="login-form" action="/admin/login" method="POST">
      <div>
        <label for="username">Nom d'utilisateur ou e-mail</label>
        <input id="username" name="username" type="text" autocomplete="username" required>
      </div>
      <div>
        <label for="password">Mot de passe</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required>
      </div>
      <button type="submit">Se connecter</button>
    </form>
    <p id="login-status" class="helper">Besoin d'aide ? Contactez l'administrateur.</p>
  </div>

  <script>
    const form = document.querySelector('.login-form');
    const statusEl = document.getElementById('login-status');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      statusEl.textContent = 'Connexion en cours...';
      submitBtn.disabled = true;
      try {
        const res = await fetch('/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Échec de connexion');
        // Save JWT token from response
        if(data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        statusEl.textContent = 'Connexion réussie, redirection...';
        window.location.href = '/admin.html';
      } catch (err) {
        statusEl.textContent = err.message || 'Erreur inconnue';
      } finally {
        submitBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`);
  }

  res.status(405).json({ ok: false, error: 'Method not allowed' });
};
