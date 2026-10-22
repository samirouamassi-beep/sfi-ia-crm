// Données de démonstration : une équipe, 5 projets à différents stades, des temps saisis,
// des dépenses et des risques. Les dates sont calculées par rapport à aujourd'hui pour que
// la démo paraisse toujours « vivante ». Relancer `npm run seed` remet la base à zéro.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ajouterJours, debutJour, estOuvre, joursOuvres } from "../src/lib/calculs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const AUJ = debutJour(new Date());
const j = (n: number) => ajouterJours(AUJ, n);

const MEMBRES = [
  { cle: "claire", nom: "Claire Martin", role: "Directeur de programme", taux: 950 },
  { cle: "thomas", nom: "Thomas Bernard", role: "Chef de projet", taux: 800 },
  { cle: "sophie", nom: "Sophie Dubois", role: "Chef de projet", taux: 780 },
  { cle: "karim", nom: "Karim Haddad", role: "Architecte", taux: 900 },
  { cle: "julie", nom: "Julie Moreau", role: "Développeur", taux: 620 },
  { cle: "lucas", nom: "Lucas Petit", role: "Développeur", taux: 600 },
  { cle: "emma", nom: "Emma Leroy", role: "Designer", taux: 650 },
  { cle: "nicolas", nom: "Nicolas Roux", role: "Consultant", taux: 720 },
  { cle: "ines", nom: "Inès Garnier", role: "Testeur", taux: 550 },
];

type TacheModele = {
  nom: string;
  d: number; // début, en % de la durée du projet
  f: number; // fin, en % de la durée du projet
  charge: number;
  qui: string;
  jalon?: boolean;
};

type ProjetModele = {
  code: string;
  nom: string;
  client: string;
  description: string;
  chef: string;
  statut: string;
  priorite: string;
  meteo: string;
  debut: number;
  fin: number;
  budget: number;
  commentaire: string;
  retard: number; // points d'avancement de retard par rapport au planning
  surconso: number; // coefficient appliqué aux temps saisis (1.2 = 20 % de dépassement)
  phases: { nom: string; taches: TacheModele[] }[];
  depenses: { libelle: string; categorie: string; montant: number; jour: number }[];
  risques: {
    type: string;
    titre: string;
    p: number;
    i: number;
    statut: string;
    qui: string;
    mitigation: string;
  }[];
};

