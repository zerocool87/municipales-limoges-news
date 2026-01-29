import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWSAPI_ENABLED = process.env.NEWSAPI_ENABLED === 'true';

console.log('=== Test NewsAPI ===');
console.log(`NEWSAPI_ENABLED: ${NEWSAPI_ENABLED}`);
console.log(`NEWSAPI_KEY: ${NEWSAPI_KEY ? '✓ Set' : '✗ Not set'}`);

if (!NEWSAPI_KEY) {
  console.log('\n❌ ERROR: NEWSAPI_KEY not configured in .env');
  process.exit(1);
}

if (!NEWSAPI_ENABLED) {
  console.log('\n⚠️  WARNING: NEWSAPI_ENABLED is false. Enabling it for this test...');
}

async function testNewsAPI() {
  try {
    const q = 'Limoges municipales 2026';
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pageSize = 50;
    const page = 1;

    const urlApi = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${from}&sortBy=publishedAt&pageSize=${pageSize}&page=${page}&language=fr&apiKey=${NEWSAPI_KEY}`;

    console.log(`\nFetching from NewsAPI...`);
    console.log(`Query: "${q}"`);
    console.log(`From: ${from}`);
    console.log(`URL: ${urlApi.replace(NEWSAPI_KEY, 'REDACTED')}`);

    const res = await fetch(urlApi);
    const json = await res.json();

    console.log(`\nStatus: ${res.status}`);
    
    if (json.status !== 'ok') {
      console.log(`\n❌ ERROR: ${json.code}`);
      console.log(`Message: ${json.message}`);
      process.exit(1);
    }

    const { articles, totalResults } = json;
    
    console.log(`\n✓ Success!`);
    console.log(`Total articles found: ${totalResults}`);
    console.log(`Articles returned: ${articles.length}`);

    if (articles.length > 0) {
      console.log(`\nFirst 3 articles:`);
      articles.slice(0, 3).forEach((article, idx) => {
        console.log(`\n${idx + 1}. ${article.title}`);
        console.log(`   Source: ${article.source.name}`);
        console.log(`   Published: ${article.publishedAt}`);
        console.log(`   URL: ${article.url}`);
      });
    } else {
      console.log(`\n⚠️  No articles found for this query`);
    }

  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

testNewsAPI();
