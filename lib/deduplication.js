/**
 * Shared deduplication utilities for articles
 */

import { normalizeTextSimple } from './news.js';

// Candidate names for distinguishing similar titles
const CANDIDATE_NAMES = [
  'damien maudet', 'maudet',
  'émile roger lombertie', 'emile roger lombertie', 'lombertie', 'emile roger',
  'yoann balestrat', 'balestrat',
  'hervé beaudet', 'herve beaudet', 'beaudet'
].map(normalizeTextSimple);

// Preferred hosts for article selection
export const PREFERRED_HOSTS = [
  'lepopulaire.fr', 'francebleu.fr', 'lamontagne.fr', 
  'actu.fr', 'france3', 'lepopulaire', 'francebleu', 'lamontagne'
];

/**
 * Normalize title for comparison (remove non-alphanumeric, lowercase)
 */
export function titleKey(title) { 
  return (normalizeTextSimple(title || '') || '').replace(/[^a-z0-9]+/g, ' ').trim(); 
}

/**
 * Get words from a title for similarity comparison
 */
export function wordsOfTitle(title) { 
  return (titleKey(title) || '').split(/\s+/).filter(Boolean); 
}

/**
 * Find candidate names mentioned in a title
 */
export function findCandidatesInTitle(title) {
  const s = normalizeTextSimple(title || '');
  return CANDIDATE_NAMES.filter(c => s.includes(c));
}

/**
 * Check if two articles have similar titles (60% word overlap)
 * Returns false if they mention different candidates
 */
export function isSimilarTitle(a, b) {
  // If titles mention different candidates, treat as distinct
  const ca = findCandidatesInTitle(a.title);
  const cb = findCandidatesInTitle(b.title);
  if (ca.length > 0 && cb.length > 0) {
    if (!ca.some(x => cb.includes(x))) return false;
  }

  const wa = new Set(wordsOfTitle(a.title || ''));
  const wb = new Set(wordsOfTitle(b.title || ''));
  if (wa.size === 0 || wb.size === 0) return false;
  
  const inter = [...wa].filter(w => wb.has(w)).length;
  const minLen = Math.min(wa.size, wb.size);
  return (inter / Math.max(1, minLen)) >= 0.6; // 60% threshold
}

/**
 * Score an article based on source quality, matches, length, and recency
 */
export function scoreArticle(article) {
  const hostScore = PREFERRED_HOSTS.some(h => 
    (article.source || '').toLowerCase().includes(h)
  ) ? 100 : 0;
  
  const nonGoogle = (article.url && !article.url.includes('news.google.com')) ? 50 : 0;
  const matchesScore = (article.matches || []).length * 20;
  const descLen = (article.description || '').length;
  const timeScore = article.publishedAt ? new Date(article.publishedAt).getTime() / 1e12 : 0;
  
  return hostScore + nonGoogle + matchesScore + descLen + timeScore;
}

/**
 * Select the best article from a group based on scoring
 */
export function preferArticle(articles) {
  return articles.slice().sort((a, b) => scoreArticle(b) - scoreArticle(a))[0];
}

/**
 * Deduplicate articles with similar titles
 * Keeps the best article from each similar group
 */
export function deduplicateSimilarTitles(articles) {
  const deduped = [];
  const usedIdx = new Set();
  
  for (let i = 0; i < articles.length; i++) {
    if (usedIdx.has(i)) continue;
    const a = articles[i];
    const group = [a];
    usedIdx.add(i);
    
    for (let j = i + 1; j < articles.length; j++) {
      if (usedIdx.has(j)) continue;
      const b = articles[j];
      if (isSimilarTitle(a, b)) { 
        group.push(b); 
        usedIdx.add(j); 
      }
    }
    
    const chosen = group.length > 1 ? preferArticle(group) : a;
    deduped.push(chosen);
  }
  
  return deduped;
}

/**
 * Remove exact URL duplicates
 */
export function deduplicateByUrl(articles) {
  const seen = new Set();
  return articles.filter(a => {
    if (!a.url) return true;
    const normalizedUrl = a.url.toLowerCase().replace(/\/$/, '');
    if (seen.has(normalizedUrl)) return false;
    seen.add(normalizedUrl);
    return true;
  });
}

/**
 * Sort articles by date (most recent first)
 */
export function sortByDate(articles) {
  return articles.slice().sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
    return dateB - dateA;
  });
}

/**
 * Remove Google News wrapper URLs when direct source exists
 */
export function removeGoogleWrappers(articles) {
  const grouped = new Map();
  
  for (const a of articles) {
    const key = titleKey(a.title || '');
    const arr = grouped.get(key) || [];
    arr.push(a);
    grouped.set(key, arr);
  }
  
  const cleaned = [];
  for (const [k, arr] of grouped.entries()) {
    if (arr.length === 1) { 
      cleaned.push(arr[0]); 
      continue; 
    }
    
    // Prefer non-Google URL from preferred host
    let preferred = arr.find(x => 
      x.url && 
      !x.url.includes('news.google.com') && 
      PREFERRED_HOSTS.some(h => (x.source || '').toLowerCase().includes(h))
    );
    
    if (!preferred) {
      preferred = arr.find(x => x.url && !x.url.includes('news.google.com'));
    }
    
    if (!preferred) {
      preferred = arr[0];
    }
    
    cleaned.push(preferred);
  }
  
  return cleaned;
}
