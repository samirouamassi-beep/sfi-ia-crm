// Taches et relances : regroupe les taches ouvertes et les dates de relance deja saisies sur
// les autres fiches (relance contact, echeance d'opportunite, echeance d'interaction), pour
// avoir une seule liste "a faire", comme la liste des taches d'accueil Salesforce.

import { prisma } from "@/lib/db";

export type Echeance = "retard" | "aujourdhui" | "semaine" | "plusTard" | "sansDate";

export type ElementAgenda = {
  cle: string;
  source: "Tâche" | "Relance contact" | "Opportunité" | "Interaction";
  titre: string;
  contexte: string | null;
  date: Date | null;
  echeance: Echeance;
  href: string;
  fondateur: string | null;
  priorite: string | null;
  /** Renseigne uniquement pour les taches : permet de les cocher directement. */
  tacheId?: string;
};

// Les dates saisies dans les formulaires sont stockees a minuit UTC : on compare des jours
// (AAAA-MM-JJ) et non des instants, pour qu'une echeance "aujourd'hui" ne soit pas en retard.
function jour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function classerEcheance(date: Date | null, maintenant = new Date()): Echeance {
  if (!date) return "sansDate";
  const j = jour(date);
  const aujourdhui = jour(maintenant);
  if (j < aujourdhui) return "retard";
  if (j === aujourdhui) return "aujourdhui";
  if (j <= jour(new Date(maintenant.getTime() + 7 * 86_400_000))) return "semaine";
  return "plusTard";
}

export const LIBELLES_ECHEANCE: Record<Echeance, string> = {
  retard: "En retard",
  aujourdhui: "Aujourd'hui",
  semaine: "7 prochains jours",
  plusTard: "Plus tard",
  sansDate: "Sans échéance",
};

export async function getAgenda({ fondateur }: { fondateur?: string } = {}) {
  const [taches, contacts, opportunites, interactions] = await Promise.all([
    prisma.tache.findMany({
      where: { statut: { not: "Terminée" } },
      include: { compte: true, contact: true, opportunite: true },
    }),
    prisma.contact.findMany({
      where: { relancePrevueLe: { not: null } },
      include: { compte: true },
    }),
    prisma.opportunite.findMany({
      where: { echeanceProchaineAction: { not: null }, etape: { notIn: ["Signé", "Perdu"] } },
      include: { compte: true },
    }),
    prisma.interaction.findMany({
      where: { echeance: { not: null } },
      include: { compte: true, contact: true },
    }),
  ]);

  const elements: ElementAgenda[] = [
    ...taches.map((t) => ({
      cle: `tache-${t.id}`,
      source: "Tâche" as const,
      titre: t.sujet,
      contexte:
        [t.compte?.nom, t.contact && `${t.contact.prenom} ${t.contact.nom}`, t.opportunite?.intitule]
          .filter(Boolean)
          .join(" · ") || null,
      date: t.echeance,
      echeance: classerEcheance(t.echeance),
      href: `/taches/${t.id}`,
      fondateur: t.fondateur,
      priorite: t.priorite,
      tacheId: t.id,
    })),
    ...contacts.map((c) => ({
      cle: `contact-${c.id}`,
      source: "Relance contact" as const,
      titre: `Relancer ${c.prenom} ${c.nom}`,
      contexte: c.compte?.nom ?? null,
      date: c.relancePrevueLe,
      echeance: classerEcheance(c.relancePrevueLe),
      href: `/contacts/${c.id}`,
      fondateur: c.fondateurReferent,
      priorite: c.priorite,
    })),
    ...opportunites.map((o) => ({
      cle: `opportunite-${o.id}`,
      source: "Opportunité" as const,
      titre: o.prochaineAction ?? `Prochaine action : ${o.intitule}`,
      contexte: `${o.intitule} · ${o.compte.nom}`,
      date: o.echeanceProchaineAction,
      echeance: classerEcheance(o.echeanceProchaineAction),
      href: `/pipeline/${o.id}`,
      fondateur: o.fondateurReferent,
      priorite: null,
    })),
    ...interactions.map((i) => ({
      cle: `interaction-${i.id}`,
      source: "Interaction" as const,
      titre: i.prochaineAction ?? i.sujet ?? `Suite de : ${i.type}`,
      contexte:
        [i.compte?.nom, i.contact && `${i.contact.prenom} ${i.contact.nom}`]
          .filter(Boolean)
          .join(" · ") || null,
      date: i.echeance,
      echeance: classerEcheance(i.echeance),
      href: `/interactions/${i.id}`,
      fondateur: i.fondateur,
      priorite: null,
    })),
  ];

  return elements
    .filter((e) => !fondateur || e.fondateur === fondateur)
    .sort((a, b) => {
      if (!a.date) return b.date ? 1 : 0;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
}
