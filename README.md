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
- `prisma/schema.prisma` — modèle de données.
- `prisma/seed.ts` — import des données réelles déjà saisies dans le fichier Excel.

## Déploiement

Voir [`DEPLOIEMENT.md`](./DEPLOIEMENT.md) pour la mise en ligne sur Neon + Vercel.
