import { fetchRssFeeds } from './lib/news.js';

(async () => {
  try {
    const result = await fetchRssFeeds(10, true);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
})();