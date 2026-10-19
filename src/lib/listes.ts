// Listes deroulantes, calquees sur l'onglet "Listes" du fichier Excel d'origine.
// Modifiable ici si la structure de l'equipe evolue (contrairement a Fondateur et
// EtapePipeline/Parametre qui sont en base et editables depuis /parametres).

export const CATEGORIES_COMPTE = [
  "Client actif",
  "Prospect",
  "Partenaire intégrateur",
  "Éditeur Salesforce",
  "Cabinet de recrutement",
  "Autre",
] as const;

export const STATUTS_RELATION = [
  "À qualifier",
  "Premier contact",
  "En discussion",
  "Proposition en cours",
  "Actif",
  "En veille",
  "Perdu",
] as const;

export const TYPES_CONTRAT = [
  "Salarié FR",
  "Salarié MA",
  "Freelance FR",
  "Freelance MA",
  "Sous-traitant",
  "Alternant / Académie",
  "Associé fondateur",
] as const;

export const ENTITES = ["Holding", "Hub FR", "Hub MA", "Externe"] as const;

export const NIVEAUX = ["Junior", "Confirmé", "Senior", "Expert", "Architecte"] as const;

export const STATUTS_RESSOURCE = [
  "Vivier – non contacté",
  "Vivier – qualifié",
  "Disponible",
  "En mission",
  "Partiellement disponible",
  "Sortie",
  "Écarté",
] as const;

export const TYPES_OFFRE = [
  "Régie",
  "Forfait",
  "Produit packagé",
  "Formation / Académie",
  "Audit",
] as const;

export const TYPES_INTERACTION = [
  "Appel",
  "Visio",
  "Réunion sur site",
  "Email",
  "LinkedIn",
  "Événement",
  "Proposition envoyée",
  "Relance",
] as const;

export const STATUTS_REFERENCEMENT = [
  "Non initié",
  "Dossier à constituer",
  "Dossier envoyé",
  "En instruction",
  "Référencé",
  "Refusé",
] as const;

export const PRIORITES = ["Haute", "Moyenne", "Basse"] as const;

export const CERTIFICATIONS_SALESFORCE = [
  "Administrator",
  "Advanced Administrator",
  "Platform Developer I",
  "Platform Developer II",
  "Sales Cloud Consultant",
  "Service Cloud Consultant",
  "Data Cloud Consultant",
  "Agentforce Specialist",
  "AI Associate",
  "AI Specialist",
  "Marketing Cloud",
  "CPQ Specialist",
  "Technical Architect",
] as const;

export const STATUTS_MISSION = ["En cours", "Terminée", "Suspendue"] as const;

export const STATUTS_PROSPECT = [
  "Nouveau",
  "Contacté",
  "Qualifié",
  "Non qualifié",
  "Converti",
] as const;

export const SOURCES_PROSPECT = [
  "LinkedIn",
  "Recommandation",
  "Événement",
  "Site web",
  "Partenaire intégrateur",
  "Éditeur Salesforce",
  "Appel entrant",
  "Autre",
] as const;

export const STATUTS_TACHE = ["À faire", "Terminée"] as const;
