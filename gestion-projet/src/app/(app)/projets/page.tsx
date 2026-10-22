import Link from "next/link";
import { getProjetsAvecIndicateurs } from "@/lib/projets";
import { STATUTS_PROJET } from "@/lib/listes";
import {
  Badge,
  Carte,
  EnTete,
  Meteo,
  Progression,
  Vide,
  boutonPrincipal,
  formatDate,
  formatMontant,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Projets" };

export default async function ProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const { statut = "", q = "" } = await searchParams;
  const tous = await getProjetsAvecIndicateurs(statut ? { statut: { in: [statut] } } : {});
  const recherche = q.trim().toLowerCase();
  const projets = recherche
    ? tous.filter((p) =>
        [p.nom, p.code, p.client ?? "", p.chef?.nom ?? ""].some((v) => v.toLowerCase().includes(recherche))
      )
    : tous;

  const puce = (valeur: string, label: string) => (
    <Link
      key={label}
      href={valeur ? `/projets?statut=${encodeURIComponent(valeur)}` : "/projets"}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        statut === valeur
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <EnTete
        titre="Projets"
        sousTitre={`${projets.length} projet(s)`}
        actions={
          <Link href="/projets/nouveau" className={boutonPrincipal}>
            + Nouveau projet
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        {puce("", "Tous")}
        {STATUTS_PROJET.map((s) => puce(s, s))}
        <form className="ml-auto">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un projet, un client…"
            className="w-64 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </form>
      </div>

      <Carte>
        <div className="-mx-4 -my-4 overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={thClass}>Code</th>
                <th className={thClass}>Projet</th>
                <th className={thClass}>Chef de projet</th>
                <th className={thClass}>Statut</th>
                <th className={thClass}>Priorité</th>
                <th className={thClass}>Météo</th>
                <th className={`${thClass} w-40`}>Avancement</th>
                <th className={`${thClass} text-right`}>Marché HT</th>
                <th className={`${thClass} text-right`}>Prévision</th>
                <th className={thClass}>Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projets.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={`${tdClass} font-mono text-xs text-slate-500`}>{p.code}</td>
                  <td className={tdClass}>
                    <Link href={`/projets/${p.id}`} className={lienClass}>
                      {p.nom}
                    </Link>
                    <div className="text-xs text-slate-500">{p.client ?? "—"}</div>
                  </td>
                  <td className={tdClass}>{p.chef?.nom ?? "—"}</td>
                  <td className={tdClass}>
                    <Badge>{p.statut}</Badge>
                  </td>
                  <td className={tdClass}>
                    <Badge>{p.priorite}</Badge>
                  </td>
                  <td className={tdClass}>
                    <Meteo valeur={p.meteo} />
                  </td>
                  <td className={tdClass}>
                    <Progression valeur={p.avancement} prevu={p.avancementPrevu} />
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>
                    {formatMontant(p.budget.budget)}
                    <div className="text-xs text-slate-500">{formatMontant(p.montantTtc)} TTC</div>
                  </td>
                  <td
                    className={`${tdClass} text-right tabular-nums ${
                      p.budget.ecart < 0 ? "font-medium text-red-600" : ""
                    }`}
                  >
                    {formatMontant(p.budget.previsionFinale)}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDate(p.fin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {projets.length === 0 && <Vide>Aucun projet.</Vide>}
        </div>
      </Carte>
    </div>
  );
}
