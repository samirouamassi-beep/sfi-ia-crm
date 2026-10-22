import { prisma } from "@/lib/db";
import {
  avancementPondere,
  avancementPrevu,
  calculerBudget,
  tacheEnRetard,
  type Budget,
} from "@/lib/calculs";

export async function tauxMoyenEquipe(): Promise<number> {
  const r = await prisma.membre.aggregate({
    _avg: { tauxJournalier: true },
    where: { actif: true },
  });
  return r._avg.tauxJournalier ?? 0;
}

export type ProjetIndicateurs = Awaited<ReturnType<typeof getProjetsAvecIndicateurs>>[number];

/** Projets avec leurs indicateurs calculés (avancement, budget, retards, risques). */
export async function getProjetsAvecIndicateurs(where: { statut?: { in: string[] } } = {}) {
  const [projets, tauxMoyen] = await Promise.all([
    prisma.projet.findMany({
      where,
      include: {
        chef: true,
        taches: { include: { responsable: true } },
        temps: { include: { membre: true } },
        depenses: true,
        risques: true,
      },
      orderBy: [{ fin: "asc" }],
    }),
    tauxMoyenEquipe(),
  ]);
  const aujourdhui = new Date();

  return projets.map((p) => {
    const budget: Budget = calculerBudget({
      budget: p.budget,
      temps: p.temps,
      depenses: p.depenses,
      taches: p.taches,
      tauxMoyen,
    });
    const prochainJalon = p.taches
      .filter((t) => t.jalon && t.avancement < 100 && t.statut !== "Terminée")
      .sort((a, b) => a.fin.getTime() - b.fin.getTime())[0];
    return {
      id: p.id,
      code: p.code,
      nom: p.nom,
      client: p.client,
      statut: p.statut,
      priorite: p.priorite,
      meteo: p.meteo,
      debut: p.debut,
      fin: p.fin,
      chef: p.chef,
      avancement: avancementPondere(p.taches),
      avancementPrevu: avancementPrevu(p.taches, aujourdhui),
      nbTaches: p.taches.length,
      tachesEnRetard: p.taches.filter((t) => tacheEnRetard(t, aujourdhui)).length,
      risquesOuverts: p.risques.filter((r) => r.statut !== "Clos").length,
      risquesCritiques: p.risques.filter(
        (r) => r.statut !== "Clos" && r.probabilite * r.impact >= 9
      ).length,
      prochainJalon,
      budget,
    };
  });
}
