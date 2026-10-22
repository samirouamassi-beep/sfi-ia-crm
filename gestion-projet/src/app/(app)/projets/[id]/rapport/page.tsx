import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tauxMoyenEquipe } from "@/lib/projets";
import {
  ajouterJours,
  avancementPondere,
  avancementPrevu,
  calculerBudget,
  criticite,
  debutJour,
  montantTtc,
  tacheEnRetard,
  tacheTerminee,
} from "@/lib/calculs";
import { MARQUE } from "@/lib/marque";
import { Logo } from "@/components/logo";
import { BoutonImprimer } from "@/components/imprimer";
import { Meteo, boutonSecondaire, formatDate, formatMontant, formatPourcentage } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Rapport de situation" };

const JOUR_MS = 24 * 60 * 60 * 1000;

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

const th = "border-b border-slate-300 px-2 py-1 text-left text-[11px] font-semibold uppercase text-slate-500";
const td = "border-b border-slate-100 px-2 py-1 align-top";

/** Rapport de situation d'un marché, mis en page pour l'impression A4 / PDF. */
export default async function RapportProjet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projet, tauxMoyen] = await Promise.all([
    prisma.projet.findUnique({
      where: { id },
      include: {
        chef: true,
        phases: { orderBy: { ordre: "asc" } },
        taches: { include: { responsable: true }, orderBy: { ordre: "asc" } },
        temps: { include: { membre: true } },
        depenses: true,
        risques: { where: { statut: { not: "Clos" } }, include: { responsable: true } },
      },
    }),
    tauxMoyenEquipe(),
  ]);
  if (!projet) notFound();

  const auj = debutJour(new Date());
  const budget = calculerBudget({ ...projet, tauxMoyen });
  const avancement = avancementPondere(projet.taches);
  const prevu = avancementPrevu(projet.taches);
  const jalons = projet.taches.filter((t) => t.jalon).sort((a, b) => a.fin.getTime() - b.fin.getTime());
  const enRetard = projet.taches.filter((t) => !t.jalon && tacheEnRetard(t));
  const aVenir = projet.taches.filter(
    (t) => !t.jalon && !tacheTerminee(t) && !tacheEnRetard(t) && t.fin <= ajouterJours(auj, 30)
  );
  const risques = projet.risques.map((r) => ({ ...r, score: criticite(r) })).sort((a, b) => b.score - a.score);
  const ecart = (t: { fin: Date; baselineFin: Date | null }) =>
    t.baselineFin ? Math.round((t.fin.getTime() - t.baselineFin.getTime()) / JOUR_MS) : null;
  const signe = (n: number | null) => (n == null ? "—" : n > 0 ? `+${n} j` : `${n} j`);

  return (
    <div className="mx-auto max-w-4xl space-y-5 bg-white p-8 text-[13px] text-slate-800 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <div className="flex justify-end gap-2 print:hidden">
        <Link href={`/projets/${id}`} className={boutonSecondaire}>
          Retour au projet
        </Link>
        <BoutonImprimer />
      </div>

      <header className="flex items-start justify-between gap-6 border-b-2 border-indigo-600 pb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Rapport de situation</div>
          <h1 className="text-xl font-semibold text-slate-900">{projet.nom}</h1>
          <div className="text-slate-600">
            {projet.code} · {projet.client ?? "—"}
            {projet.numeroMarche && ` · Marché n° ${projet.numeroMarche}`}
          </div>
          <div className="text-slate-600">
            Chef de projet : {projet.chef?.nom ?? "—"} · du {formatDate(projet.debut)} au {formatDate(projet.fin)}
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

      <div className="grid grid-cols-4 gap-3">
        {[
          ["Avancement", `${avancement} %`, `prévu à date : ${prevu} %`],
          ["Marché HT", formatMontant(budget.budget), `${formatMontant(montantTtc(budget.budget, projet.tauxTva))} TTC`],
          ["Prévision à terminaison", formatMontant(budget.previsionFinale), `consommé ${formatPourcentage(budget.tauxConsommation)}`],
          [
            "Marge prévue",
            formatMontant(budget.ecart),
            budget.budget ? formatPourcentage(budget.ecart / budget.budget) + " du marché" : "",
          ],
        ].map(([label, valeur, detail]) => (
          <div key={label} className="rounded border border-slate-200 p-2">
            <div className="text-[11px] uppercase text-slate-500">{label}</div>
            <div className={`text-base font-semibold ${label === "Marge prévue" && budget.ecart < 0 ? "text-red-600" : ""}`}>
              {valeur}
            </div>
            <div className="text-[11px] text-slate-500">{detail}</div>
          </div>
        ))}
      </div>

      <Bloc titre="Situation">
        <div className="flex items-start gap-3">
          <Meteo valeur={projet.meteo} avecLibelle />
          <span className="text-slate-500">·</span>
          <p className="whitespace-pre-line">{projet.commentaire ?? "Aucun commentaire."}</p>
        </div>
      </Bloc>

      <Bloc titre="Avancement par phase">
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Phase</th>
              <th className={th}>Début</th>
              <th className={th}>Fin</th>
              <th className={`${th} text-right`}>Réalisé</th>
              <th className={`${th} text-right`}>Prévu à date</th>
            </tr>
          </thead>
          <tbody>
            {projet.phases.map((ph) => {
              const taches = projet.taches.filter((t) => t.phaseId === ph.id);
              if (taches.length === 0) return null;
              return (
                <tr key={ph.id}>
                  <td className={td}>{ph.nom}</td>
                  <td className={td}>{formatDate(new Date(Math.min(...taches.map((t) => t.debut.getTime()))))}</td>
                  <td className={td}>{formatDate(new Date(Math.max(...taches.map((t) => t.fin.getTime()))))}</td>
                  <td className={`${td} text-right`}>{avancementPondere(taches)} %</td>
                  <td className={`${td} text-right`}>{avancementPrevu(taches)} %</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Bloc>

      <Bloc titre="Jalons">
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Jalon</th>
              <th className={th}>Date de référence</th>
              <th className={th}>Date prévue</th>
              <th className={`${th} text-right`}>Écart</th>
              <th className={th}>État</th>
            </tr>
          </thead>
          <tbody>
            {jalons.map((j) => (
              <tr key={j.id}>
                <td className={td}>◆ {j.nom}</td>
                <td className={td}>{formatDate(j.baselineFin)}</td>
                <td className={td}>{formatDate(j.fin)}</td>
                <td className={`${td} text-right ${(ecart(j) ?? 0) > 0 ? "font-medium text-red-600" : ""}`}>{signe(ecart(j))}</td>
                <td className={td}>{tacheTerminee(j) ? "Atteint" : tacheEnRetard(j) ? "En retard" : "À venir"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloc>

      <div className="grid grid-cols-2 gap-5">
        <Bloc titre={`Tâches en retard (${enRetard.length})`}>
          {enRetard.length === 0 ? (
            <p className="text-slate-500">Aucune.</p>
          ) : (
            <ul className="space-y-1">
              {enRetard.map((t) => (
                <li key={t.id}>
                  <b>{t.nom}</b> — fin prévue {formatDate(t.fin)}, {t.avancement} % · {t.responsable?.nom ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </Bloc>
        <Bloc titre={`À terminer dans les 30 jours (${aVenir.length})`}>
          {aVenir.length === 0 ? (
            <p className="text-slate-500">Aucune.</p>
          ) : (
            <ul className="space-y-1">
              {aVenir.map((t) => (
                <li key={t.id}>
                  <b>{t.nom}</b> — {formatDate(t.fin)}, {t.avancement} % · {t.responsable?.nom ?? "—"}
                </li>
              ))}
            </ul>
          )}
        </Bloc>
      </div>

      <Bloc titre="Budget (HT)">
        <table className="w-full">
          <tbody>
            {[
              ["Montant du marché", budget.budget],
              ["Temps passés", budget.coutTemps],
              ["Dépenses réalisées", budget.coutDepenses],
              ["Reste à faire (travail + achats prévus)", budget.resteAFaire],
              ["dont achats prévus", budget.achatsPrevus],
              ["Prévision à terminaison", budget.previsionFinale],
              ["Marge prévue", budget.ecart],
            ].map(([label, valeur]) => (
              <tr key={label as string}>
                <td className={td}>{label}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMontant(valeur as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloc>

      <Bloc titre={`Risques et problèmes ouverts (${risques.length})`}>
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Criticité</th>
              <th className={th}>Intitulé</th>
              <th className={th}>Responsable</th>
              <th className={th}>Plan d&apos;action</th>
            </tr>
          </thead>
          <tbody>
            {risques.map((r) => (
              <tr key={r.id}>
                <td className={`${td} font-semibold ${r.score >= 9 ? "text-red-600" : ""}`}>{r.score}</td>
                <td className={td}>
                  {r.titre} <span className="text-slate-500">({r.type})</span>
                </td>
                <td className={td}>{r.responsable?.nom ?? "—"}</td>
                <td className={td}>{r.mitigation ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Bloc>
    </div>
  );
}
