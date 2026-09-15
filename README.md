# MultiTrack Frontend

Monorepo npm workspaces contenant trois applications React/Vite déployables séparément.

## Structure

- `apps/admin` : administration historique (participants, courses, checkpoints, classements, pointeurs et authentification par passcode).
- `apps/public` : information événement, création de compte, connexion et inscriptions des participants.
- `apps/organizer` : tableau de bord organisateur, suivi et export en lecture seule.
- `packages/api-client` : requêtes HTTP authentifiées et téléchargement d’export.
- `packages/types` : contrats TypeScript partagés.
- `packages/ui` : composants et styles communs aux apps Public et Organizer.

## Installation

```bash
npm install
```

Définir `VITE_API_URL` dans l’environnement de chaque application. Sans cette variable, les appels utilisent la même origine.

## Développement

```bash
npm run dev:admin       # http://localhost:5173
npm run dev:public      # http://localhost:5174
npm run dev:organizer   # http://localhost:5175
```

## Build et lint

```bash
npm run build
npm run build:admin
npm run build:public
npm run build:organizer
npm run lint
```

Les sorties sont générées dans `apps/<app>/dist`.

## Déploiement Render

`render.yaml` déclare trois Static Sites indépendants :

- Admin : `npm ci && npm run build:admin`, publication `apps/admin/dist`
- Public : `npm ci && npm run build:public`, publication `apps/public/dist`
- Organizer : `npm ci && npm run build:organizer`, publication `apps/organizer/dist`

Configurer `VITE_API_URL` séparément sur chaque service.
