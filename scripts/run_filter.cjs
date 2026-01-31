const res = require('/tmp/news.json');
const articles = res.articles || [];
const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const hauteVienneVilles = ['Limoges'];
const activeTag = ''; // set to 'Limoges' or 'maudet' to test filtering by tag
const filtered = articles.filter(a => {
  if (!a.matches) return false;
  const departmentAliases = ['haute-vienne', 'haute vienne', 'hautevienne'];
  const hasDepartementMatch = a.matches.some(m => departmentAliases.includes(normalize(m)));
  const hasCityMatch = a.matches.some(m => hauteVienneVilles.some(v => normalize(m) === normalize(v)));
  let ok = (hasDepartementMatch || hasCityMatch) && a.matches.some(m => normalize(m) === 'municipales');
  if (activeTag) {
    ok = ok && a.matches.some(m => normalize(m) === normalize(activeTag));
  }
  return ok;
});
console.log('filtered count', filtered.length);
console.log(filtered.slice(0,5).map(x => ({ title: x.title, matches: x.matches, source: x.source })));
