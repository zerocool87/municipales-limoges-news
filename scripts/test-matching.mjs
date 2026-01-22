import { getMatches, isStrictMatch, normalizeTextSimple } from '../lib/news.js';

const samples = [
  { text: 'Élections municipales Limoges 2026 - Damien Maudet', title: 'Élections municipales à Limoges : Damien Maudet annonce sa candidature' },
  { text: 'Tournoi sportif à Bordeaux', title: 'Bordeaux annonce un tournoi' }
];

for (const s of samples){
  console.log('text:', s.text);
  console.log('matches:', getMatches(s.text));
  console.log('strict?', isStrictMatch(getMatches(s.text), { title: s.title, description: s.text }));
  console.log('normalized:', normalizeTextSimple(s.text));
  console.log('---');
}
