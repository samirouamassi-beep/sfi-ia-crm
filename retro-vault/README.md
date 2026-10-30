# RetroGame Vault

PWA mobile-first pour collectionneurs de jeux vidéo rétro : répertorier ses jeux, consoles et
accessoires, les valoriser selon leur état (Loose / CIB / Neuf scellé) et suivre l'évolution
financière de la collection (valeur estimée vs investissement, ROI, plus fortes variations).

## Démarrage local

```bash
cp .env.example .env        # renseigner DATABASE_URL, APP_PASSWORD, APP_SESSION_SECRET
npm install
npx prisma migrate dev
npm run seed -- --demo      # plateformes + collection de démo (cotes SIMULÉES sur 12 mois)
npm run dev
```

Ouvrir http://localhost:3000. Sur mobile, menu du navigateur → « Ajouter à l'écran d'accueil »
(le service worker n'est actif qu'en production : `npm run build && npm start`).

Clés facultatives (l'application fonctionne sans, en saisie libre / valeur manuelle) :

| Variable | Rôle |
|---|---|
| `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET` | Auto-complétion du titre, jaquette, année, développeur, éditeur, genres ([application Twitch](https://dev.twitch.tv/console)) |
| `PRICECHARTING_TOKEN` (+ `USD_TO_EUR`) | Cotes Loose / CIB / Neuf / boîte seule / notice seule |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_BUCKET` | Photos des exemplaires (en dev sans Supabase : `public/uploads`) |
| `CRON_SECRET` | Protège `GET /api/prices/refresh` (relevé quotidien, `vercel.json`) |

## Stack

- Next.js 16 (App Router, server actions, `proxy.ts`), React 19, TypeScript strict, Tailwind 4
- Prisma 7 + PostgreSQL (Supabase ou tout Postgres), adaptateur `@prisma/adapter-pg`
- PWA : `app/manifest.ts`, icônes générées (`/pwa-icon/[size]`), `public/sw.js`, page `/offline`
- Zod pour la validation des formulaires et de l'import
- Primitives UI maison dans l'esprit shadcn/ui (`src/components/ui.tsx`), sans dépendance

## Architecture

```
prisma/schema.prisma        Modèle relationnel (voir ci-dessous)
prisma/seed.ts              Plateformes + collection de démo (--demo)
scripts/refresh-prices.ts   Relevé des cotes en CLI (npm run prices:refresh)
src/proxy.ts                Protection des routes (cookie de session signé)
src/lib/
  valuation.ts   Cote de base selon le format × coefficient d'état des composants (pur, testé)
  history.ts     Cote à date, courbe valeur/investi, plus fortes variations (pur, testé)
  csv.ts         CSV RFC 4180, détection « ; » (Excel FR), anti-injection de formules (testé)
  collection.ts  Liste filtrée/triée (filtres portés par l'URL) + valorisation
  stats.ts       Agrégats du tableau de bord
  igdb.ts        Client IGDB (jeton Twitch mis en cache)
  pricing/       Interface PriceProvider + implémentation PriceCharting + relevé quotidien
  storage.ts     Photos : Supabase Storage (REST) ou disque local en dev
  transfer.ts    Export / import CSV & JSON
  auth.ts, session.ts  Session V0 (mot de passe unique → compte propriétaire)
src/app/
  (app)/page.tsx                 Tableau de bord financier
  (app)/collection/              Liste + filtres, fiche, ajout, édition, server actions
  (app)/wishlist/                Wishlist avec prix cible vs cote
  (app)/settings/                Export / import, sources de données, déconnexion
  (app)/share/                   Résumé visuel partageable (PNG 1080×1350 via next/og)
  api/igdb/search                Auto-complétion
  api/export                     Téléchargement CSV / JSON
  api/prices/refresh             Cron des cotes
```

### Modèle de données

- **Référentiel partagé** : `Platform` → `Product` (jeu/console/accessoire, clé `igdbId + plateforme`)
  → `PriceSnapshot` (une cote par produit/région/jour : loose, CIB, neuf, boîte seule, notice seule)
  et `PriceSourceLink` (fiche correspondante chez la source de cotation, par région).
- **Données du collectionneur**, toutes rattachées à `User.id` : `CollectionItem` (région, format,
  état boîte/notice/support en Mauvais→Neuf + note /10 facultative, date et prix d'achat, valeur
  manuelle), `ItemPhoto`, `WishlistItem` (format visé, prix cible, priorité).
- Montants en **centimes d'euro** (Int). Valeurs, plus-values et variations sont **calculées à la
  lecture**, jamais stockées : changer la formule d'état réévalue tout l'historique.

### Valorisation

`valeur = cote(format) × coefficient d'état` — CIB : boîte 50 %, notice 15 %, support 35 % ;
Mauvais 0,6 · Bon 0,85 · Très bon 1 · Neuf 1,15 ; la note /10 prime sur l'état. CIB non coté →
loose + boîte seule + notice seule. Région non cotée → repli sur la cote NTSC-U. Une valeur
manuelle prime toujours. Un exemplaire sans cote est compté à son prix d'achat dans les totaux.

## Vers la production

1. **Supabase** : `DATABASE_URL` = chaîne de connexion « Session » (port 5432), `prisma migrate deploy`,
   bucket public `item-photos`.
2. **Supabase Auth (multi-collectionneurs)** : remplacer `requireUserId()` / `currentUserId()` dans
   `src/lib/auth.ts` par la session Supabase (`auth.uid()` = `User.id`, déjà de type UUID) et activer
   la RLS `"userId" = auth.uid()` sur `CollectionItem`, `ItemPhoto` (via l'item) et `WishlistItem`.
3. **Cotes** : déclarer `CRON_SECRET` sur Vercel (le cron de `vercel.json` l'envoie en `Bearer`).
   Une source supplémentaire (ventes eBay conclues…) s'ajoute en implémentant `PriceProvider`.

## Scripts

`npm test` (logique de valorisation, historique, CSV) · `npm run lint` · `npm run typecheck` ·
`npm run build` · `npm run seed [-- --demo]` · `npm run prices:refresh`
