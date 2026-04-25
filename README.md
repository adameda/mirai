# Mirai

Application d'orientation post-bac pour lycéens, avec tableau de bord enseignant.

- **Front** : React 18 + Vite, port `8080`
- **Back** : FastAPI (Python 3.12) + SQLAlchemy, port `8000`
- **Base de données** : PostgreSQL 16
- **IA** : Google Gemini (chat contextuel)

---

## Pages

| Page | Rôle |
| --- | --- |
| Exploration | Parcourir formations et métiers (données Onisep) |
| Parcoursup | Recherche dans les données Parcoursup |
| Favoris | Favoris de l'élève par catégorie |
| Chatbot | Assistant IA contextuel (Gemini) |
| Dashboard élève | Progression et objectifs |
| Dashboard prof | Vue classe, stats, configuration des objectifs |

---

## Développement sans Docker

### Prérequis locaux

- Node.js 20+
- Python 3.12+
- PostgreSQL en local

### Front

```bash
npm install
npm run dev       # http://localhost:8080
```

### Back

```bash
cd back
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt

# Copier et adapter le fichier d'environnement
cp .env.example .env            # fichier .env.example à la racine du back

# Lancer le serveur
uvicorn app.main:app --reload   # http://localhost:8000
```

### Variables d'environnement (back/.env)

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/mirai
SECRET_KEY=une-clé-secrète
GEMINI_API_KEY=votre-clé-gemini
```

### Ingestion des données

```bash
cd back
source venv/bin/activate
python scripts/ingest_onisep.py     # formations et métiers Onisep
python scripts/ingest_parcoursup.py # données Parcoursup
```

---

## Lancer avec Docker (local)

### Prérequis Docker

- Docker Desktop (ou Docker Engine + Compose plugin)

### Première fois

```bash
# 1. Copier et adapter le fichier d'environnement
cp .env.example .env

# 2. Construire et démarrer toute la stack
docker compose up --build

# 3. (optionnel) Ingérer les données dans un autre terminal
docker compose exec back python scripts/ingest_onisep.py
docker compose exec back python scripts/ingest_parcoursup.py
```

L'application est disponible sur <http://localhost:8080>.

### Commandes utiles

```bash
docker compose up -d          # démarrer en arrière-plan
docker compose logs -f back   # suivre les logs du back
docker compose down           # arrêter
docker compose down -v        # arrêter et supprimer les données PostgreSQL
```

---

## Déploiement sur VPS

### Prérequis serveur

- Docker Engine + Compose plugin
- Un nom de domaine pointant sur le VPS (pour HTTPS)

### Étapes

```bash
# 1. Cloner le repo sur le VPS
git clone <url-repo> mirai && cd mirai

# 2. Créer le fichier .env avec les valeurs de production
cp .env.example .env
nano .env
```

Valeurs à changer dans `.env` :

```env
POSTGRES_PASSWORD=un-mot-de-passe-fort
SECRET_KEY=une-clé-secrète-longue-et-aléatoire
GEMINI_API_KEY=votre-clé-gemini
CORS_ORIGINS=https://votre-domaine.com
```

```bash
# 3. Démarrer la stack
docker compose up -d --build

# 4. Ingérer les données (une seule fois)
docker compose exec back python scripts/ingest_onisep.py
docker compose exec back python scripts/ingest_parcoursup.py
```

Le front est accessible sur le port `8080`. Mettre un reverse proxy (nginx, Caddy) devant pour gérer HTTPS.

### Exemple de config Caddy (HTTPS automatique)

```caddyfile
votre-domaine.com {
    reverse_proxy localhost:8080
}
```

### Mettre à jour l'application

```bash
git pull
docker compose up -d --build
```

---

## Architecture Docker

```text
Navigateur
    │
    ▼ :8080
 [front - nginx]
    │ /api/* → proxy
    ▼ :8000
 [back - FastAPI]
    │
    ▼ :5432
 [postgres]
```

Le front sert le bundle React et proxifie tous les appels `/api/*` vers le back. Le back n'est pas exposé directement en production (commenter le port `8000` dans `docker-compose.yml`).

---

## Structure du projet

```text
mirai/
├── src/                        # Front React
│   └── platform/
│       ├── pages/              # Écrans métier
│       ├── components/         # Composants UI
│       ├── context/            # État global (AppContext)
│       ├── services/           # Appels API
│       └── constants/          # Thème, config
├── back/                       # Back FastAPI
│   └── app/
│       ├── api/                # Routers (un fichier par domaine)
│       ├── core/               # Config, auth, DB, rate limiting
│       ├── models/             # Modèles SQLAlchemy
│       ├── schemas/            # Schémas Pydantic
│       └── services/           # Logique métier
│   └── scripts/                # Ingestion des données
├── data/                       # Fichiers source Onisep / Parcoursup
├── Dockerfile                  # Build front (multi-stage Node → nginx)
├── nginx.conf                  # Config nginx (SPA + proxy API)
├── docker-compose.yml          # Orchestration des 3 services
└── .env.example                # Template des variables d'environnement
```

---

## Points d'attention

- **Données** : les fichiers `data/` ne sont pas dans le repo (`.gitignore`). Les récupérer et relancer les scripts d'ingestion à chaque déploiement fresh.
- **Migrations** : Alembic est inclus mais les migrations ne sont pas auto-appliquées au démarrage. Lancer `alembic upgrade head` manuellement si besoin.
- **HTTPS** : Docker ne gère pas le certificat TLS. Mettre un reverse proxy (Caddy ou nginx) devant le port `8080` sur le VPS.
- **Port 8000** : exposé pour faciliter le développement. Le commenter dans `docker-compose.yml` en production.
- **Rate limiting** : SlowAPI limite les requêtes par IP (en mémoire). Pour un déploiement multi-instance, brancher Redis comme backend.
