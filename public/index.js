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
    const resp = await fetch('/api/news', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
      throw new Error(error.error || `HTTP ${resp.status}`);
    }

    const data = await resp.json();
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format');
    }

    updatedEl.textContent = new Date().toLocaleString('fr-FR');
    
    if (data.length === 0) {
      statusEl.textContent = 'Aucun article trouvé';
      return;
    }

    statusEl.textContent = `${data.length} articles chargés`;
    renderArticles(data);
    
    if (notify) {
      showToast(`${data.length} articles chargés`);
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
        ${escapeHTML(article.source)} • ${new Date(article.pubDate).toLocaleDateString('fr-FR')}
      </div>
      ${article.description ? `<p class="desc">${escapeHTML(article.description)}</p>` : ''}
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

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => loadNews({ notify: true }));
}

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
});

// Auto-refresh every 5 minutes
setInterval(() => loadNews(), 5 * 60 * 1000);
