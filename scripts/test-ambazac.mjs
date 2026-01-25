import { getMatches, isStrictMatch } from '../lib/news.js';

const sample = {
  title: "Peggy Bariat se lance dans les municipales à Ambazac - Le Populaire",
  description: "Peggy Bariat annonce sa candidacy à Ambazac, commune de la Haute-Vienne.",
  source: 'Le Populaire',
  url: 'https://www.lepopulaire.fr/ambazac'
};

const text = (sample.title || '') + ' ' + (sample.description || '');
const matches = getMatches(text);
const strict = isStrictMatch(matches, sample);

console.log('title:', sample.title);
console.log('matches:', matches);
console.log('isStrictMatch:', strict);
