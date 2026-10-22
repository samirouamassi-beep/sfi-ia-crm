import { classeurPortefeuille, reponseExcel } from "@/lib/export-excel";

export const dynamic = "force-dynamic";

/** Classeur Excel du portefeuille : marchés, appels d'offres, cautions. */
export async function GET() {
  const date = new Date().toISOString().slice(0, 10);
  return reponseExcel(await classeurPortefeuille(), `portefeuille-${date}.xlsx`);
}
