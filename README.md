# SFI IA — CRM

CRM web interne pour SFI IA (conseil/staffing Salesforce & Agentforce), calqué sur le
fichier Excel `Suivi_Operationnel_SFI_IA.xlsx` : mêmes entités (Comptes, Contacts, Pipeline,
Ressources, Missions, Interactions), mêmes formules de calcul (montant pondéré, marge,
indicateurs "en retard"), accessible aux 4 associés via un mot de passe d'équipe partagé.

## Démarrage local

```bash
npm install
npx prisma migrate dev
npm run seed   # fondateurs, étapes de pipeline, paramètres de charges, comptes déjà saisis
npm run dev
```

Ouvre http://localhost:3000 — mot de passe défini dans `.env` (`APP_PASSWORD`).

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Prisma + SQLite en local (bascule vers PostgreSQL/Neon en production — voir `DEPLOIEMENT.md`)
- Authentification par mot de passe d'équipe unique (pas de comptes individuels), cookie de
  session signé, protection via `src/proxy.ts`

## Structure

- `src/lib/calculs.ts` — toute la logique métier reprise des formules Excel (marge, montant
  pondéré, coût par jour, compteurs du tableau de bord).
- `src/lib/listes.ts` — listes déroulantes fixes (calquées sur l'onglet Listes du fichier).
- `src/app/(site)/*` — une page liste + formulaires création/édition par entité.
- `src/lib/vues.ts` + `src/components/vues.tsx` — vues de liste : recherche, filtres, tri par
  colonne et vues enregistrées (table `VueListe`), le tout porté par l'URL.
- `src/lib/agenda.ts` — tâches et relances : tâches (table `Tache`) + dates de relance déjà
  saisies sur contacts, opportunités et interactions, regroupées par échéance.
- `src/lib/rapports.ts` — agrégats de la page Rapports.

## Fonctionnalités inspirées de Salesforce

- **Fiche 360°** (`/comptes/[id]`) : opportunités, contacts, missions, tâches et frise
  d'activité du compte, avec raccourcis « + Interaction / Tâche / Opportunité / Contact ».
  L'édition du compte est sur `/comptes/[id]/modifier`.
- **Pipeline en Kanban** (`/pipeline?vue=kanban`) : glisser-déposer entre étapes, totaux par
  colonne (sur écran tactile, une liste déroulante remplace le glisser-déposer).
- **Vues de liste** sur Comptes, Contacts, Pipeline et Prospects.
- **Tâches et relances** (`/taches`) + bloc « À faire aujourd'hui » sur le tableau de bord.
- **Prospects / Leads** (`/prospects`) et conversion en compte + contact (+ opportunité).
- **Rapports** (`/rapports`) : pipeline par étape, prévisionnel, activité, résultats par
  fondateur, CA récurrent par compte, conversion des prospects.
- **Recherche globale** dans l'en-tête (raccourci « / »), sans tenir compte des accents.
- `prisma/schema.prisma` — modèle de données.
- `prisma/seed.ts` — import des données réelles déjà saisies dans le fichier Excel.

## Mise à jour de la base en production

Après un `git pull` contenant une nouvelle migration (dossier `prisma/migrations`), appliquer
les migrations sur la base Neon :

```bash
DATABASE_URL="<chaîne Neon>" npx prisma migrate deploy
```

## Déploiement

Voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md) pour la mise en ligne sur Neon + Vercel.

## Autre application du dépôt : gestion de projet

Le dossier [`gestion-projet/`](./gestion-projet/README.md) contient une application autonome de
gestion de projets et de portefeuille (V0 de démonstration client, type Genius Project), avec
son propre `package.json`, sa base et son déploiement Vercel (Root Directory `gestion-projet`).
