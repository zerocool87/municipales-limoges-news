export default function handler(req, res) {
  res.status(200).json({
    message: 'Bienvenue sur l’API Municipales Limoges News. Utilisez /api/news pour les articles.'
  });
}
