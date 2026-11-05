# Registre des environnements

Source de vérité de l'infrastructure, tenue à jour par l'agent `admin-infra`
(`.claude/agents/admin-infra.md`). **Aucun secret ici** : uniquement les noms de variables.

## CRM SFI IA

- **Dossier** : `/` (racine du dépôt)
- **Base** : Neon Postgres (projet `sfi-ia-crm`)
- **Hébergement** : Vercel, Root Directory `/`
- **Stockage** : Vercel Blob (CV)
- **Variables** : `DATABASE_URL`, `APP_PASSWORD`, `APP_SESSION_SECRET`, `BLOB_READ_WRITE_TOKEN`
- **Doc** : `DEPLOIEMENT.md`

## Pilotis (gestion de projet)

- **Dossier** : `gestion-projet/`
- **Base** : Neon Postgres (projet `pilotis-demo`), connexion directe sans `-pooler`
- **Hébergement** : Vercel, Root Directory `gestion-projet`
- **Build** : `vercel-build` = `prisma migrate deploy` + seed `--si-vide` + `next build`
- **Variables** : `DATABASE_URL`, `APP_PASSWORD`, `APP_SESSION_SECRET`, `NEXT_PUBLIC_APP_NAME`
- **Doc** : `gestion-projet/DEPLOIEMENT.md`

## RetroVault

- **Dossier** : `retro-vault/`
- **Base** : Supabase Postgres (Session pooler, port 5432)
- **Hébergement** : Vercel, Root Directory `retro-vault`
- **Stockage** : Supabase Storage (bucket `item-photos`)
- **Cron** : `/api/prices/refresh` à 04:17 UTC (`vercel.json`)
- **Variables** : `RETROVAULT_DATABASE_URL` (prime sur `DATABASE_URL`), `APP_PASSWORD`,
  `APP_SESSION_SECRET`, `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, `PRICECHARTING_TOKEN`,
  `USD_TO_EUR`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`, `CRON_SECRET`,
  `OWNER_EMAIL`
- **Doc** : `retro-vault/README.md`
