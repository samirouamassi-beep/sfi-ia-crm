import Link from "next/link";
import { getRessourcesAvecIndicateurs } from "@/lib/calculs";
import { formatEuros, formatPourcentage, linkButtonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RessourcesPage() {
  const ressources = await getRessourcesAvecIndicateurs();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Ressources</h1>
          <p className="text-sm text-slate-500">
            Salariés, freelances et vivier. Coût par jour, marge et taux de marge automatiques.
          </p>
        </div>
        <Link href="/ressources/nouveau" className={linkButtonClass}>
          + Nouvelle ressource
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Type de contrat</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2">Mission en cours</th>
              <th className="px-3 py-2 text-right">Coût / jour</th>
              <th className="px-3 py-2 text-right">TJM vente cible</th>
              <th className="px-3 py-2 text-right">Marge / jour</th>
              <th className="px-3 py-2 text-right">Taux de marge</th>
              <th className="px-3 py-2 text-right">Certifications</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ressources.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/ressources/${r.id}`} className="font-medium text-slate-900 hover:underline">
                    {r.nom} {r.prenom}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{r.typeContrat}</td>
                <td className="px-3 py-2 text-slate-600">{r.statut}</td>
                <td className="px-3 py-2 text-slate-600">{r.missionEnCours ?? "–"}</td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {formatEuros(r.coutParJour)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {formatEuros(r.tjmVenteCible)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {formatEuros(r.margeParJour)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">
                  {formatPourcentage(r.tauxMarge)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600">{r.nbCertifications}</td>
              </tr>
            ))}
            {ressources.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  Aucune ressource pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
