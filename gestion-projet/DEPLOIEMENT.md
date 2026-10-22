# Mise en ligne de la démo (Neon + Vercel)

Même procédure que le CRM, avec une base et un projet Vercel séparés.

## 1. Base Postgres sur Neon

1. Sur https://neon.tech, crée un nouveau projet (ex. `pilotis-demo`).
2. Copie la chaîne de connexion `postgresql://...?sslmode=require`.

## 2. Initialiser la base

Depuis ta machine, dans le dossier `gestion-projet` :

```bash
npm install
DATABASE_URL="<chaîne Neon>" npx prisma migrate deploy
DATABASE_URL="<chaîne Neon>" npm run seed
```

## 3. Projet Vercel

1. https://vercel.com → **Add New Project** → sélectionne le dépôt `sfi-ia-crm`.
2. **Root Directory** : `gestion-projet` (important : l'application est dans ce sous-dossier).
3. Variables d'environnement :
   - `DATABASE_URL` = la chaîne Neon
   - `APP_PASSWORD` = le mot de passe à donner au client pour la démo
   - `APP_SESSION_SECRET` = `openssl rand -base64 32`
   - `NEXT_PUBLIC_APP_NAME` = (optionnel) nom du produit affiché
4. **Deploy**.

## 4. Avant chaque présentation

Relancer le seed pour recaler les dates de démonstration sur le jour J (et effacer ce que le
client aura saisi lors d'une précédente démo) :

```bash
DATABASE_URL="<chaîne Neon>" npm run seed
```
