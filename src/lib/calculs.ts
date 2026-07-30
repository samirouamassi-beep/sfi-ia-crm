// Reimplementation des formules de calcul du fichier Excel d'origine (onglets Comptes,
// Contacts, Pipeline, Ressources, Missions, Tableau_de_bord). Rien n'est stocke en base :
// tout est recalcule a la lecture, exactement comme les cellules "fond bleu clair" de l'Excel.

import { prisma } from "@/lib/db";

export function estEnRetard(date: Date | null | undefined): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

/** Ressources : cout par jour factue. Priorite au TJM d'achat s'il est renseigne,
 * sinon derive du salaire brut mensuel + charges patronales selon l'entite. */
export function coutParJour(
  ressource: {
    tjmAchat: number | null;
    salaireBrutMensuel: number | null;
    entite: string;
  },
  parametres: { chargesMaroc: number; chargesFrance: number; joursFacturablesParMois: number }
): number | null {
  if (ressource.tjmAchat && ressource.tjmAchat > 0) return ressource.tjmAchat;
  if (ressource.salaireBrutMensuel && ressource.salaireBrutMensuel > 0) {
    const charges =
      ressource.entite === "Hub MA" ? parametres.chargesMaroc : parametres.chargesFrance;
    return (ressource.salaireBrutMensuel * (1 + charges)) / parametres.joursFacturablesParMois;
  }
  return null;
}

export function margeParJour(tjmVenteCible: number | null, coutJour: number | null): number | null {
  if (tjmVenteCible == null || coutJour == null) return null;
  return tjmVenteCible - coutJour;
}

export function tauxMarge(marge: number | null, base: number | null): number | null {
  if (marge == null || base == null || base === 0) return null;
  return marge / base;
}

export function nbCertifications(certificationsDetenues: string | null): number {
  if (!certificationsDetenues) return 0;
  return certificationsDetenues
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean).length;
}

/** Missions : CA, cout et marge mensuels. */
export function calculMission(mission: {
  joursFacturesParMois: number | null;
  tjmVente: number | null;
  tjmCoutAchat: number | null;
}) {
  const caMensuel =
    mission.joursFacturesParMois != null && mission.tjmVente != null
      ? mission.joursFacturesParMois * mission.tjmVente
      : null;
  const coutMensuel =
    mission.joursFacturesParMois != null && mission.tjmCoutAchat != null
      ? mission.joursFacturesParMois * mission.tjmCoutAchat
      : null;
  const margeMensuelle =
    caMensuel != null && coutMensuel != null ? caMensuel - coutMensuel : null;
  return {
    caMensuel,
    coutMensuel,
    margeMensuelle,
    tauxMarge: tauxMarge(margeMensuelle, caMensuel),
  };
}

/** Pipeline : montant pondere et probabilite, a partir de la table EtapePipeline. */
export function calculOpportunite(
  opportunite: { montant: number; etape: string },
  etapes: { etape: string; probabilite: number }[]
) {
  const probabilite = etapes.find((e) => e.etape === opportunite.etape)?.probabilite ?? 0;
  return {
    probabilite,
    montantPondere: opportunite.montant * probabilite,
  };
}

export async function getEtapesPipeline() {
  return prisma.etapePipeline.findMany({ orderBy: { ordre: "asc" } });
}

export async function getParametres() {
  const rows = await prisma.parametre.findMany();
  const get = (cle: string, defaut: number) => rows.find((r) => r.cle === cle)?.valeur ?? defaut;
  return {
    chargesMaroc: get("Charges patronales Maroc", 0.21),
    chargesFrance: get("Charges patronales France", 0.42),
    joursFacturablesParMois: get("Jours facturables / mois", 18),
  };
}

/** Compte : indicateurs agreges, equivalents des colonnes M a P de l'onglet Comptes. */
export async function getComptesAvecIndicateurs() {
  const [comptes, etapes] = await Promise.all([
    prisma.compte.findMany({
      include: { contacts: true, opportunites: true, interactions: true },
      orderBy: { nom: "asc" },
    }),
    getEtapesPipeline(),
  ]);

  return comptes.map((compte) => {
    const pipelinePondere = compte.opportunites.reduce(
      (sum, o) => sum + calculOpportunite(o, etapes).montantPondere,
      0
    );
    const caSigne = compte.opportunites
      .filter((o) => o.etape === "Signé")
      .reduce((sum, o) => sum + o.montant, 0);
    const dates = compte.interactions.map((i) => i.date.getTime());
    const derniereInteraction = dates.length ? new Date(Math.max(...dates)) : null;

    return {
      ...compte,
      nbContacts: compte.contacts.length,
      pipelinePondere,
      caSigne,
      derniereInteraction,
    };
  });
}

