import { prisma } from "@/lib/db";
import { lireParam, type SearchParams } from "@/lib/vues";
import { cheminValide } from "@/lib/retour";
import { creerTache } from "../actions";
import { TacheForm } from "../TacheForm";

export const dynamic = "force-dynamic";

export default async function NouvelleTachePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [comptes, contacts, opportunites, fondateurs] = await Promise.all([
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.contact.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.opportunite.findMany({ orderBy: { intitule: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);
  const retour = lireParam(params, "retour");

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouvelle tâche</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TacheForm
          action={creerTache}
          comptes={comptes}
          contacts={contacts}
          opportunites={opportunites}
          fondateurs={fondateurs}
          retour={cheminValide(retour) ? retour : undefined}
          valeurs={{
            compteId: lireParam(params, "compteId") || null,
            contactId: lireParam(params, "contactId") || null,
            opportuniteId: lireParam(params, "opportuniteId") || null,
          }}
        />
      </div>
    </div>
  );
}
