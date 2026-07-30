import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculOpportunite, getEtapesPipeline } from "@/lib/calculs";
import { formatEuros, formatPourcentage, formatDate, linkButtonClass, Badge, rowLinkClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const [opportunites, etapes] = await Promise.all([
    prisma.opportunite.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
    getEtapesPipeline(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pipeline commercial</h1>
          <p className="text-sm text-slate-500">
            La probabilité et le montant pondéré se calculent depuis l&apos;étape.
          </p>
        </div>
        <Link href="/pipeline/nouveau" className={linkButtonClass}>
          + Nouvelle opportunité
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Opportunité</th>
              <th className="px-3 py-2">Compte</th>
              <th className="px-3 py-2">Étape</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2 text-right">Probabilité</th>
              <th className="px-3 py-2 text-right">Montant pondéré</th>
              <th className="px-3 py-2">Échéance action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunites.map((o) => {
              const calc = calculOpportunite(o, etapes);
              const enRetard = o.echeanceProchaineAction
                ? o.echeanceProchaineAction.getTime() < Date.now()
                : false;
              return (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/pipeline/${o.id}`} className={rowLinkClass}>
                      {o.intitule}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{o.compte.nom}</td>
                  <td className="px-3 py-2 text-slate-600">{o.etape}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatEuros(o.montant)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatPourcentage(calc.probabilite)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(calc.montantPondere)}
                  </td>
                  <td className="px-3 py-2">
                    {o.echeanceProchaineAction ? (
                      <Badge retard={enRetard}>{formatDate(o.echeanceProchaineAction)}</Badge>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              );
            })}
            {opportunites.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  Aucune opportunité pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
