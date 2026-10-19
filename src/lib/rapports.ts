// Rapports (equivalent des "Reports & Dashboards" Salesforce) : agregats calcules a la lecture,
// comme le reste de src/lib/calculs.ts.

import { prisma } from "@/lib/db";
import { calculMission, calculOpportunite, getEtapesPipeline } from "@/lib/calculs";
import { STATUTS_PROSPECT } from "@/lib/listes";

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });
const JOUR = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });

function cleMois(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function debutSemaine(d: Date) {
  const r = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  r.setUTCDate(r.getUTCDate() - ((r.getUTCDay() + 6) % 7)); // lundi
  return r;
}

export async function getRapports() {
  const [opportunites, etapes, interactions, missions, ressources, prospects, fondateurs, taches] =
    await Promise.all([
      prisma.opportunite.findMany(),
      getEtapesPipeline(),
      prisma.interaction.findMany(),
      prisma.mission.findMany({ where: { statut: "En cours" }, include: { compte: true } }),
      prisma.ressource.findMany(),
      prisma.prospect.findMany(),
      prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
      prisma.tache.findMany({ where: { statut: { not: "Terminée" } } }),
    ]);

  const maintenant = new Date();
  const avecCalcul = opportunites.map((o) => ({ ...o, ...calculOpportunite(o, etapes) }));
  const estOuverte = (o: { etape: string }) => o.etape !== "Signé" && o.etape !== "Perdu";
  const ouvertes = avecCalcul.filter(estOuverte);
  const signees = avecCalcul.filter((o) => o.etape === "Signé");
  const perdues = avecCalcul.filter((o) => o.etape === "Perdu");

  // 1. Pipeline par etape (etapes ouvertes, dans l'ordre du parametrage).
  const parEtape = etapes.filter(estOuverte).map((e) => {
    const lot = ouvertes.filter((o) => o.etape === e.etape);
    return {
      etape: e.etape,
      probabilite: e.probabilite,
      nb: lot.length,
      montant: lot.reduce((s, o) => s + o.montant, 0),
      pondere: lot.reduce((s, o) => s + o.montantPondere, 0),
    };
  });

  // 2. Previsionnel : pipeline pondere par mois de closing vise (6 prochains mois).
  const mois = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + i, 1));
    return { cle: cleMois(d), label: MOIS.format(d), pondere: 0, nb: 0 };
  });
  let closingDepasse = 0;
  let sansDate = 0;
  for (const o of ouvertes) {
    if (!o.dateClosingVisee) {
      sansDate += o.montantPondere;
      continue;
    }
    const m = mois.find((x) => x.cle === cleMois(o.dateClosingVisee!));
    if (m) {
      m.pondere += o.montantPondere;
      m.nb += 1;
    } else if (cleMois(o.dateClosingVisee) < mois[0].cle) {
      closingDepasse += o.montantPondere;
    }
  }

  // 3. Activite commerciale : interactions par semaine sur 12 semaines.
  const lundi = debutSemaine(maintenant);
  const semaines = Array.from({ length: 12 }, (_, i) => {
    const debut = new Date(lundi.getTime() - (11 - i) * 7 * 86_400_000);
    return { debut, label: JOUR.format(debut), nb: 0 };
  });
  for (const i of interactions) {
    const debut = debutSemaine(i.date).getTime();
    const s = semaines.find((x) => x.debut.getTime() === debut);
    if (s) s.nb += 1;
  }
  const parType = new Map<string, number>();
  const il90j = maintenant.getTime() - 90 * 86_400_000;
  for (const i of interactions.filter((x) => x.date.getTime() >= il90j)) {
    parType.set(i.type, (parType.get(i.type) ?? 0) + 1);
  }

  // 4. Resultats par fondateur.
  const parFondateur = [...fondateurs.map((f) => f.nom), null].map((nom) => {
    const deLui = <T extends { fondateurReferent: string | null }>(x: T) =>
      x.fondateurReferent === nom;
    const s = signees.filter(deLui);
    const p = perdues.filter(deLui);
    return {
      fondateur: nom ?? "Non attribué",
      nbOuvertes: ouvertes.filter(deLui).length,
      pondere: ouvertes.filter(deLui).reduce((t, o) => t + o.montantPondere, 0),
      nbSignees: s.length,
      nbPerdues: p.length,
      montantSigne: s.reduce((t, o) => t + o.montant, 0),
      tauxReussite: s.length + p.length > 0 ? s.length / (s.length + p.length) : null,
      interactions90j: interactions.filter(
        (i) => i.fondateur === nom && i.date.getTime() >= il90j
      ).length,
      tachesOuvertes: taches.filter((t) => t.fondateur === nom).length,
    };
  }).filter((f) => f.fondateur !== "Non attribué" || f.nbOuvertes + f.nbSignees + f.nbPerdues > 0);

  // 5. CA mensuel recurrent par compte (missions en cours).
  const parCompte = new Map<string, { id: string; nom: string; ca: number; marge: number }>();
  for (const m of missions) {
    const calc = calculMission(m);
    const ligne = parCompte.get(m.compteId) ?? { id: m.compteId, nom: m.compte.nom, ca: 0, marge: 0 };
    ligne.ca += calc.caMensuel ?? 0;
    ligne.marge += calc.margeMensuelle ?? 0;
    parCompte.set(m.compteId, ligne);
  }
  const caParCompte = [...parCompte.values()].sort((a, b) => b.ca - a.ca);

  // 6. Prospects : repartition par statut et conversion par source.
  const prospectsParStatut = STATUTS_PROSPECT.map((statut) => ({
    statut,
    nb: prospects.filter((p) => p.statut === statut).length,
  }));
  const sources = new Map<string, { total: number; convertis: number }>();
  for (const p of prospects) {
    const cle = p.source ?? "Non renseignée";
    const ligne = sources.get(cle) ?? { total: 0, convertis: 0 };
    ligne.total += 1;
    if (p.convertiLe) ligne.convertis += 1;
    sources.set(cle, ligne);
  }

  // 7. Ressources : taux d'occupation.
  const enMission = ressources.filter((r) => r.statut === "En mission").length;
  const mobilisables = ressources.filter((r) =>
    ["En mission", "Disponible", "Partiellement disponible"].includes(r.statut)
  ).length;

  const caMensuel = caParCompte.reduce((s, c) => s + c.ca, 0);
  const margeMensuelle = caParCompte.reduce((s, c) => s + c.marge, 0);

  return {
    synthese: {
      pipelinePondere: ouvertes.reduce((s, o) => s + o.montantPondere, 0),
      pipelineTotal: ouvertes.reduce((s, o) => s + o.montant, 0),
      nbOuvertes: ouvertes.length,
      montantSigne: signees.reduce((s, o) => s + o.montant, 0),
      nbSignees: signees.length,
      tauxReussite:
        signees.length + perdues.length > 0
          ? signees.length / (signees.length + perdues.length)
          : null,
      caMensuel,
      tauxMarge: caMensuel > 0 ? margeMensuelle / caMensuel : null,
      tauxOccupation: mobilisables > 0 ? enMission / mobilisables : null,
      enMission,
      mobilisables,
      tauxConversionProspects:
        prospects.length > 0 ? prospects.filter((p) => p.convertiLe).length / prospects.length : null,
    },
    parEtape,
    previsionnel: { mois, closingDepasse, sansDate },
    semaines,
    parType: [...parType.entries()].sort((a, b) => b[1] - a[1]),
    parFondateur,
    caParCompte,
    prospectsParStatut,
    sources: [...sources.entries()].sort((a, b) => b[1].total - a[1].total),
  };
}