const PROJETS: ProjetModele[] = [
  {
    code: "PRJ-001",
    nom: "Refonte du portail client",
    client: "Groupe Hexa",
    description:
      "Nouvelle version du portail client : espace personnel, suivi des commandes, paiement en ligne et support intégré.",
    chef: "thomas",
    statut: "En cours",
    priorite: "Haute",
    meteo: "Vert",
    debut: -60,
    fin: 75,
    budget: 125000,
    commentaire: "Sprint 3 livré dans les temps. Recette métier planifiée avec le client.",
    retard: 0,
    surconso: 0.95,
    phases: [
      {
        nom: "Cadrage",
        taches: [
          { nom: "Ateliers de recueil du besoin", d: 0, f: 8, charge: 8, qui: "thomas" },
          { nom: "Rédaction des spécifications", d: 6, f: 15, charge: 10, qui: "nicolas" },
          { nom: "Validation du cahier des charges", d: 15, f: 15, charge: 0, qui: "thomas", jalon: true },
        ],
      },
      {
        nom: "Conception",
        taches: [
          { nom: "Maquettes UX/UI", d: 12, f: 28, charge: 18, qui: "emma" },
          { nom: "Architecture technique", d: 14, f: 26, charge: 10, qui: "karim" },
        ],
      },
      {
        nom: "Réalisation",
        taches: [
          { nom: "Espace personnel et authentification", d: 28, f: 45, charge: 22, qui: "julie" },
          { nom: "Suivi des commandes", d: 38, f: 58, charge: 25, qui: "lucas" },
          { nom: "Paiement en ligne", d: 50, f: 70, charge: 20, qui: "julie" },
          { nom: "Module support et chat", d: 60, f: 78, charge: 15, qui: "lucas" },
        ],
      },
      {
        nom: "Recette et déploiement",
        taches: [
          { nom: "Recette fonctionnelle", d: 75, f: 90, charge: 16, qui: "ines" },
          { nom: "Formation des équipes client", d: 88, f: 95, charge: 5, qui: "nicolas" },
          { nom: "Mise en production", d: 100, f: 100, charge: 0, qui: "thomas", jalon: true },
        ],
      },
    ],
    depenses: [
      { libelle: "Licences outil de design", categorie: "Licences", montant: 1800, jour: -55 },
      { libelle: "Passerelle de paiement (frais d'intégration)", categorie: "Sous-traitance", montant: 6500, jour: -10 },
    ],
    risques: [
      { type: "Risque", titre: "Disponibilité des référents métier pour la recette", p: 2, i: 3, statut: "Ouvert", qui: "thomas", mitigation: "Planning de recette validé en comité, créneaux bloqués dans les agendas." },
      { type: "Risque", titre: "Évolution des exigences PSP sur le paiement", p: 1, i: 3, statut: "En traitement", qui: "karim", mitigation: "Veille avec le prestataire, abstraction de la couche paiement." },
    ],
  },
  {
    code: "PRJ-002",
    nom: "Déploiement ERP Finance",
    client: "Direction financière",
    description:
      "Déploiement du module comptabilité et contrôle de gestion de l'ERP sur 4 entités, reprise des données et conduite du changement.",
    chef: "sophie",
    statut: "En cours",
    priorite: "Critique",
    meteo: "Orange",
    debut: -120,
    fin: 45,
    budget: 260000,
    commentaire:
      "Reprise des données plus longue que prévu sur l'entité Sud. Plan de rattrapage en cours, jalon de bascule à sécuriser.",
    retard: 12,
    surconso: 1.08,
    phases: [
      {
        nom: "Analyse",
        taches: [
          { nom: "Audit des processus financiers", d: 0, f: 12, charge: 20, qui: "nicolas" },
          { nom: "Paramétrage cible (fit-gap)", d: 10, f: 25, charge: 24, qui: "sophie" },
          { nom: "Comité de validation du design", d: 25, f: 25, charge: 0, qui: "claire", jalon: true },
        ],
      },
      {
        nom: "Construction",
        taches: [
          { nom: "Paramétrage plan comptable et analytique", d: 25, f: 50, charge: 35, qui: "nicolas" },
          { nom: "Interfaces banques et paie", d: 30, f: 60, charge: 30, qui: "karim" },
          { nom: "Reprise des données entité Nord", d: 45, f: 62, charge: 18, qui: "lucas" },
          { nom: "Reprise des données entité Sud", d: 50, f: 70, charge: 22, qui: "lucas" },
        ],
      },
      {
        nom: "Tests",
        taches: [
          { nom: "Tests d'intégration", d: 62, f: 78, charge: 20, qui: "ines" },
          { nom: "Recette utilisateurs", d: 75, f: 88, charge: 18, qui: "sophie" },
        ],
      },
      {
        nom: "Bascule",
        taches: [
          { nom: "Formation des utilisateurs clés", d: 82, f: 94, charge: 12, qui: "nicolas" },
          { nom: "Bascule en production", d: 96, f: 96, charge: 0, qui: "sophie", jalon: true },
          { nom: "Support post-démarrage", d: 96, f: 100, charge: 8, qui: "julie" },
        ],
      },
    ],
    depenses: [
      { libelle: "Licences ERP (année 1)", categorie: "Licences", montant: 42000, jour: -110 },
      { libelle: "Expert intégrateur ERP", categorie: "Sous-traitance", montant: 28000, jour: -60 },
      { libelle: "Déplacements sites régionaux", categorie: "Déplacements", montant: 3400, jour: -30 },
    ],
    risques: [
      { type: "Problème", titre: "Qualité des données historiques entité Sud", p: 4, i: 3, statut: "En traitement", qui: "lucas", mitigation: "Nettoyage en binôme avec la comptabilité Sud, scripts de contrôle automatisés." },
      { type: "Risque", titre: "Bascule pendant la clôture trimestrielle", p: 3, i: 4, statut: "Ouvert", qui: "sophie", mitigation: "Étudier un décalage de la bascule de 2 semaines, arbitrage en comité de pilotage." },
      { type: "Risque", titre: "Résistance au changement des équipes comptables", p: 2, i: 2, statut: "Ouvert", qui: "nicolas", mitigation: "Ambassadeurs par entité, sessions de démonstration anticipées." },
    ],
  },
  {
    code: "PRJ-003",
    nom: "Migration infrastructure Cloud",
    client: "DSI",
    description:
      "Migration de 40 applications du datacenter vers le cloud, sécurisation et mise en place de la supervision.",
    chef: "thomas",
    statut: "En cours",
    priorite: "Haute",
    meteo: "Rouge",
    debut: -90,
    fin: 30,
    budget: 115000,
    commentaire:
      "Dépassement budgétaire lié à la refonte imprévue de 6 applications legacy. Arbitrage demandé : rallonge budgétaire ou réduction du périmètre.",
    retard: 18,
    surconso: 1.4,
    phases: [
      {
        nom: "Préparation",
        taches: [
          { nom: "Inventaire applicatif", d: 0, f: 12, charge: 10, qui: "karim" },
          { nom: "Landing zone et sécurité", d: 10, f: 30, charge: 18, qui: "karim" },
        ],
      },
      {
        nom: "Migration",
        taches: [
          { nom: "Vague 1 : applications web", d: 28, f: 50, charge: 25, qui: "julie" },
          { nom: "Vague 2 : applications métier", d: 48, f: 75, charge: 30, qui: "lucas" },
          { nom: "Vague 3 : applications legacy", d: 70, f: 92, charge: 28, qui: "karim" },
          { nom: "Fin des migrations", d: 92, f: 92, charge: 0, qui: "thomas", jalon: true },
        ],
      },
      {
        nom: "Exploitation",
        taches: [
          { nom: "Supervision et alerting", d: 60, f: 90, charge: 12, qui: "julie" },
          { nom: "Décommissionnement datacenter", d: 90, f: 100, charge: 8, qui: "karim" },
        ],
      },
    ],
    depenses: [
      { libelle: "Consommation cloud (environnements de test)", categorie: "Autre", montant: 9800, jour: -40 },
      { libelle: "Audit de sécurité externe", categorie: "Sous-traitance", montant: 12000, jour: -50 },
    ],
    risques: [
      { type: "Problème", titre: "Applications legacy non compatibles", p: 4, i: 4, statut: "Ouvert", qui: "karim", mitigation: "Refonte partielle ou conteneurisation, chiffrage en cours." },
      { type: "Risque", titre: "Coupure de service pendant la vague 3", p: 2, i: 4, statut: "Ouvert", qui: "thomas", mitigation: "Bascules la nuit et le week-end, plan de retour arrière testé." },
    ],
  },
  {
    code: "PRJ-004",
    nom: "Application mobile terrain",
    client: "Groupe Hexa",
    description:
      "Application mobile pour les techniciens d'intervention : planning, rapports d'intervention, photos et signature client.",
    chef: "sophie",
    statut: "Cadrage",
    priorite: "Normale",
    meteo: "Vert",
    debut: -5,
    fin: 150,
    budget: 62000,
    commentaire: "Kick-off réalisé. Ateliers utilisateurs avec les techniciens la semaine prochaine.",
    retard: 0,
    surconso: 1,
    phases: [
      {
        nom: "Cadrage",
        taches: [
          { nom: "Kick-off et organisation", d: 0, f: 3, charge: 2, qui: "sophie" },
          { nom: "Ateliers utilisateurs terrain", d: 3, f: 12, charge: 6, qui: "emma" },
          { nom: "Go / No go conception", d: 14, f: 14, charge: 0, qui: "sophie", jalon: true },
        ],
      },
      {
        nom: "Réalisation",
        taches: [
          { nom: "Design de l'application", d: 14, f: 30, charge: 14, qui: "emma" },
          { nom: "Développement mode hors-ligne", d: 30, f: 65, charge: 30, qui: "julie" },
          { nom: "Rapports d'intervention et signature", d: 40, f: 75, charge: 25, qui: "lucas" },
        ],
      },
      {
        nom: "Déploiement",
        taches: [
          { nom: "Pilote sur une agence", d: 78, f: 90, charge: 10, qui: "ines" },
          { nom: "Généralisation", d: 100, f: 100, charge: 0, qui: "sophie", jalon: true },
        ],
      },
    ],
    depenses: [],
    risques: [
      { type: "Risque", titre: "Couverture réseau faible sur certains sites", p: 3, i: 2, statut: "Ouvert", qui: "julie", mitigation: "Mode hors-ligne complet avec synchronisation différée." },
    ],
  },
  {
    code: "PRJ-005",
    nom: "Mise en conformité RGPD",
    client: "Direction juridique",
    description: "Cartographie des traitements, registre, mise à jour des contrats et sensibilisation.",
    chef: "claire",
    statut: "Terminé",
    priorite: "Normale",
    meteo: "Vert",
    debut: -200,
    fin: -20,
    budget: 42000,
    commentaire: "Projet clôturé. Registre remis au DPO.",
    retard: 0,
    surconso: 0.9,
    phases: [
      {
        nom: "Diagnostic",
        taches: [
          { nom: "Cartographie des traitements", d: 0, f: 30, charge: 15, qui: "nicolas" },
          { nom: "Analyse des écarts", d: 25, f: 45, charge: 10, qui: "claire" },
        ],
      },
      {
        nom: "Mise en conformité",
        taches: [
          { nom: "Registre des traitements", d: 45, f: 70, charge: 12, qui: "nicolas" },
          { nom: "Mise à jour des contrats sous-traitants", d: 50, f: 85, charge: 8, qui: "claire" },
          { nom: "Sensibilisation des collaborateurs", d: 80, f: 98, charge: 6, qui: "nicolas" },
          { nom: "Remise du registre au DPO", d: 100, f: 100, charge: 0, qui: "claire", jalon: true },
        ],
      },
    ],
    depenses: [{ libelle: "Plateforme e-learning", categorie: "Formation", montant: 2500, jour: -60 }],
    risques: [
      { type: "Risque", titre: "Sous-traitants non coopératifs", p: 2, i: 2, statut: "Clos", qui: "claire", mitigation: "Relances juridiques, avenants types." },
    ],
  },
];

