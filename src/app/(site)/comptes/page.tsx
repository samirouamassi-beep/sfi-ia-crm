import Link from "next/link";
import { getComptesAvecIndicateurs } from "@/lib/calculs";
import { formatEuros, formatDate, linkButtonClass, rowLinkClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ComptesPage() {
  const comptes = await getComptesAvecIndicateurs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Comptes</h1>
          <p className="text-sm text-slate-500">
            Une ligne par organisation : clients, prospects, partenaires intégrateurs, éditeur
            Salesforce.
          </p>
        </div>
        <Link href="/comptes/nouveau" className={linkButtonClass}>
          + Nouveau compte
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Catégorie</th>
              <th className="px-3 py-2">Statut relation</th>
              <th className="px-3 py-2">Priorité</th>
              <th className="px-3 py-2">Fondateur référent</th>
              <th className="px-3 py-2 text-right">Contacts</th>
              <th className="px-3 py-2 text-right">Pipeline pondéré</th>
              <th className="px-3 py-2 text-right">CA signé</th>
              <th className="px-3 py-2">Dernière interaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comptes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/comptes/${c.id}`} className={rowLinkClass}>
                    {c.nom}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{c.categorie}</td>
                <td className="px-3 py-2 text-slate-600">{c.statutRelation}</td>
                <td className="px-3 py-2 text-slate-600">{c.priorite}</td>
                <td className="px-3 py-2 text-slate-600">{c.fondateurReferent ?? "–"}</td>
                <td className="px-3 py-2 text-right text-slate-600">{c.nbContacts}</td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {formatEuros(c.pipelinePondere)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{formatEuros(c.caSigne)}</td>
                <td className="px-3 py-2 text-slate-600">{formatDate(c.derniereInteraction)}</td>
              </tr>
            ))}
            {comptes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Aucun compte pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
