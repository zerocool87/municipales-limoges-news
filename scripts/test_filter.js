(async()=>{
  const res = await (await fetch('http://localhost:3000/api/news?limit=200')).json();
  const articles = res.articles || [];
  const normalize = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const hauteVienneVilles = ['Limoges'];
  const filtered = articles.filter(a => {
    if (!a.matches) return false;
    const departmentAliases = ['haute-vienne', 'haute vienne', 'hautevienne'];
    const hasDepartementMatch = a.matches.some(m => departmentAliases.includes(normalize(m)));
    const hasCityMatch = a.matches.some(m => hauteVienneVilles.some(v => normalize(m) === normalize(v)));
    return (hasDepartementMatch || hasCityMatch) && a.matches.some(m => normalize(m) === 'municipales');
  });
  console.log('filtered count', filtered.length);
  console.log(filtered.slice(0,3).map(x => ({ title: x.title, matches: x.matches, source: x.source })));
})();