async function main() {
  // `--si-vide` (utilisé au déploiement Vercel) : ne touche à rien si la base contient déjà
  // des projets, pour ne jamais écraser les données saisies.
  if (process.argv.includes("--si-vide") && (await prisma.projet.count()) > 0) {
    console.log("Base déjà alimentée : données de démonstration non rechargées.");
    return;
  }
  await prisma.temps.deleteMany();
  await prisma.depense.deleteMany();
  await prisma.risque.deleteMany();
  await prisma.tache.deleteMany();
  await prisma.phase.deleteMany();
  await prisma.projet.deleteMany();
  await prisma.membre.deleteMany();

  const membres: Record<string, { id: string; taux: number }> = {};
  for (const m of MEMBRES) {
    const cree = await prisma.membre.create({
      data: {
        nom: m.nom,
        role: m.role,
        tauxJournalier: m.taux,
        email: `${m.cle}@exemple.fr`,
        capaciteJours: m.cle === "claire" ? 3 : 5,
      },
    });
    membres[m.cle] = { id: cree.id, taux: m.taux };
  }

  for (const p of PROJETS) {
    const debut = j(p.debut);
    const fin = j(p.fin);
    const duree = p.fin - p.debut;
    const projet = await prisma.projet.create({
      data: {
        code: p.code,
        nom: p.nom,
        client: p.client,
        description: p.description,
        chefId: membres[p.chef].id,
        statut: p.statut,
        priorite: p.priorite,
        meteo: p.meteo,
        debut,
        fin,
        budget: p.budget,
        commentaire: p.commentaire,
      },
    });

    let ordre = 0;
    for (const [indexPhase, ph] of p.phases.entries()) {
      const phase = await prisma.phase.create({
        data: { projetId: projet.id, nom: ph.nom, ordre: indexPhase },
      });
      for (const t of ph.taches) {
        const tDebut = ajouterJours(debut, Math.round((duree * t.d) / 100));
        const tFin = ajouterJours(debut, Math.round((duree * t.f) / 100));
        // Avancement réaliste : proportion du temps écoulé, moins le retard du projet.
        let avancement: number;
        if (AUJ > tFin) avancement = 100;
        else if (AUJ < tDebut) avancement = 0;
        else {
          const ecoule = (AUJ.getTime() - tDebut.getTime()) / (tFin.getTime() - tDebut.getTime() || 1);
          avancement = Math.round(ecoule * 100);
        }
        // Projets en difficulté : les tâches de la 2e moitié du planning ont pris du retard.
        if (p.retard > 0 && t.f > 45 && avancement > 0) {
          avancement = AUJ > tFin ? 100 - p.retard * 2 : Math.max(5, avancement - p.retard * 2);
        }
        avancement = Math.round(avancement / 5) * 5;
        if (t.jalon) avancement = AUJ > tFin && p.retard === 0 ? 100 : avancement >= 100 ? 100 : 0;
        const statut =
          avancement >= 100 ? "Terminée" : avancement === 0 ? "À faire" : avancement >= 85 ? "En revue" : "En cours";

        const tache = await prisma.tache.create({
          data: {
            projetId: projet.id,
            phaseId: phase.id,
            nom: t.nom,
            responsableId: membres[t.qui].id,
            statut,
            priorite: t.jalon ? "Haute" : "Normale",
            jalon: !!t.jalon,
            debut: tDebut,
            fin: tFin,
            chargeJours: t.charge,
            avancement,
            ordre: ordre++,
          },
        });

        // Temps saisis chaque jour ouvré écoulé, au prorata de la charge planifiée.
        if (t.charge === 0) continue;
        const parJour = (t.charge / Math.max(joursOuvres(tDebut, tFin), 1)) * p.surconso;
        const saisies = [];
        for (let d = tDebut; d < AUJ && d <= tFin; d = ajouterJours(d, 1)) {
          if (!estOuvre(d)) continue;
          const jours = Math.min(1, Math.round(parJour * 4) / 4);
          if (jours > 0) saisies.push({ membreId: membres[t.qui].id, projetId: projet.id, tacheId: tache.id, date: d, jours });
        }
        await prisma.temps.createMany({ data: saisies });
      }
    }

    for (const d of p.depenses) {
      await prisma.depense.create({
        data: { projetId: projet.id, libelle: d.libelle, categorie: d.categorie, montant: d.montant, date: j(d.jour) },
      });
    }
    for (const r of p.risques) {
      await prisma.risque.create({
        data: {
          projetId: projet.id,
          type: r.type,
          titre: r.titre,
          probabilite: r.p,
          impact: r.i,
          statut: r.statut,
          responsableId: membres[r.qui].id,
          mitigation: r.mitigation,
          echeance: r.statut === "Clos" ? null : j(14),
        },
      });
    }
  }

  const n = await prisma.tache.count();
  const t = await prisma.temps.count();
  console.log(`Démo prête : ${MEMBRES.length} membres, ${PROJETS.length} projets, ${n} tâches, ${t} saisies de temps.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
