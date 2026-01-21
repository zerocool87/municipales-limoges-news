(async ()=>{
  process.env.PREFER_DEPARTEMENT = 'true';
  try{
    const m = await import('../lib/news.js');
    const res = await m.fetchRssFeeds(200, true);
    const items = Array.isArray(res) ? res : res.items || [];
    const maudet = items.filter(a => (a.matches||[]).some(m => m.toLowerCase().includes('maudet'))).length;
    console.log(JSON.stringify({ count: items.length, maudet }));
  }catch(e){
    console.error('error', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
