#!/usr/bin/env node
// Script to clean redundant descriptions in JSON files under data/
// It looks for objects with `title` and `description`, and removes `description` when it's empty or identical to the title.
import fs from 'fs/promises';
import path from 'path';
import { normalizeTextSimple } from '../lib/news.js';

function sameText(a,b){ const norm = s => (normalizeTextSimple(s)||'').replace(/\s+/g,' ').trim(); return norm(a) === norm(b); }

async function processFile(file){
  try{
    const raw = await fs.readFile(file, 'utf8');
    let data = JSON.parse(raw);
    let changed = false;

    function walk(obj){
      if (Array.isArray(obj)){
        for (const it of obj) walk(it);
        return;
      }
      if (obj && typeof obj === 'object'){
        if ('title' in obj && 'description' in obj){
          const d = obj.description;
          if (!d || sameText(obj.title, d)){ delete obj.description; changed = true; }
        }
        for (const k of Object.keys(obj)) walk(obj[k]);
      }
    }

    walk(data);
    if (changed){
      await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
      console.log('Cleaned:', file);
    } else {
      console.log('No changes:', file);
    }
  }catch(e){ console.warn('Skipping', file, e && e.message ? e.message : String(e)); }
}

async function main(){
  const dir = path.join(process.cwd(), 'data');
  try{
    const files = await fs.readdir(dir);
    for (const f of files) if (f.endsWith('.json')) await processFile(path.join(dir,f));
  }catch(e){ console.error('Failed to scan data dir', e && e.message ? e.message : e); }
}

main();
