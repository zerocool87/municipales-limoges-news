const statusEl = document.getElementById('status');
const articlesEl = document.getElementById('articles');
const updatedEl = document.getElementById('updated');
const refreshBtn = document.getElementById('refresh');

function showToast(msg, timeout = 3000){
  try{
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('visible'), 10);
    setTimeout(()=>{ t.classList.remove('visible'); setTimeout(()=> t.remove(), 400); }, timeout);
  }catch(e){ console.warn('showToast failed', e && e.message ? e.message : e); }
}

async function loadNews(opts = {}) {
  const notify = opts.notify === true;
  statusEl.textContent = 'Chargement…';
  articlesEl.innerHTML = '';

  try {
    const url = '/api/news' + (opts.debug ? '?debug=true' : '');
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      throw new Error(error.error || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    // Accept either an array (legacy) or the current object shape { articles, months, debug }
    const payload = Array.isArray(data) ? { articles: data, count: data.length } : data;

    updatedEl.textContent = new Date().toLocaleString('fr-FR');
    
    if (!payload.articles || payload.articles.length === 0) {
      statusEl.textContent = 'Aucun article trouvé';
      return;
    }

    statusEl.textContent = `${payload.articles.length} articles chargés`;
    if (opts.debug && payload.debug && payload.debug.rejected){ console.table(payload.debug.rejected); }
    populateTowns(payload.articles || []);
    renderArticles(payload.articles);
    
    if (notify) {
      showToast(`${payload.articles.length} articles chargés`);
    }
  } catch (e) {
    statusEl.textContent = `Erreur: ${e.message || String(e)}`;
    console.error('loadNews failed:', e);
    if (notify) {
      showToast(`Erreur: ${e.message || String(e)}`, 5000);
    }
  }
}

function renderArticles(articles) {
  articlesEl.innerHTML = articles.map(article => `
    <li class="article">
      <a href="${escapeHTML(article.url)}" target="_blank" rel="noopener noreferrer" class="title">
        ${escapeHTML(article.title)}
      </a>
      <div class="meta">
        ${escapeHTML(article.source)} • ${new Date(article.publishedAt || article.pubDate || article.publishedAt).toLocaleDateString('fr-FR')}
      </div>
    </li>
  `).join('');
}

function escapeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return (str || '').replace(/[&<>"']/g, m => map[m]);
}

// Returns true when both strings are equal after trimming, collapsing whitespace and lowercasing
function isDuplicate(a, b) {
  const normalize = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return normalize(a) === normalize(b);
}

// Populate town select dynamically from server-provided town list & current articles
async function populateTowns(articles){
  try{
    const res = await fetch('/api/towns');
    if(!res.ok) return;
    const json = await res.json();
    const towns = (json.towns || []).map(t => (t||'').toLowerCase());
    const obs = new Set();
    const normalize = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    for(const a of articles){
      const text = (a.title || '') + ' ' + (a.description || '');
      const ntext = normalize(text);
      for(const t of towns){ if (ntext.includes(normalize(t))) obs.add(t); }
      // also check matches
      for(const m of (a.matches||[])){
        const nm = normalize(m);
        for(const t of towns){ if (nm === normalize(t) || nm.includes(normalize(t))) obs.add(t); }
      }
    }
    // Ensure specific town is available in the listbox if the server provides it
    if (towns.includes('le palais sur vienne')) obs.add('le palais sur vienne');

    const select = document.getElementById('filter-town');
    if(!select) return;
    const prev = select.value || '';
    select.innerHTML = '<option value="">Toutes les villes</option>' + [...obs].sort().map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t.charAt(0).toUpperCase()+t.slice(1))}</option>`).join('');
    if(prev) select.value = prev;
  }catch(e){ console.warn('populateTowns failed', e && e.message ? e.message : e); }
}

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => loadNews({ notify: true }));
}

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
});

// Auto-refresh every 5 minutes
setInterval(() => loadNews(), 5 * 60 * 1000);
