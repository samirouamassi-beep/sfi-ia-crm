// Génération des classeurs Excel (portefeuille, projet) avec ExcelJS.

import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { getProjetsAvecIndicateurs, tauxMoyenEquipe } from "@/lib/projets";
import {
  avancementPondere,
  avancementPrevu,
  calculerBudget,
  criticite,
  montantTtc,
  tacheEnRetard,
} from "@/lib/calculs";
import { CAUTION_LIBEREE } from "@/lib/listes";
import { MARQUE } from "@/lib/marque";

type Colonne = {
  titre: string;
  cle: string;
  largeur?: number;
  format?: "montant" | "date" | "pourcentage" | "jours";
};

const FORMATS = {
  montant: `#,##0 "${MARQUE.devise}"`,
  date: "dd/mm/yyyy",
  pourcentage: "0%",
  jours: '0.0 "j"',
};

/** Ajoute une feuille : en-tête en gras sur fond bleu, filtres, volets figés, formats. */
function feuille(classeur: ExcelJS.Workbook, nom: string, colonnes: Colonne[], lignes: Record<string, unknown>[]) {
  const f = classeur.addWorksheet(nom, { views: [{ state: "frozen", ySplit: 1 }] });
  f.columns = colonnes.map((c) => ({
    header: c.titre,
    key: c.cle,
    width: c.largeur ?? 16,
    style: c.format ? { numFmt: FORMATS[c.format] } : {},
  }));
  const entete = f.getRow(1);
  entete.font = { bold: true, color: { argb: "FFFFFFFF" } };
  entete.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  entete.alignment = { vertical: "middle", wrapText: true };
  entete.height = 30;
  for (const l of lignes) f.addRow(l);
  f.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colonnes.length } };
  return f;
}

const jours = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));

export async function classeurPortefeuille(): Promise<ExcelJS.Workbook> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = MARQUE.nom;
  classeur.created = new Date();

  const [projets, appels, cautions] = await Promise.all([
    getProjetsAvecIndicateurs(),
    prisma.appelOffre.findMany({ include: { responsable: true }, orderBy: { dateLimite: "asc" } }),
    prisma.caution.findMany({ include: { appelOffre: true }, orderBy: { dateEcheance: "asc" } }),
  ]);

  feuille(
    classeur,
    "Marchés",
    [
      { titre: "Code", cle: "code", largeur: 10 },
      { titre: "Marché", cle: "nom", largeur: 46 },
      { titre: "Maître d'ouvrage", cle: "client", largeur: 26 },
      { titre: "N° de marché", cle: "numero", largeur: 18 },
      { titre: "Chef de projet", cle: "chef", largeur: 20 },
      { titre: "Statut", cle: "statut", largeur: 12 },
      { titre: "Météo", cle: "meteo", largeur: 10 },
      { titre: "Début", cle: "debut", format: "date", largeur: 12 },
      { titre: "Fin", cle: "fin", format: "date", largeur: 12 },
      { titre: "Avancement", cle: "avancement", format: "pourcentage", largeur: 12 },
      { titre: "Prévu à date", cle: "prevu", format: "pourcentage", largeur: 12 },
      { titre: "Marché HT", cle: "ht", format: "montant", largeur: 16 },
      { titre: "TVA %", cle: "tva", largeur: 8 },
      { titre: "Marché TTC", cle: "ttc", format: "montant", largeur: 16 },
      { titre: "Consommé", cle: "consomme", format: "montant", largeur: 16 },
      { titre: "Prévision à terminaison", cle: "prevision", format: "montant", largeur: 18 },
      { titre: "Marge prévue", cle: "marge", format: "montant", largeur: 16 },
      { titre: "Tâches en retard", cle: "retards", largeur: 10 },
      { titre: "Risques critiques", cle: "risques", largeur: 10 },
    ],
    projets.map((p) => ({
      code: p.code,
      nom: p.nom,
      client: p.client,
      numero: p.numeroMarche,
      chef: p.chef?.nom,
      statut: p.statut,
      meteo: p.meteo,
      debut: p.debut,
      fin: p.fin,
      avancement: p.avancement / 100,
      prevu: p.avancementPrevu / 100,
      ht: p.budget.budget,
      tva: p.tauxTva,
      ttc: p.montantTtc,
      consomme: p.budget.consomme,
      prevision: p.budget.previsionFinale,
      marge: p.budget.ecart,
      retards: p.tachesEnRetard,
      risques: p.risquesCritiques,
    }))
  );

  feuille(
    classeur,
    "Appels d'offres",
    [
      { titre: "Référence", cle: "reference", largeur: 24 },
      { titre: "Objet", cle: "objet", largeur: 50 },
      { titre: "Maître d'ouvrage", cle: "mo", largeur: 26 },
      { titre: "Procédure", cle: "procedure", largeur: 14 },
      { titre: "Activité", cle: "activite", largeur: 22 },
      { titre: "Date limite", cle: "limite", format: "date", largeur: 12 },
      { titre: "Estimation HT", cle: "estime", format: "montant", largeur: 16 },
      { titre: "Soumis HT", cle: "soumis", format: "montant", largeur: 16 },
      { titre: "Soumis TTC", cle: "soumisTtc", format: "montant", largeur: 16 },
      { titre: "Statut", cle: "statut", largeur: 14 },
      { titre: "Responsable", cle: "responsable", largeur: 20 },
      { titre: "Notes", cle: "notes", largeur: 50 },
    ],
    appels.map((a) => ({
      reference: a.reference,
      objet: a.objet,
      mo: a.maitreOuvrage,
      procedure: a.procedure,
      activite: a.activite,
      limite: a.dateLimite,
      estime: a.montantEstime,
      soumis: a.montantSoumis,
      soumisTtc: a.montantSoumis != null ? montantTtc(a.montantSoumis, a.tauxTva) : null,
      statut: a.statut,
      responsable: a.responsable?.nom,
      notes: a.notes,
    }))
  );

  feuille(
    classeur,
    "Cautions",
    [
      { titre: "Appel d'offres", cle: "ao", largeur: 24 },
      { titre: "Maître d'ouvrage", cle: "mo", largeur: 26 },
      { titre: "Type", cle: "type", largeur: 18 },
      { titre: "Montant", cle: "montant", format: "montant", largeur: 16 },
      { titre: "Banque", cle: "banque", largeur: 20 },
      { titre: "Référence", cle: "reference", largeur: 16 },
      { titre: "Émise le", cle: "emission", format: "date", largeur: 12 },
      { titre: "Restitution prévue", cle: "echeance", format: "date", largeur: 14 },
      { titre: "Statut", cle: "statut", largeur: 20 },
      { titre: "Immobilisée", cle: "immobilisee", largeur: 10 },
    ],
    cautions.map((c) => ({
      ao: c.appelOffre.reference,
      mo: c.appelOffre.maitreOuvrage,
      type: c.type,
      montant: c.montant,
      banque: c.banque,
      reference: c.reference,
      emission: c.dateEmission,
      echeance: c.dateEcheance,
      statut: c.statut,
      immobilisee: c.statut !== CAUTION_LIBEREE ? "Oui" : "Non",
    }))
  );

  return classeur;
}

