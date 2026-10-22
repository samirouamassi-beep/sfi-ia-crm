// Données de démonstration (fictives) d'un intégrateur télégestion / automatisme / mesures
// pour l'ONEE, les SRM et les régies : équipe, appels d'offres, 5 projets à différents stades,
// temps saisis, dépenses et risques. Les dates sont calculées par rapport à aujourd'hui pour que
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

// Équipe type d'un intégrateur télégestion / automatisme / instrumentation (coûts
// journaliers internes en DH). Toutes les données ci-dessous sont fictives.
const MEMBRES = [
  { cle: "youssef", nom: "Youssef El Amrani", role: "Directeur technique", taux: 4500 },
  { cle: "hicham", nom: "Hicham Benali", role: "Chef de projet", taux: 3500 },
  { cle: "salma", nom: "Salma Idrissi", role: "Chef de projet", taux: 3500 },
  { cle: "omar", nom: "Omar Tazi", role: "Ingénieur SCADA / télégestion", taux: 3000 },
  { cle: "nadia", nom: "Nadia Chraibi", role: "Ingénieur automaticien", taux: 2800 },
  { cle: "rachid", nom: "Rachid Ouazzani", role: "Technicien instrumentation", taux: 1600 },
  { cle: "khalid", nom: "Khalid Bennani", role: "Technicien détection de fuites", taux: 1600 },
  { cle: "mehdi", nom: "Mehdi Fassi", role: "Technicien de chantier", taux: 1400 },
  { cle: "imane", nom: "Imane Alaoui", role: "Chargé d'études / AO", taux: 2500 },
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
  numeroMarche: string;
  description: string;
  chef: string;
  statut: string;
  priorite: string;
  meteo: string;
  debut: number;
  fin: number;
  budget: number; // montant du marché (DH HT)
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
    nom: "Télégestion de 42 réservoirs et stations de pompage",
    client: "SRM Marrakech-Safi",
    numeroMarche: "18/2026/SRM-MS",
    description:
      "Équipement de 42 sites (réservoirs, stations de pompage, bâches) en postes locaux de télégestion : RTU, capteurs de niveau et de pression, débitmètres, communication GSM/4G et supervision SCADA centralisée au poste de commande.",
    chef: "hicham",
    statut: "En cours",
    priorite: "Haute",
    meteo: "Vert",
    debut: -70,
    fin: 90,
    budget: 5200000,
    commentaire:
      "28 sites sur 42 équipés. Approvisionnement RTU soldé. Essais de communication 4G concluants sur la zone d'Al Haouz.",
    retard: 0,
    surconso: 0.95,
    phases: [
      {
        nom: "Études et validation",
        taches: [
          { nom: "Relevés et visites des 42 sites", d: 0, f: 10, charge: 24, qui: "mehdi" },
          { nom: "Architecture télégestion et plan de communication", d: 4, f: 14, charge: 12, qui: "omar" },
          { nom: "Validation des études par le maître d'ouvrage", d: 15, f: 15, charge: 0, qui: "hicham", jalon: true },
        ],
      },
      {
        nom: "Approvisionnement",
        taches: [
          { nom: "Commande et réception RTU, capteurs et armoires", d: 14, f: 32, charge: 6, qui: "hicham" },
        ],
      },
      {
        nom: "Installation sur sites",
        taches: [
          { nom: "Pose capteurs de niveau et de pression (lot 1 : 21 sites)", d: 30, f: 52, charge: 42, qui: "rachid" },
          { nom: "Pose capteurs et armoires (lot 2 : 21 sites)", d: 48, f: 72, charge: 42, qui: "mehdi" },
        ],
      },
      {
        nom: "Programmation et intégration",
        taches: [
          { nom: "Programmation des RTU et tables d'échange", d: 32, f: 62, charge: 30, qui: "nadia" },
          { nom: "Synoptiques et alarmes du SCADA central", d: 40, f: 75, charge: 32, qui: "omar" },
        ],
      },
      {
        nom: "Essais et mise en service",
        taches: [
          { nom: "Essais site par site et tests d'alarmes", d: 70, f: 90, charge: 26, qui: "rachid" },
          { nom: "Formation des exploitants", d: 88, f: 95, charge: 6, qui: "omar" },
        ],
      },
      {
        nom: "Réception",
        taches: [{ nom: "Réception provisoire", d: 100, f: 100, charge: 0, qui: "hicham", jalon: true }],
      },
    ],
    depenses: [
      { libelle: "42 RTU et modules 4G", categorie: "Automates et RTU", montant: 1260000, jour: -45 },
      { libelle: "Capteurs de niveau radar et transmetteurs de pression", categorie: "Instrumentation et capteurs", montant: 880000, jour: -42 },
      { libelle: "Licence SCADA serveur + 2 postes", categorie: "Licences SCADA", montant: 260000, jour: -40 },
      { libelle: "Abonnements data 4G (12 mois)", categorie: "Télécom (GSM/radio/fibre)", montant: 95000, jour: -30 },
      { libelle: "Génie civil : socles et regards (sous-traitance)", categorie: "Génie civil et sous-traitance", montant: 420000, jour: -15 },
      { libelle: "Caution définitive (frais bancaires)", categorie: "Cautions et frais de marché", montant: 38000, jour: -68 },
      { libelle: "Débitmètres et armoires du lot 2 (21 sites)", categorie: "Instrumentation et capteurs", montant: 620000, jour: 20 },
    ],
    risques: [
      { type: "Risque", titre: "Couverture 4G insuffisante sur 6 sites de montagne", p: 3, i: 3, statut: "En traitement", qui: "omar", mitigation: "Liaison radio de secours sur les sites concernés, étude de propagation en cours." },
      { type: "Risque", titre: "Accès aux sites conditionné par les équipes d'exploitation", p: 2, i: 2, statut: "Ouvert", qui: "hicham", mitigation: "Planning hebdomadaire partagé avec le centre d'exploitation." },
    ],
  },
  {
    code: "PRJ-002",
    nom: "Sectorisation et détection de fuites du réseau de distribution",
    client: "RADEEF (Régie de Fès)",
    numeroMarche: "07/2026/RADEEF",
    description:
      "Découpage du réseau en 24 secteurs hydrauliques, pose de débitmètres de sectorisation, campagne de prélocalisation acoustique et corrélation, localisation des fuites et rapport de rendement (bilan hydraulique, ILI).",
    chef: "salma",
    statut: "En cours",
    priorite: "Critique",
    meteo: "Orange",
    debut: -110,
    fin: 50,
    budget: 3400000,
    commentaire:
      "Corrélateurs acoustiques bloqués 3 semaines en dédouanement : la campagne de localisation a glissé. Plan de rattrapage avec une équipe de nuit à valider en réunion de chantier.",
    retard: 12,
    surconso: 1.08,
    phases: [
      {
        nom: "Études et validation",
        taches: [
          { nom: "Analyse des plans réseau et données de production", d: 0, f: 12, charge: 14, qui: "omar" },
          { nom: "Définition des 24 secteurs et points de comptage", d: 8, f: 22, charge: 16, qui: "salma" },
          { nom: "Validation du plan de sectorisation", d: 22, f: 22, charge: 0, qui: "youssef", jalon: true },
        ],
      },
      {
        nom: "Installation sur sites",
        taches: [
          { nom: "Génie civil des chambres de comptage", d: 22, f: 45, charge: 30, qui: "mehdi" },
          { nom: "Pose des débitmètres électromagnétiques de secteur", d: 35, f: 58, charge: 28, qui: "rachid" },
        ],
      },
      {
        nom: "Campagne de détection",
        taches: [
          { nom: "Prélocalisation acoustique (enregistreurs de bruit)", d: 50, f: 70, charge: 36, qui: "khalid" },
          { nom: "Corrélation et localisation des fuites", d: 60, f: 85, charge: 40, qui: "khalid" },
          { nom: "Mesure des débits de nuit par secteur", d: 55, f: 80, charge: 18, qui: "rachid" },
        ],
      },
      {
        nom: "Réception",
        taches: [
          { nom: "Bilan hydraulique et rapport de rendement (ILI)", d: 82, f: 95, charge: 14, qui: "omar" },
          { nom: "Réception provisoire", d: 97, f: 97, charge: 0, qui: "salma", jalon: true },
        ],
      },
    ],
    depenses: [
      { libelle: "24 débitmètres électromagnétiques DN100 à DN400", categorie: "Instrumentation et capteurs", montant: 860000, jour: -70 },
      { libelle: "Enregistreurs de bruit et corrélateur acoustique", categorie: "Instrumentation et capteurs", montant: 640000, jour: -45 },
      { libelle: "Chambres de comptage (sous-traitance génie civil)", categorie: "Génie civil et sous-traitance", montant: 450000, jour: -55 },
      { libelle: "Frais de dédouanement et transit", categorie: "Transport et déplacements", montant: 42000, jour: -25 },
      { libelle: "Location d'un corrélateur de secours", categorie: "Instrumentation et capteurs", montant: 60000, jour: 5 },
      { libelle: "Logiciel de modélisation hydraulique (licence)", categorie: "Licences SCADA", montant: 90000, jour: 30 },
    ],
    risques: [
      { type: "Problème", titre: "Retard de dédouanement des corrélateurs acoustiques", p: 4, i: 3, statut: "En traitement", qui: "salma", mitigation: "Location d'un corrélateur en attendant, équipe de nuit pour rattraper la campagne." },
      { type: "Risque", titre: "Autorisations de coupure d'eau pour la pose des débitmètres", p: 3, i: 3, statut: "Ouvert", qui: "rachid", mitigation: "Demandes groupées à la régie, interventions la nuit." },
      { type: "Risque", titre: "Bruit de circulation perturbant l'écoute en centre-ville", p: 2, i: 2, statut: "Ouvert", qui: "khalid", mitigation: "Écoute entre 1 h et 4 h du matin." },
    ],
  },
  {
    code: "PRJ-003",
    nom: "Analyseurs en ligne de la qualité de l'eau (chlore, pH, turbidité)",
    client: "ONEE – Branche Eau",
    numeroMarche: "52/2026/ONEE-BE",
    description:
      "Fourniture, installation et intégration en télégestion d'analyseurs multiparamètres (chlore résiduel, pH, turbidité, conductivité, température) sur 15 stations de traitement et de reprise.",
    chef: "hicham",
    statut: "En cours",
    priorite: "Haute",
    meteo: "Rouge",
    debut: -90,
    fin: 30,
    budget: 2600000,
    commentaire:
      "Dépassement prévisionnel : 4 stations nécessitent des cabines d'analyse et des pompes d'échantillonnage non prévues au bordereau des prix. Avenant à négocier avec l'ONEE, sinon réduction du périmètre.",
    retard: 18,
    surconso: 1.4,
    phases: [
      {
        nom: "Études et validation",
        taches: [
          { nom: "Audit des points de prélèvement des 15 stations", d: 0, f: 12, charge: 12, qui: "rachid" },
          { nom: "Note de calcul et fiches techniques analyseurs", d: 8, f: 25, charge: 10, qui: "nadia" },
        ],
      },
      {
        nom: "Installation sur sites",
        taches: [
          { nom: "Installation des analyseurs (stations 1 à 8)", d: 28, f: 55, charge: 24, qui: "rachid" },
          { nom: "Installation des analyseurs (stations 9 à 15)", d: 50, f: 80, charge: 24, qui: "mehdi" },
        ],
      },
      {
        nom: "Programmation et intégration",
        taches: [
          { nom: "Remontée des mesures et seuils d'alarme dans le SCADA", d: 45, f: 85, charge: 26, qui: "omar" },
          { nom: "Fin d'intégration des 15 stations", d: 88, f: 88, charge: 0, qui: "hicham", jalon: true },
        ],
      },
      {
        nom: "Essais et mise en service",
        taches: [
          { nom: "Étalonnage et comparaison avec analyses laboratoire", d: 80, f: 95, charge: 14, qui: "rachid" },
          { nom: "Réception provisoire", d: 100, f: 100, charge: 0, qui: "hicham", jalon: true },
        ],
      },
    ],
    depenses: [
      { libelle: "15 analyseurs multiparamètres (chlore, pH, turbidité, conductivité)", categorie: "Instrumentation et capteurs", montant: 1780000, jour: -60 },
      { libelle: "Cabines d'analyse et pompes d'échantillonnage (hors bordereau)", categorie: "Instrumentation et capteurs", montant: 480000, jour: -20 },
      { libelle: "Réactifs et kits d'étalonnage", categorie: "Instrumentation et capteurs", montant: 85000, jour: -15 },
      { libelle: "Déplacements stations (Oriental et Saïss)", categorie: "Transport et déplacements", montant: 64000, jour: -10 },
    ],
    risques: [
      { type: "Problème", titre: "Travaux hors bordereau sur 4 stations (cabines d'analyse)", p: 4, i: 4, statut: "Ouvert", qui: "hicham", mitigation: "Ordre de service et avenant à négocier avec l'ONEE, chiffrage remis." },
      { type: "Risque", titre: "Dérive des mesures de chlore sans maintenance régulière", p: 3, i: 3, statut: "Ouvert", qui: "rachid", mitigation: "Proposer un contrat de maintenance préventive trimestriel." },
    ],
  },
  {
    code: "PRJ-004",
    nom: "Automatisation de la station de traitement et des forages",
    client: "SRM Casablanca-Settat",
    numeroMarche: "31/2026/SRM-CS",
    description:
      "Automatisation de la station de traitement (filtration, chloration) et de 9 forages : automates, variateurs, analyse en continu et intégration au SCADA de la SRM.",
    chef: "salma",
    statut: "Cadrage",
    priorite: "Normale",
    meteo: "Vert",
    debut: -5,
    fin: 160,
    budget: 4100000,
    commentaire: "Ordre de service reçu. Réunion de démarrage tenue, visites des forages planifiées.",
    retard: 0,
    surconso: 1,
    phases: [
      {
        nom: "Études et validation",
        taches: [
          { nom: "Réunion de démarrage et planning détaillé", d: 0, f: 3, charge: 3, qui: "salma" },
          { nom: "Visites des 9 forages et de la station", d: 2, f: 10, charge: 10, qui: "nadia" },
          { nom: "Analyse fonctionnelle et schémas électriques", d: 8, f: 22, charge: 18, qui: "nadia" },
          { nom: "Validation des études d'exécution", d: 24, f: 24, charge: 0, qui: "salma", jalon: true },
        ],
      },
      {
        nom: "Réalisation",
        taches: [
          { nom: "Fabrication et tests des armoires en atelier", d: 25, f: 50, charge: 30, qui: "mehdi" },
          { nom: "Programmation automates et variateurs", d: 40, f: 70, charge: 35, qui: "nadia" },
          { nom: "Intégration au SCADA de la SRM", d: 65, f: 85, charge: 20, qui: "omar" },
        ],
      },
      {
        nom: "Réception",
        taches: [
          { nom: "Essais de fonctionnement et mise en service", d: 85, f: 97, charge: 15, qui: "nadia" },
          { nom: "Réception provisoire", d: 100, f: 100, charge: 0, qui: "salma", jalon: true },
        ],
      },
    ],
    depenses: [
      { libelle: "Armoires électriques station et forages", categorie: "Automates et RTU", montant: 520000, jour: 35 },
      { libelle: "Automates et cartes d'entrées/sorties", categorie: "Automates et RTU", montant: 780000, jour: 40 },
      { libelle: "9 variateurs de vitesse pompes de forage", categorie: "Automates et RTU", montant: 690000, jour: 45 },
      { libelle: "Analyseurs chlore et turbidité de la station", categorie: "Instrumentation et capteurs", montant: 420000, jour: 60 },
      { libelle: "Génie civil local électrique (sous-traitance)", categorie: "Génie civil et sous-traitance", montant: 300000, jour: 70 },
      { libelle: "Licences SCADA (extension)", categorie: "Licences SCADA", montant: 150000, jour: 100 },
    ],
    risques: [
      { type: "Risque", titre: "Délais de livraison des variateurs de vitesse (12 semaines)", p: 3, i: 2, statut: "Ouvert", qui: "salma", mitigation: "Commande anticipée dès la validation des études." },
    ],
  },
  {
    code: "PRJ-005",
    nom: "Extension et maintenance du système SCADA",
    client: "RADEEMA (Régie de Marrakech)",
    numeroMarche: "11/2025/RADEEMA",
    description: "Mise à niveau du serveur SCADA, intégration de 12 nouveaux sites et maintenance préventive annuelle.",
    chef: "youssef",
    statut: "Terminé",
    priorite: "Normale",
    meteo: "Vert",
    debut: -220,
    fin: -25,
    budget: 820000,
    commentaire: "Réception provisoire prononcée. Période de garantie en cours.",
    retard: 0,
    surconso: 0.9,
    phases: [
      {
        nom: "Réalisation",
        taches: [
          { nom: "Migration du serveur SCADA", d: 0, f: 20, charge: 12, qui: "omar" },
          { nom: "Intégration des 12 nouveaux sites", d: 20, f: 60, charge: 28, qui: "omar" },
          { nom: "Maintenance préventive des postes locaux", d: 40, f: 90, charge: 30, qui: "rachid" },
        ],
      },
      {
        nom: "Réception",
        taches: [
          { nom: "Dossier des ouvrages exécutés (DOE)", d: 88, f: 98, charge: 6, qui: "youssef" },
          { nom: "Réception provisoire", d: 100, f: 100, charge: 0, qui: "youssef", jalon: true },
        ],
      },
    ],
    depenses: [
      { libelle: "Serveur et licences SCADA (mise à niveau)", categorie: "Licences SCADA", montant: 210000, jour: -200 },
      { libelle: "Pièces de rechange postes locaux", categorie: "Automates et RTU", montant: 160000, jour: -120 },
    ],
    risques: [
      { type: "Risque", titre: "Interruption de supervision pendant la migration", p: 2, i: 3, statut: "Clos", qui: "omar", mitigation: "Migration de nuit avec serveur de secours." },
    ],
  },
];

