# Déploiement en ligne (Neon + Vercel)

L'application tourne aujourd'hui en local sur SQLite. Pour la mettre en ligne et accessible
aux 4 associés, il faut une base Postgres hébergée (Neon, gratuit) et un hébergement pour
l'application (Vercel, gratuit). Je ne peux pas créer ces comptes à ta place — voici les
étapes exactes à suivre.

## 1. Créer la base Postgres sur Neon

1. Va sur https://neon.tech et crée un compte (email ou GitHub).
2. Crée un projet, nomme-le par exemple `sfi-ia-crm`.
3. Neon te donne une chaîne de connexion du type :
   `postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Garde cette chaîne de côté, elle servira de `DATABASE_URL`.

## 2. Basculer le projet de SQLite vers Postgres

Une fois que tu as la chaîne de connexion Neon, dis-le-moi et je ferai ces changements :

- Dans `prisma/schema.prisma` : `provider = "sqlite"` → `provider = "postgresql"`.
- Dans `src/lib/db.ts` : remplacer l'adaptateur `@prisma/adapter-better-sqlite3` par
  `@prisma/adapter-pg` (déjà listé en dépendance possible, sinon `npm install @prisma/adapter-pg`).
- Régénérer le client (`npx prisma generate`) et lancer une migration fraîche contre Neon
  (`npx prisma migrate dev --name init`), puis `npm run seed` pour recréer les fondateurs,
  étapes de pipeline, paramètres de charges et les 3 comptes Metlife déjà saisis.

C'est volontairement une migration fraîche plutôt qu'un export/import : la base actuelle ne
contient que des données de référence et 3 comptes, donc repartir propre sur Neon est plus
sûr qu'un transfert de fichier SQLite.

## 3. Créer un dépôt Git (si tu veux le déploiement automatique)

```bash
git init
git add .
git commit -m "Version initiale du CRM SFI IA"
```

Puis crée un dépôt sur https://github.com/new (peut être privé) et pousse le code :

```bash
git remote add origin <url-de-ton-depot>
git push -u origin main
```

## 4. Déployer sur Vercel

1. Va sur https://vercel.com et crée un compte (le plus simple : "Continue with GitHub").
2. "Add New Project" → sélectionne le dépôt `sfi-ia-crm`.
3. Dans "Environment Variables", ajoute :
   - `DATABASE_URL` = la chaîne de connexion Neon
   - `APP_PASSWORD` = le mot de passe que les 4 associés utiliseront pour se connecter
   - `APP_SESSION_SECRET` = une valeur aléatoire longue (génère-la avec `openssl rand -base64 32`)
4. Clique sur "Deploy".

Vercel construit et déploie automatiquement à chaque `git push` sur la branche principale.

## 5. Après le déploiement

- Teste la connexion avec le mot de passe défini dans `APP_PASSWORD`.
- Le lien Vercel (`https://sfi-ia-crm-xxxx.vercel.app`) est ce que tu partages aux 3 autres
  associés.
- Tu peux ensuite relier un nom de domaine personnalisé depuis les réglages du projet Vercel.

## Sécurité et RGPD (rappel du fichier Excel d'origine)

Le fichier contient des données personnelles (contacts, salaires). Une fois en ligne :
- Change `APP_PASSWORD` régulièrement et ne le partage qu'aux 4 associés.
- Le champ Notes reste le principal risque RGPD : n'y écris rien que tu ne dirais pas à la
  personne concernée.
