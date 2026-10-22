# Pilotis — gestion de projets et de portefeuille (V0)

Application web de pilotage de projets dans l'esprit de Genius Project / MS Project Online :
appels d'offres, portefeuille de marchés, planning Gantt, Kanban, plan de charge des
ressources, feuilles de temps, suivi budgétaire et registre des risques.

La démo est adaptée à un intégrateur **télégestion / automatisme / mesures physico-chimiques
/ détection de fuites** qui répond aux appels d'offres de l'ONEE, des SRM et des régies
(montants en dirhams, données fictives). Cette V0 sert de démonstrateur commercial ; elle est
pensée pour être complétée selon le besoin du client.

Le nom « Pilotis » est provisoire : il se change via `NEXT_PUBLIC_APP_NAME` (marque blanche).

Captures d'écran : [`docs/captures/`](./docs/captures/).

## Fonctionnalités

| Module | Ce qu'il fait |
| --- | --- |
| **Tableau de bord** (`/`) | KPI du portefeuille (budget engagé, consommé, prévision à terminaison, retards), tableau des projets avec météo, avancement réel vs prévu, consommation budgétaire, prochain jalon, alertes ; jalons à 30 jours ; top 5 des risques. |
| **Appels d'offres** (`/appels-offres`) | Veille et suivi des AO (référence, maître d'ouvrage, procédure, activité, date limite, estimation, montant soumis, caution provisoire, statut). KPI : offres en cours, prochain dépôt, taux de réussite, cautions immobilisées. Un AO gagné se convertit en projet en un clic. |
| **Projets** (`/projets`) | Liste filtrable par statut + recherche. Fiche projet à onglets : **Synthèse** (météo et commentaire de situation, avancement par phase, jalons, équipe), **Tâches** (WBS par phase), **Gantt**, **Kanban** (glisser-déposer), **Budget** (temps passés × taux journalier + dépenses + reste à faire), **Risques** (matrice probabilité × impact + registre). |
| **Planning** (`/planning`) | Gantt multi-projets : barres projet + jalons ou phases. |
| **Tâches** (`/mes-taches`) | Toutes les tâches ouvertes, filtrables par collaborateur, groupées par échéance (retard, 7 jours, 30 jours, plus tard). |
| **Plan de charge** (`/charge`) | Charge planifiée / capacité par collaborateur et par semaine sur 12 semaines, carte de chaleur, détection des surcharges. |
| **Feuilles de temps** (`/temps`) | Saisie hebdomadaire par jour et par tâche, alimente le budget consommé. |
| **Risques** (`/risques`) | Registre consolidé tous projets, matrice, filtres par statut. |
| **Équipe** (`/equipe`) | Collaborateurs, rôle, taux journalier, capacité hebdomadaire, occupation à 4 semaines. |

## Règles de calcul (`src/lib/calculs.ts`)

- **Avancement** d'un projet ou d'une phase = moyenne des avancements des tâches pondérée par
  leur charge (jalons exclus).
- **Avancement prévu à date** = part de la charge qui devrait être réalisée aujourd'hui selon
  le planning (répartition linéaire sur la durée de chaque tâche). Affiché comme un trait
  vertical sur les barres de progression.
- **Consommé** = jours saisis × coût journalier du collaborateur + dépenses déjà réalisées.
- **Reste à faire** = charge restante des tâches non terminées × coût du responsable (coût
  moyen de l'équipe si non affectée) + achats prévus (dépenses datées dans le futur).
- **Budget** d'un projet = montant du marché HT : l'écart avec la prévision est la marge.
- **Prévision à terminaison** = consommé + reste à faire ; écart = budget − prévision.
- **Retard** : tâche non terminée dont la date de fin est passée.
- **Plan de charge** : la charge d'une tâche est répartie uniformément sur ses jours ouvrés.
- **Criticité d'un risque** = probabilité (1-4) × impact (1-4) ; critique à partir de 9.

## Démarrage local

```bash
cd gestion-projet
cp .env.example .env          # puis ajuster DATABASE_URL
npm install
npx prisma migrate dev
npm run seed                  # données de démonstration (remet la base à zéro)
npm run dev
```

Ouvre http://localhost:3000 — mot de passe : valeur de `APP_PASSWORD` (`demo` par défaut).

Les données de démonstration sont datées par rapport au jour où `npm run seed` est lancé :
relancer le seed la veille d'une présentation pour que les retards, jalons et feuilles de temps
soient à jour.

## Stack

Identique au CRM SFI IA (même déploiement Neon + Vercel) :
Next.js 16 (App Router, server actions), Prisma 7 + PostgreSQL, Tailwind CSS 4. Aucune
librairie de graphique : Gantt, Kanban, matrice et plan de charge sont en HTML/CSS.

## Structure

- `prisma/schema.prisma` — Membre, AppelOffre, Projet, Phase, Tache, Temps, Depense, Risque.
- `prisma/seed.ts` — jeu de démonstration fictif (9 collaborateurs, 7 appels d'offres,
  5 marchés ONEE / SRM / régies : un vert, un orange, un rouge, un en cadrage, un terminé).
- `src/lib/calculs.ts` — toutes les règles métier (fonctions pures).
- `src/lib/listes.ts` — statuts, priorités, rôles, catégories : à adapter au vocabulaire du
  client sans migration.
- `src/lib/marque.ts` — nom, accroche et devise (DH) du produit.
- `src/components/gantt.tsx`, `kanban.tsx`, `risques.tsx` — composants de visualisation.
- `src/app/(app)/*` — une route par module.

## Pistes pour la V1 (selon le besoin du client)

Spécifiques au métier (eau, télégestion, marchés publics) :

- Gestion des sites (réservoirs, stations, forages) et des équipements installés : n° de
  série, photos, PV de mise en service, géolocalisation sur carte.
- Marchés publics : bordereau des prix, décomptes et attachements, révision des prix,
  retenue de garantie, pénalités de retard, réceptions provisoire / définitive, cautions.
- Dossier d'AO : pièces administratives et techniques, bibliothèque de références et de prix.
- Maintenance après réception : contrats, interventions préventives / curatives, astreintes.
- Application mobile terrain (hors-ligne) pour les techniciens.

Générales :

- Comptes utilisateurs individuels et rôles (admin, chef de projet, contributeur, lecteur),
  SSO Microsoft / Google.
- Dépendances entre tâches (fin → début) et recalcul automatique du planning, chemin critique.
- Gantt interactif (déplacer / étirer les barres).
- Validation des feuilles de temps par le chef de projet.
- Baselines (planning de référence) et suivi des écarts.
- Demandes de projets et scoring / arbitrage du portefeuille.
- Documents, commentaires et notifications par email.
- Exports Excel / PDF (rapport de projet, revue de portefeuille), import MS Project.
- Facturation / jalons de paiement, multi-devises.
- Multi-tenant (une base par client) si commercialisation en SaaS.

## Déploiement

Voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md).
