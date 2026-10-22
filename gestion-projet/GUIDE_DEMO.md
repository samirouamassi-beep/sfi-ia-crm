# Script de démonstration client (≈ 25 minutes)

**Contexte client** : intégrateur en télégestion, automatisme, mesures physico-chimiques et
détection de fuites, qui répond aux appels d'offres de l'ONEE (Branche Eau), des SRM et des
régies. Ses enjeux : gagner les AO, tenir les délais de marchés à pénalités, protéger la
marge face aux achats de matériel et aux imprévus de chantier, et répartir des techniciens
rares entre plusieurs chantiers.

Message clé : **« De l'appel d'offres à la réception provisoire, un seul outil pour piloter
vos marchés, vos équipes terrain et votre marge. »**

> Toutes les données de la démo (marchés, montants, références d'AO, noms) sont fictives.

## Avant la démo

- Ouvrir l'application connectée sur le **Tableau de bord**, en plein écran.
- Les dates sont recalées sur le jour du chargement des données (voir `DEPLOIEMENT.md`).

## Déroulé

### 1. Tableau de bord (3 min) — la vision direction

- 4 marchés en cours pour 15,3 M MAD : un rouge, un orange, deux verts.
- Pour chaque marché : avancement réel vs prévu (trait vertical), consommé vs montant du
  marché, prochain jalon (réception provisoire…), alertes.
- **Appels d'offres à déposer** : l'AO débitmètres de l'ONEE est à J-6.
- Risques les plus critiques, tous chantiers confondus.

### 2. Appels d'offres (4 min) — le nerf de la guerre

- Offres en cours, montant en jeu, **taux de réussite**, **cautions provisoires immobilisées**.
- Échéances en rouge à moins de 7 jours ; notes (visite des lieux, pièces manquantes).
- Montrer un AO perdu (moins-disant à -11 %) : capitaliser sur les prix des concurrents.
- Ouvrir l'AO déposé auprès de la SRM Souss-Massa → **« Marché gagné → créer le projet »** :
  le projet est créé avec le maître d'ouvrage, le n° de marché, le montant et les phases types
  (études, approvisionnement, installation, programmation, essais, réception).

### 3. Marché en dérive : analyseurs qualité de l'eau ONEE (5 min)

- Synthèse : météo rouge, commentaire (travaux hors bordereau, avenant à négocier). Le
  modifier en direct.
- **Budget** : prévision à terminaison > montant du marché → perte chiffrée, décomposition
  temps passés / matériel / reste à faire. C'est l'argument pour négocier l'avenant à temps.
- **Risques** : « Travaux hors bordereau » en criticité 16.

### 4. Marché en retard : sectorisation et détection de fuites RADEEF (5 min)

- **Gantt** : campagne de corrélation en retard (rouge) après le blocage en douane,
  réception provisoire en jalon.
- **Kanban** : faire glisser une tâche (« Mesure des débits de nuit ») vers « En revue ».
- Ajouter une tâche en direct (« + Tâche »), par exemple « Intervention de nuit secteur 12 ».

### 5. Équipes terrain (4 min)

- **Plan de charge** : techniciens instrumentation et chantier en surcharge sur les mêmes
  semaines → arbitrage entre chantiers ou renfort intérimaire.
- **Feuille de temps** : saisir une demi-journée sur un site, montrer qu'elle alimente le
  coût du marché.

### 6. Planning portefeuille (1 min)

Vue Gantt de tous les marchés avec leurs jalons de réception.

### 7. Questions de cadrage (le plus important, 5 min)

- Combien d'AO par an ? Qui les prépare ? Souhaitez-vous gérer les pièces (CPS, RC, BPDE,
  attestations, cautions) et une bibliothèque de références / prix ?
- Combien de marchés en parallèle, de chefs de projet, de techniciens ?
- Suivi par **site** (réservoir, station, forage) avec équipements installés, n° de série,
  photos et PV de mise en service ?
- **Décomptes et attachements**, révision des prix, retenue de garantie, pénalités de retard,
  réception provisoire / définitive, mainlevée des cautions ?
- Maintenance après réception (contrats, interventions préventives / curatives, astreintes) ?
- Saisie des temps et des interventions depuis le terrain (mobile, hors-ligne) ?
- Lien avec la comptabilité / l'ERP, le SCADA, Outlook / Teams ? Langues (français, arabe) ?
- Hébergement : cloud ou serveur interne ?

## Après la démo

Reprendre la section « Pistes pour la V1 » du `README.md` avec les réponses du client pour
chiffrer la suite.
