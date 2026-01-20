# 10 news du jour - IA 📰

Petite application Node.js qui récupère *20* articles récents concernant les élections municipales à Limoges (édition 2026) et les affiche dans une interface web simple. Le serveur utilise NewsAPI si vous fournissez une clé, sinon il agrége des flux RSS publics et filtre les articles qui mentionnent Limoges et les municipales 2026. Il filtre aussi explicitement les mentions des candidats déclarés : Damien Maudet, Émile Roger Lombertie, Thierry Miguel et Vincent Léonie. Pour chaque article renvoyé, une propriété `matches` liste les mots-clés ou noms de candidats qui ont déclenché la correspondance (utile pour vérifier pourquoi un article a été sélectionné).

Par défaut l'API applique maintenant un **filtre strict** : un article est retourné uniquement s'il mentionne **Limoges** (ou si la `source`/`url` indique une source régionale) **et** contient soit le nom d'au moins un candidat déclaré, **soit** un mot lié aux élections (ex: « municipal », « municipales », « élection »). Note: la contrainte sur **2026** a été retirée. De plus, seuls les articles datant d'au plus **2 mois** sont renvoyés et les résultats sont triés du plus récent au moins récent. Si vous voulez relaxer le filtre, appelez l'endpoint avec `?strict=false` (ex: `/api/news?limit=20&strict=false`).

Pour déboguer le filtrage, appelez `/api/news?debug=true` (ou `/api/news?debug=true&strict=false` pour un ensemble plus large) — la réponse contiendra éventuellement `debug.samples` et le serveur écrira aussi en log un échantillon quand le filtre strict élimine toutes les entrées.

Si un flux RSS échoue plusieurs fois, le serveur tente automatiquement de le remplacer par des alternatives (ex: Google News search RSS sur le domaine concerné). Si aucune alternative spécifique n'est configurée, il crée automatiquement une recherche Google News `site:host Limoges municipales 2026` comme fallback.

Admin API:
- GET `/admin/feeds` — voir `feeds`, `blacklisted`, `failures`, `alternatives`.
- POST `/admin/feeds/add` — body `{ "url": "...", "name": "..." }` pour ajouter.
- POST `/admin/feeds/remove` — body `{ "url": "..." }` pour supprimer d'une liste de feeds.
- POST `/admin/feeds/unblacklist` — body `{ "url": "..." }` pour retirer d'une blacklist.
- POST `/admin/feeds/test` — body `{ "url": "..." }` pour tester un flux et obtenir un échantillon d'items parsés (utile pour vérifier la qualité du flux).
- POST `/admin/feeds/update` — body `{ "url": "...", "name": "..." }` pour renommer un flux existant.
- Web UI: open `/admin` in your browser to manage feeds via une interface (Test, Edit, Remove). Entrez `x-admin-token` si `ADMIN_TOKEN` est défini.

Sécurité optionnelle: définissez `ADMIN_TOKEN` dans `.env` et envoyez `x-admin-token: <token>` dans l'en-tête pour restreindre l'accès aux endpoints admin. Une propriété `primaryMatch` indique le mot-clé principal trouvé. Dans l'interface, le badge correspondant au `primaryMatch` est mis en évidence et vous pouvez cliquer sur n'importe quel badge pour filtrer la liste par ce mot-clé.

## Prérequis
- Node.js 18+ (ou compatible ES modules)
- (Optionnel) Une clé API NewsAPI (https://newsapi.org) — la version gratuite suffit pour tester. Si vous n'en fournissez pas, l'application utilisera un fallback RSS public (sans clé).

## Installation
1. Copier `.env.example` en `.env` et définir `NEWSAPI_KEY`.
2. Installer les dépendances:

```bash
npm install
```

3. Lancer le serveur:

```bash
npm start
```

4. Ouvrir http://localhost:3000

## Notes
- Le serveur interroge l'endpoint `everything` de NewsAPI en cherchant les termes "artificial intelligence", "AI" et "intelligence artificielle" pour la date du jour.
- Si vous voulez des articles en anglais, éditez `server.js` et retirez `&language=fr` ou remplacez par `en`.
- Limite par défaut: 10 articles (modifiable via le paramètre `limit` de `/api/news`).

## GitHub Pages
Le front est prêt pour être publié sur **GitHub Pages** depuis le dossier `docs/`. Pour activer :
1. Pousser la branche `main` (déjà fait).
2. Aller dans **Settings → Pages** et sélectionner **Branch: main** et **Folder: /docs**.
3. Après activation, le site sera disponible à `https://<USER>.github.io/municipales-limoges-news/` (remplace `<USER>` par ton nom d'utilisateur GitHub).

Remarque : GitHub Pages sert seulement le front statique; l'API Node doit être déployée séparément (Railway/Render/Heroku) pour être accessible publiquement.

---

Si vous voulez, je peux aussi ajouter le déploiement sur Heroku / Railway ou remplacer NewsAPI par une solution RSS gratuite.