export async function classeurProjet(id: string): Promise<{ classeur: ExcelJS.Workbook; code: string } | null> {
  const [projet, tauxMoyen] = await Promise.all([
    prisma.projet.findUnique({
      where: { id },
      include: {
        chef: true,
        phases: { orderBy: { ordre: "asc" } },
        taches: {
          include: {
            responsable: true,
            phase: true,
            predecesseurs: { include: { predecesseur: { select: { nom: true } } } },
          },
          orderBy: { ordre: "asc" },
        },
        temps: { include: { membre: true, tache: true }, orderBy: { date: "asc" } },
        depenses: { orderBy: { date: "asc" } },
        risques: { include: { responsable: true } },
      },
    }),
    tauxMoyenEquipe(),
  ]);
  if (!projet) return null;

  const budget = calculerBudget({ ...projet, tauxMoyen });
  const classeur = new ExcelJS.Workbook();
  classeur.creator = MARQUE.nom;
  classeur.created = new Date();

  const synthese = classeur.addWorksheet("Synthèse");
  synthese.columns = [
    { key: "a", width: 32 },
    { key: "b", width: 50 },
  ];
  const ligne = (a: string, b: unknown, format?: Colonne["format"]) => {
    const r = synthese.addRow({ a, b });
    r.getCell(1).font = { bold: true };
    if (format) r.getCell(2).numFmt = FORMATS[format];
  };
  synthese.addRow({ a: `${projet.code} — ${projet.nom}` }).font = { bold: true, size: 14 };
  synthese.addRow({});
  ligne("Maître d'ouvrage", projet.client);
  ligne("N° de marché", projet.numeroMarche);
  ligne("Chef de projet", projet.chef?.nom);
  ligne("Statut / météo", `${projet.statut} · ${projet.meteo}`);
  ligne("Début", projet.debut, "date");
  ligne("Fin", projet.fin, "date");
  ligne("Avancement", avancementPondere(projet.taches) / 100, "pourcentage");
  ligne("Avancement prévu à date", avancementPrevu(projet.taches) / 100, "pourcentage");
  ligne("Montant du marché HT", budget.budget, "montant");
  ligne(`TVA (${projet.tauxTva} %)`, budget.budget * (projet.tauxTva / 100), "montant");
  ligne("Montant du marché TTC", montantTtc(budget.budget, projet.tauxTva), "montant");
  ligne("Consommé (temps + dépenses réalisées)", budget.consomme, "montant");
  ligne("Reste à faire (travail + achats prévus)", budget.resteAFaire, "montant");
  ligne("Prévision à terminaison", budget.previsionFinale, "montant");
  ligne("Marge prévue", budget.ecart, "montant");
  ligne("Planning de référence", projet.baselineLe ?? "non enregistré", projet.baselineLe ? "date" : undefined);
  ligne("Situation", projet.commentaire);
  synthese.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  feuille(
    classeur,
    "Tâches",
    [
      { titre: "Phase", cle: "phase", largeur: 22 },
      { titre: "Tâche", cle: "nom", largeur: 46 },
      { titre: "Jalon", cle: "jalon", largeur: 7 },
      { titre: "Responsable", cle: "responsable", largeur: 20 },
      { titre: "Début", cle: "debut", format: "date", largeur: 12 },
      { titre: "Fin", cle: "fin", format: "date", largeur: 12 },
      { titre: "Début réf.", cle: "debutRef", format: "date", largeur: 12 },
      { titre: "Fin réf.", cle: "finRef", format: "date", largeur: 12 },
      { titre: "Écart fin (j)", cle: "ecart", largeur: 10 },
      { titre: "Charge", cle: "charge", format: "jours", largeur: 10 },
      { titre: "Avancement", cle: "avancement", format: "pourcentage", largeur: 12 },
      { titre: "Statut", cle: "statut", largeur: 12 },
      { titre: "En retard", cle: "retard", largeur: 10 },
      { titre: "Prédécesseurs", cle: "predecesseurs", largeur: 40 },
    ],
    projet.taches.map((t) => ({
      phase: t.phase?.nom,
      nom: t.nom,
      jalon: t.jalon ? "◆" : "",
      responsable: t.responsable?.nom,
      debut: t.debut,
      fin: t.fin,
      debutRef: t.baselineDebut,
      finRef: t.baselineFin,
      ecart: t.baselineFin ? jours(t.fin, t.baselineFin) : null,
      charge: t.jalon ? null : t.chargeJours,
      avancement: t.avancement / 100,
      statut: t.statut,
      retard: tacheEnRetard(t) ? "Oui" : "",
      predecesseurs: t.predecesseurs.map((d) => d.predecesseur.nom).join(", "),
    }))
  );

  feuille(
    classeur,
    "Temps passés",
    [
      { titre: "Date", cle: "date", format: "date", largeur: 12 },
      { titre: "Collaborateur", cle: "membre", largeur: 22 },
      { titre: "Tâche", cle: "tache", largeur: 46 },
      { titre: "Jours", cle: "jours", format: "jours", largeur: 10 },
      { titre: "Coût", cle: "cout", format: "montant", largeur: 14 },
    ],
    projet.temps.map((t) => ({
      date: t.date,
      membre: t.membre.nom,
      tache: t.tache?.nom,
      jours: t.jours,
      cout: t.jours * t.membre.tauxJournalier,
    }))
  );

  feuille(
    classeur,
    "Dépenses",
    [
      { titre: "Date", cle: "date", format: "date", largeur: 12 },
      { titre: "Libellé", cle: "libelle", largeur: 50 },
      { titre: "Catégorie", cle: "categorie", largeur: 26 },
      { titre: "Montant HT", cle: "montant", format: "montant", largeur: 16 },
      { titre: "Nature", cle: "nature", largeur: 14 },
    ],
    projet.depenses.map((d) => ({
      date: d.date,
      libelle: d.libelle,
      categorie: d.categorie,
      montant: d.montant,
      nature: d.date > new Date() ? "Achat prévu" : "Réalisée",
    }))
  );

  feuille(
    classeur,
    "Risques",
    [
      { titre: "Type", cle: "type", largeur: 10 },
      { titre: "Intitulé", cle: "titre", largeur: 50 },
      { titre: "Probabilité", cle: "p", largeur: 10 },
      { titre: "Impact", cle: "i", largeur: 10 },
      { titre: "Criticité", cle: "score", largeur: 10 },
      { titre: "Statut", cle: "statut", largeur: 14 },
      { titre: "Responsable", cle: "responsable", largeur: 20 },
      { titre: "Échéance", cle: "echeance", format: "date", largeur: 12 },
      { titre: "Plan d'action", cle: "mitigation", largeur: 60 },
    ],
    projet.risques.map((r) => ({
      type: r.type,
      titre: r.titre,
      p: r.probabilite,
      i: r.impact,
      score: criticite(r),
      statut: r.statut,
      responsable: r.responsable?.nom,
      echeance: r.echeance,
      mitigation: r.mitigation,
    }))
  );

  return { classeur, code: projet.code };
}

/** Réponse HTTP de téléchargement d'un classeur. */
export async function reponseExcel(classeur: ExcelJS.Workbook, nomFichier: string): Promise<Response> {
  const tampon = await classeur.xlsx.writeBuffer();
  return new Response(tampon as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomFichier}"`,
      "Cache-Control": "no-store",
    },
  });
}
