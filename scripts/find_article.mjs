import { fetchRssFeeds } from '../lib/news.js';

const needle = process.argv[2] || 'Après avoir fait le plein';
(async ()=>{
  try{
    const items = await fetchRssFeeds(500, true);
    const arr = Array.isArray(items) ? items : (items.items || []);
    const found = arr.filter(a => (a.title||'').toLowerCase().includes(needle.toLowerCase()));
    if(found.length===0){
      console.log('Not found in latest RSS fetch. Total items:', arr.length);
      return;
    }
    console.log('Found', found.length, 'matches:');
    for(const f of found){
      console.log('---');
      console.log('title:', f.title);
      console.log('source:', f.source);
      console.log('url:', f.url);
      console.log('publishedAt:', f.publishedAt);
      console.log('matches:', f.matches);
    }
  }catch(e){console.error('Error', e && e.message ? e.message : e);} 
})();