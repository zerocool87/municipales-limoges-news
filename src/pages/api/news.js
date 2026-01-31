import { fetchRssFeeds } from '../../../lib/news.js';

export default async function handler(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 200;
    const articles = await fetchRssFeeds(limit);
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
    res.status(200).json({ articles, monthlyArticles, months });
  } catch (e) {
    res.status(500).json({ articles: [], monthlyArticles: {}, months: [], error: e.message });
  }
}
