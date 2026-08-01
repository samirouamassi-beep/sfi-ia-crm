import { prisma } from "@/lib/db";
import { creerInteraction } from "../actions";
import { InteractionForm } from "../InteractionForm";

export const dynamic = "force-dynamic";

export default async function NouvelleInteractionPage() {
  const [comptes, contacts, fondateurs] = await Promise.all([
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.contact.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouvelle interaction</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <InteractionForm
          action={creerInteraction}
          comptes={comptes}
          contacts={contacts}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
