import Link from "next/link";
import { prisma } from "@/lib/db";
import { criticite } from "@/lib/calculs";
import { STATUTS_RISQUE } from "@/lib/listes";
import { MatriceRisques } from "@/components/risques";
import {
  Badge,
  Carte,
  EnTete,
  Kpi,
  ScoreRisque,
  Vide,
  formatDate,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Risques" };

export default async function RisquesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut = "ouverts" } = await searchParams;
  const tous = await prisma.risque.findMany({
    include: { projet: true, responsable: true },
  });
  const ouverts = tous.filter((r) => r.statut !== "Clos");
  const liste = (statut === "ouverts" ? ouverts : statut === "tous" ? tous : tous.filter((r) => r.statut === statut))
    .map((r) => ({ ...r, score: criticite(r) }))
    .sort((a, b) => b.score - a.score);

  const puce = (valeur: string, label: string) => (
    <Link
      key={valeur}
      href={`/risques?statut=${encodeURIComponent(valeur)}`}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        statut === valeur ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <EnTete titre="Risques et problèmes" sousTitre="Registre consolidé de tous les projets." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Ouverts" valeur={ouverts.length} />
        <Kpi label="Critiques (≥ 9)" valeur={ouverts.filter((r) => criticite(r) >= 9).length} ton="danger" />
        <Kpi label="Problèmes avérés" valeur={ouverts.filter((r) => r.type === "Problème").length} ton="alerte" />
        <Kpi label="Clos" valeur={tous.length - ouverts.length} ton="bon" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Matrice (risques ouverts)">
          <MatriceRisques risques={ouverts} />
        </Carte>
        <Carte className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            {puce("ouverts", "Ouverts")}
            {STATUTS_RISQUE.map((s) => puce(s, s))}
            {puce("tous", "Tous")}
          </div>
          <div className="-mx-4 overflow-x-auto">
            <table className={tableClass}>
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={thClass}>Score</th>
                  <th className={thClass}>Intitulé</th>
                  <th className={thClass}>Projet</th>
                  <th className={thClass}>Responsable</th>
                  <th className={thClass}>Échéance</th>
                  <th className={thClass}>Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liste.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className={tdClass}>
                      <ScoreRisque score={r.score} />
                    </td>
                    <td className={tdClass}>
                      <Link href={`/projets/${r.projetId}/risques/${r.id}`} className={lienClass}>
                        {r.titre}
                      </Link>
                      <div className="mt-0.5">
                        <Badge>{r.type}</Badge>
                      </div>
                    </td>
                    <td className={tdClass}>{r.projet.nom}</td>
                    <td className={tdClass}>{r.responsable?.nom ?? "—"}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDate(r.echeance)}</td>
                    <td className={tdClass}>
                      <Badge>{r.statut}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {liste.length === 0 && <Vide>Aucun risque.</Vide>}
          </div>
        </Carte>
      </div>
    </div>
  );
}
