import fetch from 'node-fetch';

async function run(){
  const r = await fetch('http://localhost:3000/api/filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', tag: 'Municipales' }) });
  console.log('add status', r.status, await r.text());
  const r2 = await fetch('http://localhost:3000/api/filters');
  console.log('get', r2.status, await r2.json());

  const r3 = await fetch('http://localhost:3000/api/filters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', tag: 'Municipales' }) });
  console.log('remove status', r3.status, await r3.text());
  const r4 = await fetch('http://localhost:3000/api/filters');
  console.log('get2', r4.status, await r4.json());
}
run().catch(e=>{ console.error(e); process.exit(1); });
