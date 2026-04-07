# Mirai

Front React/Vite de démonstration pour l'orientation des lycéens et le suivi professeur.

## Démarrage

```bash
npm install
npm run dev
```

Le point d'entrée de l'application est [src/main.jsx](src/main.jsx), qui charge [src/App.jsx](src/App.jsx).

## Structure

- [src/App.jsx](src/App.jsx) : composition principale de l'app.
- [src/platform/context/AppContext.jsx](src/platform/context/AppContext.jsx) : état global de l'application.
- [src/platform/hooks/useAppState.js](src/platform/hooks/useAppState.js) : hooks de lecture du contexte.
- [src/platform/pages/](src/platform/pages) : écrans métier.
- [src/platform/layout/](src/platform/layout) : barres latérales.
- [src/platform/components/](src/platform/components) : composants UI réutilisables.
- [src/platform/data/](src/platform/data) : données normalisées et relations.
- [src/platform/utils/](src/platform/utils) : logique métier partagée.

## Modèle de données

La base métier est déjà normalisée autour d'identifiants stables:

- formations et métiers ont des `id` fixes,
- les relations sont séparées dans [src/platform/data/relationsData.js](src/platform/data/relationsData.js),
- les favoris utilisent ces identifiants pour éviter les doublons fragiles basés sur le libellé.

## Logique produit

- L'objectif profil est obligatoire et n'a pas de date limite.
- Les objectifs suivants concernent les favoris domaines, formations et métiers.
- Une date dépassée marque l'objectif comme en retard sans supprimer la progression.
- L'accès aux sections élève reste verrouillé tant que le profil n'est pas complété.

## État actuel

La base front est volontairement simple avant le futur contrat API:

- état global centralisé dans un context,
- navigation interne conservée,
- structure prête pour remplacer les données mock par des appels API.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```
