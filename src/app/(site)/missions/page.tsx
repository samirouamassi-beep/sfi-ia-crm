import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculMission } from "@/lib/calculs";
import { formatEuros, formatPourcentage, linkButtonClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const missions = await prisma.mission.findMany({
    include: { compte: true, ressource: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Missions et staffing</h1>
          <p className="text-sm text-slate-500">
            Une ligne par ressource affectée à une mission. Alimente la marge du tableau de bord.
          </p>
        </div>
        <Link href="/missions/nouveau" className={linkButtonClass}>
          + Nouvelle mission
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Mission</th>
              <th className="px-3 py-2">Compte</th>
              <th className="px-3 py-2">Ressource</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-right">CA mensuel</th>
              <th className="px-3 py-2 text-right">Coût mensuel</th>
              <th className="px-3 py-2 text-right">Marge mensuelle</th>
              <th className="px-3 py-2 text-right">Taux de marge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {missions.map((m) => {
              const calc = calculMission(m);
              return (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/missions/${m.id}`} className="font-medium text-slate-900 hover:underline">
                      {m.mission}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{m.compte.nom}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {m.ressource ? `${m.ressource.nom} ${m.ressource.prenom}` : "–"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{m.statut}</td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(calc.caMensuel)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(calc.coutMensuel)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(calc.margeMensuelle)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatPourcentage(calc.tauxMarge)}
                  </td>
                </tr>
              );
            })}
            {missions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  Aucune mission pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
