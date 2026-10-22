// Toute la logique métier : avancement, budget, retards, plan de charge.
// Fonctions pures, sans accès à la base, pour rester faciles à tester et à ajuster.

const JOUR_MS = 24 * 60 * 60 * 1000;

export function debutJour(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function ajouterJours(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Lundi de la semaine de `d` (minuit). */
export function lundi(d: Date): Date {
  const r = debutJour(d);
  const jour = (r.getDay() + 6) % 7; // 0 = lundi
  return ajouterJours(r, -jour);
}

export function estOuvre(d: Date): boolean {
  const j = d.getDay();
  return j !== 0 && j !== 6;
}

/** Nombre de jours ouvrés entre deux dates, bornes incluses. */
export function joursOuvres(debut: Date, fin: Date): number {
  let n = 0;
  for (let d = debutJour(debut); d <= fin; d = ajouterJours(d, 1)) if (estOuvre(d)) n++;
  return n;
}

export function dureeJours(debut: Date, fin: Date): number {
  return Math.round((debutJour(fin).getTime() - debutJour(debut).getTime()) / JOUR_MS) + 1;
}

/** Numéro de semaine ISO, pour les en-têtes du plan de charge et du Gantt. */
export function numeroSemaine(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jour = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - debutAnnee.getTime()) / JOUR_MS + 1) / 7);
}

type TacheCalc = {
  debut: Date;
  fin: Date;
  chargeJours: number;
  avancement: number;
  statut: string;
  jalon: boolean;
};

export function tacheTerminee(t: { statut: string; avancement: number }): boolean {
  return t.statut === "Terminée" || t.avancement >= 100;
}

export function tacheEnRetard(t: TacheCalc, aujourdhui = new Date()): boolean {
  return !tacheTerminee(t) && debutJour(t.fin) < debutJour(aujourdhui);
}

/** Avancement d'un ensemble de tâches, pondéré par la charge (une tâche sans charge compte 1). */
export function avancementPondere(taches: TacheCalc[]): number {
  const travail = taches.filter((t) => !t.jalon);
  if (travail.length === 0) return 0;
  let total = 0;
  let fait = 0;
  for (const t of travail) {
    const poids = t.chargeJours > 0 ? t.chargeJours : 1;
    total += poids;
    fait += (poids * (tacheTerminee(t) ? 100 : t.avancement)) / 100;
  }
  return Math.round((fait / total) * 100);
}

/** Avancement théorique à date si tout se déroulait selon le planning. */
export function avancementPrevu(taches: TacheCalc[], aujourdhui = new Date()): number {
  const travail = taches.filter((t) => !t.jalon);
  if (travail.length === 0) return 0;
  let total = 0;
  let prevu = 0;
  const auj = debutJour(aujourdhui);
  for (const t of travail) {
    const poids = t.chargeJours > 0 ? t.chargeJours : 1;
    total += poids;
    if (auj >= debutJour(t.fin)) prevu += poids;
    else if (auj > debutJour(t.debut)) {
      const ecoule = dureeJours(t.debut, auj) - 1;
      prevu += (poids * ecoule) / dureeJours(t.debut, t.fin);
    }
  }
  return Math.round((prevu / total) * 100);
}

export type Budget = {
  budget: number;
  coutTemps: number;
  coutDepenses: number;
  achatsPrevus: number;
  consomme: number;
  resteAFaire: number;
  previsionFinale: number;
  ecart: number; // budget - prévision finale (négatif = dépassement)
  tauxConsommation: number; // consomme / budget
};

/**
 * Budget d'un projet :
 * - consommé = temps saisis × taux journalier du membre + dépenses déjà réalisées ;
 * - reste à faire = charge restante des tâches × taux journalier du responsable
 *   (taux moyen de l'équipe si la tâche n'est pas affectée) + achats prévus
 *   (dépenses datées dans le futur) ;
 * - prévision finale = consommé + reste à faire.
 */
export function calculerBudget(params: {
  budget: number;
  temps: { jours: number; membre: { tauxJournalier: number } }[];
  depenses: { montant: number; date: Date }[];
  taches: (TacheCalc & { responsable: { tauxJournalier: number } | null })[];
  tauxMoyen: number;
  aujourdhui?: Date;
}): Budget {
  const auj = debutJour(params.aujourdhui ?? new Date());
  const coutTemps = params.temps.reduce((s, t) => s + t.jours * t.membre.tauxJournalier, 0);
  const coutDepenses = params.depenses.filter((d) => d.date <= auj).reduce((s, d) => s + d.montant, 0);
  const achatsPrevus = params.depenses.filter((d) => d.date > auj).reduce((s, d) => s + d.montant, 0);
  const consomme = coutTemps + coutDepenses;
  const resteTravail = params.taches.reduce((s, t) => {
    if (t.jalon || tacheTerminee(t)) return s;
    const taux = t.responsable?.tauxJournalier ?? params.tauxMoyen;
    return s + t.chargeJours * (1 - t.avancement / 100) * taux;
  }, 0);
  const resteAFaire = resteTravail + achatsPrevus;
  const previsionFinale = consomme + resteAFaire;
  return {
    budget: params.budget,
    coutTemps,
    coutDepenses,
    achatsPrevus,
    consomme,
    resteAFaire,
    previsionFinale,
    ecart: params.budget - previsionFinale,
    tauxConsommation: params.budget > 0 ? consomme / params.budget : 0,
  };
}

/**
 * Charge planifiée d'une tâche sur une semaine : la charge prévue est répartie
 * uniformément sur les jours ouvrés de la tâche.
 */
export function chargeSemaine(
  t: { debut: Date; fin: Date; chargeJours: number },
  debutSemaine: Date
): number {
  const ouvres = joursOuvres(t.debut, t.fin);
  if (ouvres === 0 || t.chargeJours === 0) return 0;
  const finSemaine = ajouterJours(debutSemaine, 6);
  const debut = t.debut > debutSemaine ? t.debut : debutSemaine;
  const fin = t.fin < finSemaine ? t.fin : finSemaine;
  if (debut > fin) return 0;
  return (t.chargeJours * joursOuvres(debut, fin)) / ouvres;
}

/** Score de criticité d'un risque (probabilité × impact, de 1 à 16). */
export function criticite(r: { probabilite: number; impact: number }): number {
  return r.probabilite * r.impact;
}

export function niveauCriticite(score: number): "faible" | "moyen" | "fort" {
  if (score >= 9) return "fort";
  if (score >= 4) return "moyen";
  return "faible";
}
