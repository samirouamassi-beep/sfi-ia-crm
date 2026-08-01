import { prisma } from "@/lib/db";
import { getEtapesPipeline } from "@/lib/calculs";
import { creerOpportunite } from "../actions";
import { OpportuniteForm } from "../OpportuniteForm";

export const dynamic = "force-dynamic";

export default async function NouvelleOpportunitePage() {
  const [comptes, fondateurs, etapes] = await Promise.all([
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    getEtapesPipeline(),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouvelle opportunité</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <OpportuniteForm
          action={creerOpportunite}
          comptes={comptes}
          fondateurs={fondateurs}
          etapes={etapes}
        />
      </div>
    </div>
  );
}
