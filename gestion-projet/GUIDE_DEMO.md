# Script de démonstration client (≈ 20 minutes)

Objectif : montrer en 20 minutes qu'on couvre le cœur d'un outil type Genius Project, puis
faire parler le client de **son** besoin pour cadrer la V1.

## Avant la démo

- `npm run seed` le jour même (les dates sont recalées sur aujourd'hui).
- Ouvrir l'application connectée sur le **Tableau de bord**, en plein écran.

## Déroulé

1. **Tableau de bord (3 min)** — « En un coup d'œil, la direction voit son portefeuille. »
   - 4 projets actifs : vert / orange / rouge. Montrer le trait d'avancement prévu vs réel.
   - Prévision à terminaison vs budget engagé.
   - Jalons à venir et risques les plus critiques.
2. **Projet rouge « Migration infrastructure Cloud » (5 min)**
   - Synthèse : météo, commentaire de situation (le modifier en direct).
   - Budget : prévision > budget → dépassement chiffré, décomposition temps / dépenses / reste à faire.
   - Risques : matrice, le problème « applications legacy » en criticité 16.
3. **Projet orange « Déploiement ERP Finance » (5 min)**
   - Gantt par phases : tâches en retard en rouge, ligne du jour, jalons.
   - Kanban : faire glisser une tâche de « En cours » à « En revue ».
   - Ajouter une tâche en direct (« + Tâche »).
4. **Ressources (4 min)**
   - Plan de charge : surcharges en rouge (Julie, Karim, Lucas) → arbitrage.
   - Feuille de temps : saisir une demi-journée, montrer qu'elle alimente le budget.
5. **Planning portefeuille (1 min)** — vue Gantt multi-projets.
6. **Questions de cadrage (le plus important)**
   - Combien de projets / de chefs de projet / de contributeurs ?
   - Méthode : cycle en V, agile, hybride ? Besoin de dépendances et chemin critique ?
   - Qui saisit des temps ? Faut-il une validation ?
   - Quels rapports pour la direction ? Quels exports (Excel, PDF) ?
   - Outils existants à intégrer (ERP, Teams/Outlook, SSO, MS Project) ?
   - Hébergement : SaaS ou sur leur infrastructure ?

## Après la démo

Reprendre la section « Pistes pour la V1 » du `README.md` avec les réponses du client pour
chiffrer la suite.