/** Contact : dernier contact + relance en retard, equivalents des colonnes M et O. */
export async function getContactsAvecIndicateurs() {
  const contacts = await prisma.contact.findMany({
    include: { compte: true, interactions: true },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return contacts.map((contact) => {
    const dates = contact.interactions.map((i) => i.date.getTime());
    const dernierContact = dates.length ? new Date(Math.max(...dates)) : null;
    return {
      ...contact,
      dernierContact,
      relanceEnRetard: estEnRetard(contact.relancePrevueLe),
    };
  });
}

/** Ressource : cout par jour, marge, taux de marge, nb certifications, mission en cours. */
export async function getRessourcesAvecIndicateurs() {
  const [ressources, parametres, missionsEnCours] = await Promise.all([
    prisma.ressource.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    getParametres(),
    prisma.mission.findMany({ where: { statut: "En cours" } }),
  ]);

  return ressources.map((r) => {
    const cout = coutParJour(r, parametres);
    const marge = margeParJour(r.tjmVenteCible, cout);
    const missionEnCours = missionsEnCours.find((m) => m.ressourceId === r.id);
    return {
      ...r,
      coutParJour: cout,
      margeParJour: marge,
      tauxMarge: tauxMarge(marge, r.tjmVenteCible),
      nbCertifications: nbCertifications(r.certificationsDetenues),
      missionEnCours: missionEnCours?.mission ?? null,
    };
  });
}

/** Tableau de bord : replique les compteurs de l'onglet Tableau_de_bord. */
export async function getTableauDeBord() {
  const [comptes, contacts, opportunites, ressources, missions, interactions, parametres] =
    await Promise.all([
      prisma.compte.findMany(),
      prisma.contact.findMany(),
      prisma.opportunite.findMany(),
      prisma.ressource.findMany(),
      prisma.mission.findMany(),
      prisma.interaction.findMany(),
      getParametres(),
    ]);
  const etapes = await getEtapesPipeline();

  const missionsEnCours = missions.filter((m) => m.statut === "En cours");
  const calculsMissionsEnCours = missionsEnCours.map(calculMission);
  const caMensuelRecurrent = calculsMissionsEnCours.reduce((s, m) => s + (m.caMensuel ?? 0), 0);
  const coutMensuel = calculsMissionsEnCours.reduce((s, m) => s + (m.coutMensuel ?? 0), 0);
  const margeMensuelle = calculsMissionsEnCours.reduce((s, m) => s + (m.margeMensuelle ?? 0), 0);
  const joursFactures = missionsEnCours.reduce((s, m) => s + (m.joursFacturesParMois ?? 0), 0);

  const opportunitesOuvertes = opportunites.filter(
    (o) => o.etape !== "Signé" && o.etape !== "Perdu"
  );
  const montantSigne = opportunites
    .filter((o) => o.etape === "Signé")
    .reduce((s, o) => s + o.montant, 0);
  const montantPerdu = opportunites
    .filter((o) => o.etape === "Perdu")
    .reduce((s, o) => s + o.montant, 0);
  const nbSignes = opportunites.filter((o) => o.etape === "Signé").length;
  const nbPerdus = opportunites.filter((o) => o.etape === "Perdu").length;

  return {
    portefeuille: {
      comptesEnregistres: comptes.length,
      clientsActifs: comptes.filter((c) => c.categorie === "Client actif").length,
      prospects: comptes.filter((c) => c.categorie === "Prospect").length,
      partenairesIntegrateurs: comptes.filter((c) => c.categorie === "Partenaire intégrateur")
        .length,
      contactsCarnet: contacts.length,
    },
    pipeline: {
      nbOuvertes: opportunitesOuvertes.length,
      montantTotal: opportunites.reduce((s, o) => s + o.montant, 0),
      montantPondere: opportunites.reduce(
        (s, o) => s + calculOpportunite(o, etapes).montantPondere,
        0
      ),
      montantSigne,
      montantPerdu,
      tauxReussite: nbSignes + nbPerdus > 0 ? nbSignes / (nbSignes + nbPerdus) : null,
    },
    ressources: {
      enregistrees: ressources.length,
      enMission: ressources.filter((r) => r.statut === "En mission").length,
      disponibles: ressources.filter((r) => r.statut === "Disponible").length,
      vivierQualifie: ressources.filter((r) => r.statut === "Vivier – qualifié").length,
      salariesMaroc: ressources.filter((r) => r.typeContrat === "Salarié MA").length,
      freelancesFrance: ressources.filter((r) => r.typeContrat === "Freelance FR").length,
      totalCertifications: ressources.reduce(
        (s, r) => s + nbCertifications(r.certificationsDetenues),
        0
      ),
    },
    missions: {
      actives: missionsEnCours.length,
      caMensuelRecurrent,
      coutMensuel,
      margeMensuelle,
      tauxMargeGlobal: caMensuelRecurrent > 0 ? margeMensuelle / caMensuelRecurrent : null,
      joursFacturesParMois: joursFactures,
    },
    actionsEnRetard: {
      opportunites: opportunites.filter((o) => estEnRetard(o.echeanceProchaineAction)).length,
      interactions: interactions.filter((i) => estEnRetard(i.echeance)).length,
      contacts: contacts.filter((c) => estEnRetard(c.relancePrevueLe)).length,
    },
    referencements: {
      dossiersReferences: comptes.filter((c) => c.statutReferencement === "Référencé").length,
      dossiersEnInstruction: comptes.filter((c) => c.statutReferencement === "En instruction")
        .length,
      dossiersAConstituer: comptes.filter((c) => c.statutReferencement === "Dossier à constituer")
        .length,
    },
    parametres,
  };
}
