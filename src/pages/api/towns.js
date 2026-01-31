export default function handler(req, res) {
  // Exemple minimal : retourne une liste statique
  res.status(200).json({ towns: [
    'Limoges', 'Saint-Junien', 'Panazol', 'Couzeix', 'Isle', 'Feytiat', 'Condat-sur-Vienne', 'Le Palais-sur-Vienne'
  ] });
}
