import fetch from 'node-fetch';
import Parser from 'rss-parser';
import fs from 'fs/promises';
const parser = new Parser();

const feeds = JSON.parse(await fs.readFile(new URL('../data/feeds.json', import.meta.url)));
const needle = (process.argv[2] || '').toLowerCase();

for (const f of feeds) {
  try {
    console.log('---', f.name, f.url);
    const r = await fetch(f.url, { headers: { 'User-Agent': 'node-fetch' } });
    const txt = await r.text();
    const feed = await parser.parseString(txt);
    console.log('title:', feed.title || '—');
    let i=0;
    for (const it of (feed.items||[])){
      i++;
      const t = (it.title||'').trim();
      if (needle && t.toLowerCase().includes(needle)){
        console.log('FOUND in feed item:', t);
        console.log('link:', it.link);
        console.log('pubDate:', it.isoDate||it.pubDate);
        break;
      }
      if (i<=10) console.log('-', t, '—', it.isoDate||it.pubDate);
    }
    console.log('items fetched:', (feed.items||[]).length);
  } catch(e){ console.warn('Error for', f.url, e && e.message ? e.message : e); }
}
