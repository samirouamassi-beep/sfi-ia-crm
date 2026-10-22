import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProjetsAvecIndicateurs } from "@/lib/projets";
import { ajouterJours, criticite, debutJour, dureeJours } from "@/lib/calculs";
import {
  Badge,
  Carte,
  EnTete,
  Kpi,
  Meteo,
  Progression,
  ScoreRisque,
  Vide,
  boutonPrincipal,
  formatDate,
  formatMontant,
  formatPourcentage,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TableauDeBord() {
  const actifs = ["Cadrage", "En cours", "En pause"];
  const aujourdhui = debutJour(new Date());
  const dans30 = ajouterJours(aujourdhui, 30);

  const [projets, jalons, risques, appels] = await Promise.all([
    getProjetsAvecIndicateurs({ statut: { in: actifs } }),
    prisma.tache.findMany({
      where: {
        jalon: true,
        statut: { not: "Terminée" },
        fin: { lte: dans30 },
        projet: { statut: { in: actifs } },
      },
      include: { projet: true },
      orderBy: { fin: "asc" },
    }),
    prisma.risque.findMany({
      where: { statut: { not: "Clos" }, projet: { statut: { in: actifs } } },
      include: { projet: true, responsable: true },
    }),
    prisma.appelOffre.findMany({
      where: { statut: { in: ["Veille", "En préparation"] }, dateLimite: { gte: aujourdhui } },
      include: { responsable: true },
      orderBy: { dateLimite: "asc" },
      take: 5,
    }),
  ]);

  const budgetTotal = projets.reduce((s, p) => s + p.budget.budget, 0);
  const consomme = projets.reduce((s, p) => s + p.budget.consomme, 0);
  const prevision = projets.reduce((s, p) => s + p.budget.previsionFinale, 0);
  const tachesRetard = projets.reduce((s, p) => s + p.tachesEnRetard, 0);
  const parMeteo = (m: string) => projets.filter((p) => p.meteo === m).length;
  const risquesTries = risques
    .map((r) => ({ ...r, score: criticite(r) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <EnTete
        titre="Tableau de bord du portefeuille"
        sousTitre={`Situation au ${formatDate(aujourdhui)} · ${projets.length} projets actifs`}
        actions={
          <Link href="/projets/nouveau" className={boutonPrincipal}>
            + Nouveau projet
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi
          label="Projets actifs"
          valeur={projets.length}
          detail={`${parMeteo("Vert")} vert · ${parMeteo("Orange")} orange · ${parMeteo("Rouge")} rouge`}
        />
        <Kpi label="Montant des marchés" valeur={formatMontant(budgetTotal)} detail="projets actifs (HT)" />
        <Kpi
          label="Consommé"
          valeur={formatMontant(consomme)}
          detail={`${formatPourcentage(budgetTotal ? consomme / budgetTotal : 0)} du budget`}
        />
        <Kpi
          label="Prévision à terminaison"
          valeur={formatMontant(prevision)}
          detail={
            prevision > budgetTotal
              ? `Dépassement de ${formatMontant(prevision - budgetTotal)}`
              : `Marge de ${formatMontant(budgetTotal - prevision)}`
          }
          ton={prevision > budgetTotal ? "danger" : "bon"}
        />
        <Kpi
          label="Tâches en retard"
          valeur={tachesRetard}
          detail={`${risques.length} risques ouverts`}
          ton={tachesRetard > 0 ? "alerte" : "bon"}
        />
      </div>

      <Carte titre="Portefeuille de projets">
        <div className="-mx-4 overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-slate-200">
              <tr>
                <th className={thClass}>Projet</th>
                <th className={thClass}>Météo</th>
                <th className={thClass}>Statut</th>
                <th className={`${thClass} w-44`}>Avancement</th>
                <th className={`${thClass} w-44`}>Budget consommé</th>
                <th className={thClass}>Prochain jalon</th>
                <th className={thClass}>Fin</th>
                <th className={thClass}>Alertes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projets.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className={tdClass}>
                    <Link href={`/projets/${p.id}`} className={lienClass}>
                      {p.nom}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {p.code} · {p.client ?? "—"} · {p.chef?.nom ?? "Sans chef de projet"}
                    </div>
                  </td>
                  <td className={tdClass}>
                    <Meteo valeur={p.meteo} avecLibelle />
                  </td>
                  <td className={tdClass}>
                    <Badge>{p.statut}</Badge>
                  </td>
                  <td className={tdClass}>
                    <Progression valeur={p.avancement} prevu={p.avancementPrevu} />
                  </td>
                  <td className={tdClass}>
                    <Progression
                      valeur={Math.round(p.budget.tauxConsommation * 100)}
                      couleur={
                        p.budget.previsionFinale > p.budget.budget ? "bg-red-500" : "bg-emerald-500"
                      }
                    />
                    <div className="text-xs text-slate-500">
                      {formatMontant(p.budget.consomme)} / {formatMontant(p.budget.budget)}
                    </div>
                  </td>
                  <td className={tdClass}>
                    {p.prochainJalon ? (
                      <>
                        <div className="text-sm">◆ {p.prochainJalon.nom}</div>
                        <div className="text-xs text-slate-500">
                          {formatDate(p.prochainJalon.fin)}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatDate(p.fin)}</td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {p.tachesEnRetard > 0 && (
                        <Badge ton="Ouvert">{p.tachesEnRetard} en retard</Badge>
                      )}
                      {p.risquesCritiques > 0 && (
                        <Badge ton="Haute">{p.risquesCritiques} {p.risquesCritiques > 1 ? "risques critiques" : "risque critique"}</Badge>
                      )}
                      {p.tachesEnRetard === 0 && p.risquesCritiques === 0 && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projets.length === 0 && <Vide>Aucun projet actif.</Vide>}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Le trait vertical sur la barre d&apos;avancement indique l&apos;avancement prévu à date
          selon le planning.
        </p>
      </Carte>

      <div className="grid gap-6 lg:grid-cols-3">
        <Carte
          titre="Appels d'offres à déposer"
          action={
            <Link href="/appels-offres" className="text-xs text-indigo-700 hover:underline">
              Tout voir
            </Link>
          }
        >
          {appels.length === 0 ? (
            <Vide>Aucun dépôt à venir.</Vide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {appels.map((a) => {
                const jours = dureeJours(aujourdhui, a.dateLimite) - 1;
                return (
                  <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <Link href={`/appels-offres/${a.id}`} className="text-sm font-medium hover:text-indigo-700">
                        {a.objet}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {a.maitreOuvrage} · {formatMontant(a.montantEstime)}
                      </div>
                    </div>
                    <span
                      className={`whitespace-nowrap text-sm ${
                        jours <= 7 ? "font-medium text-red-600" : "text-slate-700"
                      }`}
                    >
                      J-{jours}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>

        <Carte titre="Jalons des 30 prochains jours">
          {jalons.length === 0 ? (
            <Vide>Aucun jalon à venir.</Vide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {jalons.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">◆ {j.nom}</div>
                    <Link href={`/projets/${j.projetId}`} className="text-xs text-slate-500 hover:underline">
                      {j.projet.nom}
                    </Link>
                  </div>
                  <span
                    className={`whitespace-nowrap text-sm ${
                      j.fin < aujourdhui ? "font-medium text-red-600" : "text-slate-700"
                    }`}
                  >
                    {formatDate(j.fin)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>

        <Carte
          titre="Risques les plus critiques"
          action={
            <Link href="/risques" className="text-xs text-indigo-700 hover:underline">
              Tout voir
            </Link>
          }
        >
          {risquesTries.length === 0 ? (
            <Vide>Aucun risque ouvert.</Vide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {risquesTries.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{r.titre}</div>
                    <div className="text-xs text-slate-500">
                      {r.projet.nom} · {r.responsable?.nom ?? "Non affecté"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge>{r.type}</Badge>
                    <ScoreRisque score={r.score} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
    </div>
  );
}
