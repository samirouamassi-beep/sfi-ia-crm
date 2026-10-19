import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierTache, supprimerTache } from "../actions";
import { TacheForm } from "../TacheForm";
import { CaseTache } from "@/components/agenda";
import { formatDate } from "@/components/ui";

export default async function ModifierTachePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tache, comptes, contacts, opportunites, fondateurs] = await Promise.all([
    prisma.tache.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.contact.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.opportunite.findMany({ orderBy: { intitule: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!tache) notFound();
  const terminee = tache.statut === "Terminée";

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CaseTache id={id} terminee={terminee} />
          <h1 className="text-lg font-semibold text-slate-900">{tache.sujet}</h1>
        </div>
        <form action={supprimerTache.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>
      {terminee && (
        <p className="text-sm text-emerald-700">Terminée le {formatDate(tache.termineeLe)}.</p>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TacheForm
          action={modifierTache.bind(null, id)}
          valeurs={tache}
          comptes={comptes}
          contacts={contacts}
          opportunites={opportunites}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
