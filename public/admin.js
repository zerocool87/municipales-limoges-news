async function api(path, method='GET', body){
  const token = document.getElementById('token').value;
  // Save token to localStorage for persistence
  if(token) localStorage.setItem('adminToken', token);
  const headers = { 'Accept': 'application/json' };
  if(token) headers['x-admin-token'] = token;
  if(body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if(!res.ok) {
    let errorMsg = 'HTTP '+res.status;
    try {
      const json = await res.json();
      if(json.error) errorMsg += ': ' + json.error;
    } catch(e) {}
    throw new Error(errorMsg);
  }
  return res.json();
}

async function refresh(){
  try{
    const data = await api('/admin/feeds');
    renderFeeds(data.feeds || []);
    renderBlacklisted(data.blacklisted || []);
    document.getElementById('failures').textContent = JSON.stringify(data.failures || {}, null, 2);
    document.getElementById('alternatives').textContent = JSON.stringify(data.alternatives || {}, null, 2);
  }catch(e){
    alert('Erreur: '+e.message);
  }
}

function renderFeeds(feeds){
  const el = document.getElementById('feeds-list'); el.innerHTML = '';
  feeds.forEach(f => {
    const li = document.createElement('li');
    const info = document.createElement('div');
    const nameEl = document.createElement('strong');
    nameEl.textContent = f.name || 'feed';
    const urlEl = document.createElement('small');
    urlEl.textContent = f.url;
    info.appendChild(nameEl);
    info.appendChild(document.createElement('br'));
    info.appendChild(urlEl);
    li.appendChild(info);

    const actions = document.createElement('div'); actions.className='feed-actions';

    // placeholder for test results
    const sample = document.createElement('div'); sample.className = 'feed-sample'; sample.style.display = 'none';

    const testBtn = document.createElement('button'); testBtn.textContent='Tester';
    testBtn.onclick = async ()=>{ 
      // toggle off if already visible
      if(sample.style.display !== 'none'){
        sample.style.display = 'none';
        sample.innerHTML = '';
        return;
      }
      testBtn.disabled = true; testBtn.textContent = 'Test en cours...';
      sample.style.display = 'block';
      sample.textContent = 'Test en cours...';
      try{ const r = await api('/admin/feeds/test','POST',{ url: f.url }); renderFeedSample(li, r.items || []); }catch(e){ sample.innerHTML=''; alert('Erreur: '+e.message); }
      testBtn.disabled = false; testBtn.textContent = 'Tester';
    };

    const editBtn = document.createElement('button'); editBtn.textContent='Editer';
    editBtn.onclick = ()=>{
      const existing = li.querySelector('.edit-form');
      if(existing){ existing.remove(); return; }
      const form = document.createElement('div');
      form.className = 'edit-form';

      const nameInput = document.createElement('input');
      nameInput.value = f.name || '';
      nameInput.placeholder = 'Nom du flux';

      const urlInput = document.createElement('input');
      urlInput.value = f.url;
      urlInput.placeholder = 'URL du flux';

      const saveBtn = document.createElement('button'); saveBtn.textContent = 'Sauver';
      const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Annuler';
      cancelBtn.type = 'button';
      saveBtn.type = 'button';

      saveBtn.onclick = async ()=>{
        const newName = nameInput.value.trim();
        const newUrl = urlInput.value.trim();
        try{
          await api('/admin/feeds/update','POST',{ url: f.url, name: newName, newUrl });
          li.removeChild(form);
          refresh();
        }catch(e){ alert('Erreur: '+e.message); }
      };

      cancelBtn.onclick = ()=>{ li.removeChild(form); };

      form.appendChild(nameInput);
      form.appendChild(urlInput);
      form.appendChild(saveBtn);
      form.appendChild(cancelBtn);
      // afficher juste sous le bloc titre/url
      li.insertBefore(form, actions);
      nameInput.focus();
    };

    const removeBtn = document.createElement('button'); removeBtn.textContent='Supprimer';
    removeBtn.onclick = async ()=>{ if(!confirm('Supprimer?')) return; await api('/admin/feeds/remove','POST',{ url: f.url }); refresh(); };

    actions.appendChild(testBtn);
    actions.appendChild(editBtn);
    actions.appendChild(removeBtn);

    li.appendChild(actions);

    li.appendChild(sample);

    el.appendChild(li);
  });
}

function renderFeedSample(li, items){
  const sample = li.querySelector('.feed-sample');
  if(!sample) return;
  sample.style.display = 'block';
  if(!items || items.length === 0){ sample.innerHTML = '<em>Aucun item retourné</em>'; return; }
  const html = items.map(it => `<div class="item"><a href="${escapeHtml(it.url)}" target="_blank">${escapeHtml(it.title)}</a> <div class="meta">${escapeHtml(it.publishedAt || '')}</div><div class="matches">${(it.matches||[]).map(m=>`<span class="mini-tag">${escapeHtml(m)}</span>`).join(' ')}</div></div>`).join('');
  sample.innerHTML = html;
}

function renderBlacklisted(list){
  const el = document.getElementById('blacklisted-list'); el.innerHTML = '';
  list.forEach(u=>{
    const li = document.createElement('li');
    li.innerHTML = `<div>${escapeHtml(u)}</div>`;
    const actions = document.createElement('div'); actions.className='feed-actions';
    const unBtn = document.createElement('button'); unBtn.textContent='Unblacklist';
    unBtn.onclick = async ()=>{ await api('/admin/feeds/unblacklist','POST',{ url: u }); refresh(); };
    actions.appendChild(unBtn);
    li.appendChild(actions);
    el.appendChild(li);
  });
}

async function addFeed(){
  const url = document.getElementById('add-url').value.trim();
  const name = document.getElementById('add-name').value.trim();
  const msg = document.getElementById('add-msg'); msg.textContent='';
  if(!url){ msg.textContent='URL requise'; return; }
  try{
    await api('/admin/feeds/add','POST',{ url, name });
    msg.textContent='Ajouté.'; document.getElementById('add-url').value=''; document.getElementById('add-name').value='';
    refresh();
  }catch(e){ msg.textContent='Erreur: '+e.message }
}

function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// init
document.getElementById('refresh').addEventListener('click', refresh);
document.getElementById('add-btn').addEventListener('click', addFeed);
window.addEventListener('load', () => {
  const saved = localStorage.getItem('adminToken');
  if(saved){
    document.getElementById('token').value = saved;
  }
  refresh();
});