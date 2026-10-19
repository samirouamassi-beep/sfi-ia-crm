import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierProspect, supprimerProspect } from "../actions";
import { ProspectForm } from "../ProspectForm";
import { formatDate, linkButtonClass, rowLinkClass } from "@/components/ui";

export default async function ModifierProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [prospect, fondateurs] = await Promise.all([
    prisma.prospect.findUnique({
      where: { id },
      include: { compte: true, contact: true, opportunite: true },
    }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!prospect) notFound();
  const converti = prospect.convertiLe != null;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {prospect.prenom} {prospect.nom}
          </h1>
          <p className="text-sm text-slate-500">{prospect.societe}</p>
        </div>
        <div className="flex items-center gap-4">
          <form action={supprimerProspect.bind(null, id)}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Supprimer
            </button>
          </form>
          {!converti && (
            <Link href={`/prospects/${id}/convertir`} className={linkButtonClass}>
              Convertir →
            </Link>
          )}
        </div>
      </div>

      {converti && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Converti le {formatDate(prospect.convertiLe)}.</p>
          <ul className="mt-2 space-y-1">
            {prospect.compte && (
              <li>
                Compte :{" "}
                <Link href={`/comptes/${prospect.compte.id}`} className={rowLinkClass}>
                  {prospect.compte.nom}
                </Link>
              </li>
            )}
            {prospect.contact && (
              <li>
                Contact :{" "}
                <Link href={`/contacts/${prospect.contact.id}`} className={rowLinkClass}>
                  {prospect.contact.prenom} {prospect.contact.nom}
                </Link>
              </li>
            )}
            {prospect.opportunite && (
              <li>
                Opportunité :{" "}
                <Link href={`/pipeline/${prospect.opportunite.id}`} className={rowLinkClass}>
                  {prospect.opportunite.intitule}
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ProspectForm
          action={modifierProspect.bind(null, id)}
          valeurs={prospect}
          fondateurs={fondateurs}
          converti={converti}
        />
      </div>
    </div>
  );
}
