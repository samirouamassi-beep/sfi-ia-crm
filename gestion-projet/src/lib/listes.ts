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
  "Chef de projet",
  "Directeur de programme",
  "Consultant",
  "Développeur",
  "Designer",
  "Architecte",
  "Testeur",
  "PMO",
] as const;

export const CATEGORIES_DEPENSE = [
  "Sous-traitance",
  "Licences",
  "Matériel",
  "Déplacements",
  "Formation",
  "Autre",
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
