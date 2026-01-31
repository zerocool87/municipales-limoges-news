import { fetchRssFeeds } from '../../../lib/news.js';

export default async function handler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 200;
    const debugReq = req.query.debug === 'true';
    const result = await fetchRssFeeds(limit, debugReq);
    const articles = debugReq && result.items ? result.items : result;
    const reports = debugReq && result.reports ? result.reports : null;

    // Regrouper par mois pour la pagination
    const monthlyArticles = {};
    const months = [];
    articles.forEach(article => {
      if (article.publishedAt) {
        const month = new Date(article.publishedAt).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        if (!monthlyArticles[month]) {
          monthlyArticles[month] = [];
          months.push(month);
        }
        monthlyArticles[month].push(article);
      }
    });
    const payload = { articles, monthlyArticles, months };
    if (reports) payload.reports = reports;
    res.status(200).json(payload);
  } catch (e) {
    res.status(500).json({ articles: [], monthlyArticles: {}, months: [], error: e.message });
  }
}
