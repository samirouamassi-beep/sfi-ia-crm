import Link from "next/link";
import { prisma } from "@/lib/db";
import { estEnRetard } from "@/lib/calculs";
import { formatDate, linkButtonClass, Badge, rowLinkClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function InteractionsPage() {
  const interactions = await prisma.interaction.findMany({
    include: { compte: true, contact: true },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Journal des interactions</h1>
          <p className="text-sm text-slate-500">
            Alimente les dates de dernier contact et les relances en retard.
          </p>
        </div>
        <Link href="/interactions/nouveau" className={linkButtonClass}>
          + Nouvelle interaction
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Compte</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Sujet</th>
              <th className="px-3 py-2">Échéance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {interactions.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/interactions/${i.id}`} className={rowLinkClass}>
                    {formatDate(i.date)}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{i.compte?.nom ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {i.contact ? `${i.contact.nom} ${i.contact.prenom}` : "–"}
                </td>
                <td className="px-3 py-2 text-slate-600">{i.type}</td>
                <td className="px-3 py-2 text-slate-600">{i.sujet ?? "–"}</td>
                <td className="px-3 py-2">
                  {i.echeance ? (
                    <Badge retard={estEnRetard(i.echeance)}>{formatDate(i.echeance)}</Badge>
                  ) : (
                    "–"
                  )}
                </td>
              </tr>
            ))}
            {interactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                  Aucune interaction pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