// Appels d'offres en cours et passés. `projet` relie un AO gagné au projet qui en est issu.
const APPELS_OFFRES = [
  {
    reference: "AO 64/2026/ONEE-BE",
    maitreOuvrage: "ONEE – Branche Eau",
    objet: "Fourniture et pose de débitmètres électromagnétiques sur adductions régionales",
    procedure: "AO ouvert",
    activite: "Comptage et débitmétrie",
    jour: 6,
    estime: 3800000,
    statut: "En préparation",
    qui: "imane",
    notes: "Visite des lieux obligatoire faite. Reste : bordereau des prix et attestation de référence ONEE.",
  },
  {
    reference: "AO 22/2026/SRM-RSK",
    maitreOuvrage: "SRM Rabat-Salé-Kénitra",
    objet: "Télégestion des forages et réservoirs de la province de Kénitra",
    procedure: "AO ouvert",
    activite: "Télégestion / SCADA",
    jour: 18,
    estime: 5500000,
    statut: "En préparation",
    qui: "omar",
    notes: "Lot unique. Interopérabilité exigée avec le SCADA existant de la SRM.",
  },
  {
    reference: "Consultation 03/2026/RADEEJ",
    maitreOuvrage: "RADEEJ (Régie d'El Jadida)",
    objet: "Campagne de recherche de fuites et sectorisation du centre-ville",
    procedure: "Consultation",
    activite: "Détection de fuites",
    jour: 30,
    estime: 1200000,
    statut: "Veille",
    qui: "khalid",
    notes: "Avis publié sur le portail des marchés publics. Décision go / no go à prendre.",
  },
  {
    reference: "AO 15/2026/SRM-SM",
    maitreOuvrage: "SRM Souss-Massa",
    objet: "Mesure en continu des paramètres physico-chimiques des stations de reprise",
    procedure: "AO ouvert",
    activite: "Mesures physico-chimiques",
    jour: -10,
    estime: 3100000,
    soumis: 2950000,
    caution: 60000,
    statut: "Déposé",
    qui: "imane",
    notes: "Ouverture des plis effectuée, 4 soumissionnaires. Résultats attendus sous 3 semaines.",
  },
  {
    reference: "AO 09/2026/RADEES",
    maitreOuvrage: "RADEES (Régie de Safi)",
    objet: "Automatisation des stations de pompage",
    procedure: "AO ouvert",
    activite: "Automatisme",
    jour: -45,
    estime: 2300000,
    soumis: 2180000,
    caution: 40000,
    statut: "Perdu",
    qui: "nadia",
    notes: "Attribué au moins-disant (-11 % sur notre offre). Caution provisoire restituée.",
  },
  {
    reference: "18/2026/SRM-MS",
    maitreOuvrage: "SRM Marrakech-Safi",
    objet: "Télégestion de 42 réservoirs et stations de pompage",
    procedure: "AO ouvert",
    activite: "Télégestion / SCADA",
    jour: -95,
    estime: 5600000,
    soumis: 5200000,
    caution: 100000,
    statut: "Gagné",
    qui: "hicham",
    notes: "Marché notifié.",
    projet: "PRJ-001",
  },
  {
    reference: "52/2026/ONEE-BE",
    maitreOuvrage: "ONEE – Branche Eau",
    objet: "Analyseurs en ligne de la qualité de l'eau (chlore, pH, turbidité)",
    procedure: "AO ouvert",
    activite: "Mesures physico-chimiques",
    jour: -110,
    estime: 2900000,
    soumis: 2600000,
    caution: 50000,
    statut: "Gagné",
    qui: "imane",
    notes: "Marché notifié.",
    projet: "PRJ-003",
  },
];

