export default function handler(req, res) {
  // Exemple minimal : refuse toute connexion
  res.status(401).json({ ok: false, error: 'Authentification non disponible.' });
}
