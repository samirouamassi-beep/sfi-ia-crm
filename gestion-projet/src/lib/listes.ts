// Listes fixes de l'application. À adapter au vocabulaire du client (ajouter un statut,
// renommer une catégorie...) : aucune migration n'est nécessaire, ce sont des chaînes.

export const STATUTS_PROJET = [
  "Cadrage",
  "En cours",
  "En pause",
  "Terminé",
  "Annulé",
] as const;

export const STATUTS_TACHE = ["À faire", "En cours", "En revue", "Terminée"] as const;

export const PRIORITES = ["Basse", "Normale", "Haute", "Critique"] as const;

export const METEOS = ["Vert", "Orange", "Rouge"] as const;

export const ROLES = [
  "Directeur technique",
  "Chef de projet",
  "Chargé d'affaires",
  "Ingénieur automaticien",
  "Ingénieur SCADA / télégestion",
  "Technicien instrumentation",
  "Technicien détection de fuites",
  "Technicien de chantier",
  "Chargé d'études / AO",
] as const;

export const CATEGORIES_DEPENSE = [
  "Instrumentation et capteurs",
  "Automates et RTU",
  "Télécom (GSM/radio/fibre)",
  "Génie civil et sous-traitance",
  "Licences SCADA",
  "Transport et déplacements",
  "Cautions et frais de marché",
  "Autre",
] as const;

// Activités du client (servent à classer projets et appels d'offres).
export const ACTIVITES = [
  "Télégestion / SCADA",
  "Automatisme",
  "Mesures physico-chimiques",
  "Détection de fuites",
  "Comptage et débitmétrie",
  "Maintenance",
] as const;

// Phases créées par défaut pour un nouveau projet (cycle type d'un marché).
export const PHASES_DEFAUT = [
  "Études et validation",
  "Approvisionnement",
  "Installation sur sites",
  "Programmation et intégration",
  "Essais et mise en service",
  "Réception",
] as const;

export const PROCEDURES_AO = ["AO ouvert", "AO restreint", "Consultation", "Bon de commande"] as const;

export const STATUTS_AO = [
  "Veille",
  "En préparation",
  "Déposé",
  "Gagné",
  "Perdu",
  "Abandonné",
] as const;

export const TYPES_RISQUE = ["Risque", "Problème"] as const;

export const STATUTS_RISQUE = ["Ouvert", "En traitement", "Clos"] as const;

export const NIVEAUX = [
  { valeur: 1, label: "Faible" },
  { valeur: 2, label: "Moyen" },
  { valeur: 3, label: "Élevé" },
  { valeur: 4, label: "Très élevé" },
] as const;

export function libelleNiveau(n: number): string {
  return NIVEAUX.find((x) => x.valeur === n)?.label ?? String(n);
}