async function main() {
  // `--si-vide` (utilisé au déploiement Vercel) : ne touche à rien si la base contient déjà
  // des projets, pour ne jamais écraser les données saisies.
  // Exception : une démo d'une version précédente est remplacée. La toute première démo
  // (générique) se reconnaît à son projet « Refonte du portail client ».
  // Idem pour la démo eau / télégestion d'avant les dépendances et cautions (aucune dépendance).
  const ancienneDemo =
    (await prisma.projet.count({ where: { nom: "Refonte du portail client" } })) +
    ((await prisma.projet.count({ where: { nom: "Télégestion de 42 réservoirs et stations de pompage" } })) > 0 &&
    (await prisma.dependance.count()) === 0
      ? 1
      : 0);
  if (process.argv.includes("--si-vide") && (await prisma.projet.count()) > 0 && ancienneDemo === 0) {
    console.log("Base déjà alimentée : données de démonstration non rechargées.");
    return;
  }
  await prisma.caution.deleteMany();
  await prisma.dependance.deleteMany();
  await prisma.appelOffre.deleteMany();
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
        email: `${m.cle}@exemple.ma`,
        capaciteJours: m.cle === "youssef" ? 3 : 5,
      },
    });
    membres[m.cle] = { id: cree.id, taux: m.taux };
  }

  const projets: Record<string, string> = {};
  for (const p of PROJETS) {
    const debut = j(p.debut);
    const fin = j(p.fin);
    const duree = p.fin - p.debut;
    const projet = await prisma.projet.create({
      data: {
        code: p.code,
        nom: p.nom,
        client: p.client,
        numeroMarche: p.numeroMarche,
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
    projets[p.code] = projet.id;

    let ordre = 0;
    const creees: { id: string; debut: Date; fin: Date; phase: number }[] = [];
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

        // Projets en retard : les tâches de la fin du planning ont glissé par rapport au
        // planning de référence (déjà commencées : seule la fin glisse).
        const glissement = p.retard > 0 && t.d >= 55 ? p.retard : 0;
        const debutReel = glissement && tDebut > AUJ ? ajouterJours(tDebut, glissement) : tDebut;
        const finReelle = ajouterJours(tFin, glissement);
        const avecReference = p.statut !== "Cadrage";

        const tache = await prisma.tache.create({
          data: {
            projetId: projet.id,
            phaseId: phase.id,
            nom: t.nom,
            responsableId: membres[t.qui].id,
            statut,
            priorite: t.jalon ? "Haute" : "Normale",
            jalon: !!t.jalon,
            debut: t.jalon ? finReelle : debutReel,
            fin: finReelle,
            chargeJours: t.charge,
            avancement,
            ordre: ordre++,
            baselineDebut: avecReference ? tDebut : null,
            baselineFin: avecReference ? tFin : null,
            baselineCharge: avecReference ? t.charge : null,
          },
        });
        creees.push({ id: tache.id, debut: t.jalon ? finReelle : debutReel, fin: finReelle, phase: indexPhase });

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

    // Dépendances : chaque tâche suit la tâche des phases précédentes qui finit juste avant elle.
    const liens = [];
    for (const t of creees) {
      const avant = creees
        .filter((x) => x.phase < t.phase && x.fin < t.debut)
        .sort((a, b) => b.fin.getTime() - a.fin.getTime())[0];
      if (avant) liens.push({ predecesseurId: avant.id, successeurId: t.id });
    }
    await prisma.dependance.createMany({ data: liens });
    if (p.statut !== "Cadrage") {
      await prisma.projet.update({ where: { id: projet.id }, data: { baselineLe: j(p.debut + 10) } });
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

  const BANQUES = ["Attijariwafa bank", "Bank of Africa", "Banque Populaire", "CIH Bank"];
  for (const [i, a] of APPELS_OFFRES.entries()) {
    const ao = await prisma.appelOffre.create({
      data: {
        reference: a.reference,
        maitreOuvrage: a.maitreOuvrage,
        objet: a.objet,
        procedure: a.procedure,
        activite: a.activite,
        dateLimite: j(a.jour),
        montantEstime: a.estime,
        montantSoumis: a.soumis ?? null,
        statut: a.statut,
        responsableId: membres[a.qui].id,
        notes: a.notes,
        projetId: a.projet ? projets[a.projet] : null,
      },
    });
    const banque = BANQUES[i % BANQUES.length];
    if (a.caution) {
      // Provisoire : restituée sur les marchés gagnés ; sur l'AO perdu, la restitution est
      // en retard (montre l'alerte « relancer la mainlevée »).
      const restituee = a.statut === "Gagné";
      await prisma.caution.create({
        data: {
          appelOffreId: ao.id,
          type: "Provisoire",
          montant: a.caution,
          banque,
          reference: `CP-${2026}-${String(i + 101)}`,
          dateEmission: j(a.jour - 5),
          dateEcheance: a.statut === "Perdu" ? j(-5) : j(a.jour + 75),
          statut: restituee ? "Restituée / mainlevée" : "Déposée",
        },
      });
    }
    const projetModele = PROJETS.find((p) => p.code === a.projet);
    if (a.statut === "Gagné" && a.soumis && projetModele) {
      // Définitive : 3 % du marché, jusqu'à la réception définitive (1 an après la provisoire).
      await prisma.caution.create({
        data: {
          appelOffreId: ao.id,
          type: "Définitive",
          montant: Math.round(a.soumis * 0.03),
          banque,
          reference: `CD-${2026}-${String(i + 201)}`,
          dateEmission: j(a.jour + 25),
          dateEcheance: j(projetModele.fin + 365),
          statut: "Déposée",
        },
      });
    }
  }

  const n = await prisma.tache.count();
  const t = await prisma.temps.count();
  console.log(`Démo prête : ${MEMBRES.length} membres, ${PROJETS.length} projets, ${APPELS_OFFRES.length} appels d'offres, ${await prisma.caution.count()} cautions, ${await prisma.dependance.count()} dépendances, ${n} tâches, ${t} saisies de temps.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
