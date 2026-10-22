"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ajouterJours } from "@/lib/calculs";

/**
 * Enregistre la feuille de temps d'un membre pour une semaine. Chaque cellule s'appelle
 * `t|<tacheId>|<indexJour>` ; une cellule vide ou à 0 supprime la saisie existante.
 */
export async function enregistrerFeuille(membreId: string, lundiIso: string, formData: FormData) {
  const lundi = new Date(lundiIso);
  const saisies: { tacheId: string; date: Date; jours: number }[] = [];
  const tachesIds = new Set<string>();
  for (const [cle, valeur] of formData.entries()) {
    if (typeof valeur !== "string" || !cle.startsWith("t|")) continue;
    const [, tacheId, index] = cle.split("|");
    tachesIds.add(tacheId);
    const jours = Number(valeur.replace(",", "."));
    if (!Number.isFinite(jours) || jours <= 0) continue;
    saisies.push({ tacheId, date: ajouterJours(lundi, Number(index)), jours: Math.min(jours, 1) });
  }
  const taches = await prisma.tache.findMany({
    where: { id: { in: [...tachesIds] } },
    select: { id: true, projetId: true },
  });
  const projetDe = new Map(taches.map((t) => [t.id, t.projetId]));

  await prisma.$transaction([
    prisma.temps.deleteMany({
      where: {
        membreId,
        tacheId: { in: [...tachesIds] },
        date: { gte: lundi, lt: ajouterJours(lundi, 7) },
      },
    }),
    prisma.temps.createMany({
      data: saisies
        .filter((s) => projetDe.has(s.tacheId))
        .map((s) => ({ ...s, membreId, projetId: projetDe.get(s.tacheId)! })),
    }),
  ]);
  revalidatePath("/temps");
  revalidatePath("/", "layout");
}
