import { prisma } from "@/lib/db";
import { creerCompte } from "../actions";
import { CompteForm } from "../CompteForm";

export const dynamic = "force-dynamic";

export default async function NouveauComptePage() {
  const fondateurs = await prisma.fondateur.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouveau compte</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <CompteForm action={creerCompte} fondateurs={fondateurs} />
      </div>
    </div>
  );
}
