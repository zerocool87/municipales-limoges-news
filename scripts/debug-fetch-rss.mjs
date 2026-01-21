import { fetchRssFeeds } from '../lib/news.js';

(async () => {
  try{
    const res = await fetchRssFeeds(200, true);
    console.log(JSON.stringify(res, null, 2));
  }catch(e){
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
