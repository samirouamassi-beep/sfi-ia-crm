# Mise en ligne de la démo (Neon + Vercel)

Même procédure que le CRM, avec une base et un projet Vercel séparés.

## 1. Base Postgres sur Neon

1. Sur https://neon.tech, crée un nouveau projet (ex. `pilotis-demo`).
2. Copie la chaîne de connexion `postgresql://...?sslmode=require`.

## 2. Initialisation de la base : automatique

Rien à lancer à la main. Au déploiement, Vercel exécute le script `vercel-build` :
`prisma migrate deploy` (crée / met à jour les tables) puis `prisma/seed.ts --si-vide`
(charge les données de démonstration **uniquement si la base ne contient aucun projet**),
puis `next build`.

Pour `DATABASE_URL`, utiliser la chaîne Neon **sans `-pooler`** dans le nom d'hôte
(connexion directe) : les migrations Prisma ne passent pas de façon fiable par le pooler.

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

Relancer le seed complet pour recaler les dates de démonstration sur le jour J (et effacer ce
que le client aura saisi lors d'une précédente démo), depuis un poste qui a accès à Neon :

```bash
DATABASE_URL="<chaîne Neon>" npm run seed
```
