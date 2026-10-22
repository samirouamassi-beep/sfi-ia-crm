import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProjetsAvecIndicateurs } from "@/lib/projets";
import { debutJour, dureeJours } from "@/lib/calculs";
import { CAUTION_LIBEREE } from "@/lib/listes";
import { MARQUE } from "@/lib/marque";
import { Logo } from "@/components/logo";
import { BoutonImprimer } from "@/components/imprimer";
import { boutonSecondaire, formatDate, formatMontant } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Revue de portefeuille" };

const th = "border-b border-slate-300 px-2 py-1 text-left text-[11px] font-semibold uppercase text-slate-500";
const td = "border-b border-slate-100 px-2 py-1 align-top";

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-semibold uppercase tracking-wide text-indigo-700">
        {titre}
      </h2>
      {children}
    </section>
  );
}

/** Revue de portefeuille mise en page pour l'impression A4 / PDF. */
export default async function RapportPortefeuille() {
  const auj = debutJour(new Date());
  const [projets, appels, cautions] = await Promise.all([
    getProjetsAvecIndicateurs({ statut: { in: ["Cadrage", "En cours", "En pause"] } }),
    prisma.appelOffre.findMany({
      where: { statut: { in: ["Veille", "En préparation", "Déposé"] } },
      include: { responsable: true },
      orderBy: { dateLimite: "asc" },
    }),
    prisma.caution.findMany({ where: { statut: { not: CAUTION_LIBEREE } } }),
  ]);
  const total = (f: (p: (typeof projets)[number]) => number) => projets.reduce((s, p) => s + f(p), 0);
  const cautionsParType = ["Provisoire", "Définitive", "Retenue de garantie"].map((type) => ({
    type,
    montant: cautions.filter((c) => c.type === type).reduce((s, c) => s + c.montant, 0),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-5 bg-white p-8 text-[13px] text-slate-800 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <div className="flex justify-end gap-2 print:hidden">
        <Link href="/" className={boutonSecondaire}>
          Retour au tableau de bord
        </Link>
        <BoutonImprimer />
      </div>

      <header className="flex items-start justify-between gap-6 border-b-2 border-indigo-600 pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Revue de portefeuille</div>
          <h1 className="text-xl font-semibold text-slate-900">
            {projets.length} marchés actifs · {formatMontant(total((p) => p.budget.budget))} HT
          </h1>
          <div className="text-slate-600">
            Prévision à terminaison {formatMontant(total((p) => p.budget.previsionFinale))} · marge prévue{" "}
            {formatMontant(total((p) => p.budget.ecart))}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Logo taille={22} />
            <span className="font-semibold">{MARQUE.nom}</span>
          </div>
          <div className="mt-1 text-slate-500">Édité le {formatDate(auj)}</div>
        </div>
      </header>

      <Bloc titre="Marchés">
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Marché</th>
              <th className={th}>Météo</th>
              <th className={`${th} text-right`}>Avanc. / prévu</th>
              <th className={`${th} text-right`}>Marché HT</th>
              <th className={`${th} text-right`}>Prévision</th>
              <th className={`${th} text-right`}>Marge</th>
              <th className={th}>Fin</th>
              <th className={th}>Alertes</th>
            </tr>
          </thead>
          <tbody>
            {projets.map((p) => (
              <tr key={p.id}>
                <td className={td}>
                  <b>{p.nom}</b>
                  <div className="text-[11px] text-slate-500">
                    {p.code} · {p.client ?? "—"} · {p.chef?.nom ?? "—"}
                  </div>
                </td>
                <td className={td}>{p.meteo}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {p.avancement} % / {p.avancementPrevu} %
                </td>
                <td className={`${td} whitespace-nowrap text-right`}>{formatMontant(p.budget.budget)}</td>
                <td className={`${td} whitespace-nowrap text-right`}>{formatMontant(p.budget.previsionFinale)}</td>
                <td className={`${td} whitespace-nowrap text-right ${p.budget.ecart < 0 ? "font-semibold text-red-600" : ""}`}>
                  {formatMontant(p.budget.ecart)}
                </td>
                <td className={`${td} whitespace-nowrap`}>{formatDate(p.fin)}</td>
                <td className={td}>
                  {[
                    p.tachesEnRetard ? `${p.tachesEnRetard} tâche(s) en retard` : "",
                    p.risquesCritiques ? `${p.risquesCritiques} risque(s) critique(s)` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloc>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <Bloc titre={`Appels d'offres en cours (${appels.length})`}>
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Objet</th>
                  <th className={th}>Date limite</th>
                  <th className={`${th} text-right`}>Montant HT</th>
                  <th className={th}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {appels.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>
                      {a.objet}
                      <div className="text-[11px] text-slate-500">
                        {a.reference} · {a.maitreOuvrage}
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {formatDate(a.dateLimite)}
                      {a.statut !== "Déposé" && a.dateLimite >= auj && (
                        <div className="text-[11px] text-slate-500">J-{dureeJours(auj, a.dateLimite) - 1}</div>
                      )}
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      {formatMontant(a.montantSoumis ?? a.montantEstime)}
                    </td>
                    <td className={td}>{a.statut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Bloc>
        </div>
        <Bloc titre="Cautions immobilisées">
          <table className="w-full">
            <tbody>
              {cautionsParType.map((c) => (
                <tr key={c.type}>
                  <td className={td}>{c.type}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>{formatMontant(c.montant)}</td>
                </tr>
              ))}
              <tr>
                <td className={`${td} font-semibold`}>Total</td>
                <td className={`${td} whitespace-nowrap text-right font-semibold`}>
                  {formatMontant(cautions.reduce((s, c) => s + c.montant, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </Bloc>
      </div>
    </div>
  );
}
