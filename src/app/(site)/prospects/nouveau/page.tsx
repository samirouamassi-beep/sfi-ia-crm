import { prisma } from "@/lib/db";
import { creerProspect } from "../actions";
import { ProspectForm } from "../ProspectForm";

export const dynamic = "force-dynamic";

export default async function NouveauProspectPage() {
  const fondateurs = await prisma.fondateur.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouveau prospect</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ProspectForm action={creerProspect} fondateurs={fondateurs} />
      </div>
    </div>
  );
}
