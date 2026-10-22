import { classeurProjet, reponseExcel } from "@/lib/export-excel";

export const dynamic = "force-dynamic";

/** Classeur Excel d'un projet : synthèse, tâches, temps, dépenses, risques. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultat = await classeurProjet(id);
  if (!resultat) return new Response("Projet introuvable", { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return reponseExcel(resultat.classeur, `${resultat.code}-${date}.xlsx`);
}
