import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tauxMoyenEquipe } from "@/lib/projets";
import { METEOS, STATUTS_TACHE, libelleNiveau } from "@/lib/listes";
import {
  avancementPondere,
  avancementPrevu,
  calculerBudget,
  criticite,
  tacheEnRetard,
} from "@/lib/calculs";
import {
  Badge,
  BadgeRetard,
  Carte,
  EnTete,
  Kpi,
  Meteo,
  Onglets,
  Progression,
  ScoreRisque,
  Vide,
  boutonPrincipal,
  boutonSecondaire,
  formatDate,
  formatDateCourte,
  formatMontant,
  formatJours,
  formatPourcentage,
  inputClass,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";
import { Gantt, LegendeGantt, type LigneGantt } from "@/components/gantt";
import { Kanban } from "@/components/kanban";
import { MatriceRisques } from "@/components/risques";
import { DepenseForm } from "../formulaires";
import {
  ajouterDepense,
  ajouterPhase,
  changerStatutTache,
  mettreAJourMeteo,
  supprimerDepense,
  supprimerPhase,
} from "../actions";

export const dynamic = "force-dynamic";

const ONGLETS = [
  { cle: "synthese", label: "Synthèse" },
  { cle: "taches", label: "Tâches" },
  { cle: "gantt", label: "Gantt" },
  { cle: "kanban", label: "Kanban" },
  { cle: "budget", label: "Budget" },
  { cle: "risques", label: "Risques" },
];

async function chargerProjet(id: string) {
  return prisma.projet.findUnique({
    where: { id },
    include: {
      chef: true,
      phases: { orderBy: { ordre: "asc" } },
      taches: { include: { responsable: true }, orderBy: [{ ordre: "asc" }] },
      temps: { include: { membre: true } },
      depenses: { orderBy: { date: "desc" } },
      risques: { include: { responsable: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

type Projet = NonNullable<Awaited<ReturnType<typeof chargerProjet>>>;

export default async function ProjetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { id } = await params;
  const { onglet = "synthese" } = await searchParams;
  const [projet, tauxMoyen] = await Promise.all([chargerProjet(id), tauxMoyenEquipe()]);
  if (!projet) notFound();

  const budget = calculerBudget({
    budget: projet.budget,
    temps: projet.temps,
    depenses: projet.depenses,
    taches: projet.taches,
    tauxMoyen,
  });
  const avancement = avancementPondere(projet.taches);
  const prevu = avancementPrevu(projet.taches);
  const retards = projet.taches.filter((t) => tacheEnRetard(t)).length;

  return (
    <div className="space-y-5">
      <div className="text-sm text-slate-500">
        <Link href="/projets" className="hover:underline">
          Projets
        </Link>{" "}
        / {projet.code}
      </div>
      <EnTete
        titre={
          <span className="flex flex-wrap items-center gap-3">
            {projet.nom}
            <Badge>{projet.statut}</Badge>
            <Meteo valeur={projet.meteo} avecLibelle />
          </span>
        }
        sousTitre={`${projet.client ?? "Sans maître d'ouvrage"}${
          projet.numeroMarche ? ` · Marché n° ${projet.numeroMarche}` : ""
        } · Chef de projet : ${projet.chef?.nom ?? "non défini"} · du ${formatDate(
          projet.debut
        )} au ${formatDate(projet.fin)}`}
        actions={
          <>
            <Link href={`/projets/${id}/taches/nouvelle`} className={boutonPrincipal}>
              + Tâche
            </Link>
            <Link href={`/projets/${id}/modifier`} className={boutonSecondaire}>
              Modifier
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Avancement"
          valeur={`${avancement} %`}
          detail={`Prévu à date : ${prevu} %`}
          ton={avancement + 5 < prevu ? "alerte" : "bon"}
        />
        <Kpi
          label="Budget consommé"
          valeur={formatMontant(budget.consomme)}
          detail={`${formatPourcentage(budget.tauxConsommation)} de ${formatMontant(budget.budget)}`}
        />
        <Kpi
          label="Prévision à terminaison"
          valeur={formatMontant(budget.previsionFinale)}
          detail={budget.ecart < 0 ? `Dépassement ${formatMontant(-budget.ecart)}` : `Marge ${formatMontant(budget.ecart)}`}
          ton={budget.ecart < 0 ? "danger" : "bon"}
        />
        <Kpi
          label="Tâches en retard"
          valeur={retards}
          detail={`sur ${projet.taches.length} tâches`}
          ton={retards > 0 ? "alerte" : "bon"}
        />
      </div>

      <Onglets
        actif={onglet}
        onglets={ONGLETS.map((o) => ({ ...o, href: `/projets/${id}?onglet=${o.cle}` }))}
      />

      {onglet === "synthese" && <Synthese projet={projet} />}
      {onglet === "taches" && <ListeTaches projet={projet} />}
      {onglet === "gantt" && <OngletGantt projet={projet} />}
      {onglet === "kanban" && (
        <Kanban
          colonnes={STATUTS_TACHE}
          deplacer={changerStatutTache}
          cartes={projet.taches.map((t) => ({
            id: t.id,
            nom: t.nom,
            statut: t.statut,
            responsable: t.responsable?.nom ?? null,
            fin: formatDateCourte(t.fin),
            avancement: t.avancement,
            priorite: t.priorite,
            retard: tacheEnRetard(t),
            jalon: t.jalon,
            href: `/projets/${id}/taches/${t.id}`,
          }))}
        />
      )}
      {onglet === "budget" && <OngletBudget projet={projet} budget={budget} />}
      {onglet === "risques" && <OngletRisques projet={projet} />}
    </div>
  );
}

function Synthese({ projet }: { projet: Projet }) {
  const action = mettreAJourMeteo.bind(null, projet.id);
  const parPhase = projet.phases.map((ph) => {
    const taches = projet.taches.filter((t) => t.phaseId === ph.id);
    return { phase: ph, taches, avancement: avancementPondere(taches), prevu: avancementPrevu(taches) };
  });
  const jalons = projet.taches.filter((t) => t.jalon).sort((a, b) => a.fin.getTime() - b.fin.getTime());
  const equipe = new Map<string, { nom: string; role: string; jours: number; taches: number }>();
  for (const t of projet.taches) {
    if (!t.responsable) continue;
    const e = equipe.get(t.responsable.id) ?? { nom: t.responsable.nom, role: t.responsable.role, jours: 0, taches: 0 };
    e.taches++;
    equipe.set(t.responsable.id, e);
  }
  for (const t of projet.temps) {
    const e = equipe.get(t.membreId) ?? { nom: t.membre.nom, role: t.membre.role, jours: 0, taches: 0 };
    e.jours += t.jours;
    equipe.set(t.membreId, e);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Carte titre="Météo et situation">
          <form action={action} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {METEOS.map((m) => (
                <label
                  key={m}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input type="radio" name="meteo" value={m} defaultChecked={projet.meteo === m} className="sr-only" />
                  <Meteo valeur={m} avecLibelle />
                </label>
              ))}
            </div>
            <textarea
              name="commentaire"
              rows={3}
              defaultValue={projet.commentaire ?? ""}
              placeholder="Faits marquants, points d'attention, décisions attendues…"
              className={inputClass}
            />
            <button type="submit" className={boutonSecondaire}>
              Mettre à jour la situation
            </button>
          </form>
        </Carte>

        <Carte titre="Avancement par phase">
          {parPhase.length === 0 ? (
            <Vide>Aucune phase.</Vide>
          ) : (
            <div className="space-y-3">
              {parPhase.map(({ phase, taches, avancement, prevu }) => (
                <div key={phase.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{phase.nom}</span>
                    <span className="text-xs text-slate-500">{taches.length} tâches</span>
                  </div>
                  <Progression valeur={avancement} prevu={prevu} />
                </div>
              ))}
            </div>
          )}
        </Carte>

        {projet.description && (
          <Carte titre="Description">
            <p className="whitespace-pre-line text-sm text-slate-700">{projet.description}</p>
          </Carte>
        )}
      </div>

      <div className="space-y-5">
        <Carte titre="Jalons">
          {jalons.length === 0 ? (
            <Vide>Aucun jalon.</Vide>
          ) : (
            <ol className="relative space-y-3 border-l border-slate-200 pl-4">
              {jalons.map((j) => {
                const atteint = j.statut === "Terminée" || j.avancement >= 100;
                const retard = tacheEnRetard(j);
                return (
                  <li key={j.id}>
                    <span
                      className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rotate-45 ${
                        atteint ? "bg-emerald-500" : retard ? "bg-red-500" : "bg-slate-400"
                      }`}
                    />
                    <div className="text-sm font-medium">{j.nom}</div>
                    <div className={`text-xs ${retard ? "text-red-600" : "text-slate-500"}`}>
                      {formatDate(j.fin)} · {atteint ? "Atteint" : retard ? "En retard" : "À venir"}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Carte>

        <Carte titre="Équipe projet">
          <ul className="divide-y divide-slate-100">
            {[...equipe.values()].map((e) => (
              <li key={e.nom} className="flex justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{e.nom}</div>
                  <div className="text-xs text-slate-500">{e.role}</div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>{e.taches} tâches</div>
                  <div>{formatJours(e.jours)} saisis</div>
                </div>
              </li>
            ))}
          </ul>
        </Carte>
      </div>
    </div>
  );
}

function ListeTaches({ projet }: { projet: Projet }) {
  const groupes = [
    ...projet.phases.map((ph) => ({ id: ph.id, nom: ph.nom, taches: projet.taches.filter((t) => t.phaseId === ph.id) })),
    { id: "", nom: "Sans phase", taches: projet.taches.filter((t) => !t.phaseId) },
  ].filter((g) => g.id !== "" || g.taches.length > 0);
  const nouvellePhase = ajouterPhase.bind(null, projet.id);

  return (
    <div className="space-y-5">
      {groupes.map((g) => (
        <Carte
          key={g.id || "sans"}
          titre={`${g.nom} (${g.taches.length})`}
          action={
            g.id && g.taches.length === 0 ? (
              <form action={supprimerPhase.bind(null, projet.id, g.id)}>
                <button className="text-xs text-red-600 hover:underline">Supprimer la phase</button>
              </form>
            ) : null
          }
        >
          {g.taches.length === 0 ? (
            <Vide>Aucune tâche dans cette phase.</Vide>
          ) : (
            <div className="-mx-4 overflow-x-auto">
              <table className={tableClass}>
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className={thClass}>Tâche</th>
                    <th className={thClass}>Responsable</th>
                    <th className={thClass}>Début</th>
                    <th className={thClass}>Fin</th>
                    <th className={`${thClass} text-right`}>Charge</th>
                    <th className={`${thClass} w-40`}>Avancement</th>
                    <th className={thClass}>Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {g.taches.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className={tdClass}>
                        <Link href={`/projets/${projet.id}/taches/${t.id}`} className={lienClass}>
                          {t.jalon && "◆ "}
                          {t.nom}
                        </Link>
                      </td>
                      <td className={tdClass}>{t.responsable?.nom ?? <span className="text-slate-400">—</span>}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatDateCourte(t.debut)}</td>
                      <td className={`${tdClass} whitespace-nowrap`}>{formatDateCourte(t.fin)}</td>
                      <td className={`${tdClass} text-right tabular-nums`}>{t.jalon ? "—" : formatJours(t.chargeJours)}</td>
                      <td className={tdClass}>{!t.jalon && <Progression valeur={t.avancement} />}</td>
                      <td className={tdClass}>
                        <div className="flex gap-1">
                          <Badge>{t.statut}</Badge>
                          {tacheEnRetard(t) && <BadgeRetard />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      ))}
      <form action={nouvellePhase} className="flex max-w-md items-end gap-2">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-500">Nouvelle phase</label>
          <input name="nom" required placeholder="Ex : Pilote" className={inputClass} />
        </div>
        <button type="submit" className={boutonSecondaire}>
          Ajouter
        </button>
      </form>
    </div>
  );
}

function OngletGantt({ projet }: { projet: Projet }) {
  const lignes: LigneGantt[] = [];
  const ligneTache = (t: Projet["taches"][number]): LigneGantt => ({
    id: t.id,
    label: t.nom,
    sousLabel: t.responsable?.nom,
    debut: t.debut,
    fin: t.fin,
    avancement: t.avancement,
    jalon: t.jalon,
    retard: tacheEnRetard(t),
    href: `/projets/${projet.id}/taches/${t.id}`,
  });
  for (const ph of projet.phases) {
    const taches = projet.taches.filter((t) => t.phaseId === ph.id);
    if (taches.length === 0) continue;
    lignes.push({
      id: `phase-${ph.id}`,
      label: ph.nom,
      debut: new Date(Math.min(...taches.map((t) => t.debut.getTime()))),
      fin: new Date(Math.max(...taches.map((t) => t.fin.getTime()))),
      avancement: avancementPondere(taches),
      groupe: true,
    });
    lignes.push(...taches.map(ligneTache));
  }
  lignes.push(...projet.taches.filter((t) => !t.phaseId).map(ligneTache));

  return (
    <div className="space-y-3">
      <LegendeGantt />
      <Gantt lignes={lignes} />
    </div>
  );
}

function OngletBudget({
  projet,
  budget,
}: {
  projet: Projet;
  budget: ReturnType<typeof calculerBudget>;
}) {
  const parMembre = new Map<string, { nom: string; taux: number; jours: number }>();
  for (const t of projet.temps) {
    const e = parMembre.get(t.membreId) ?? { nom: t.membre.nom, taux: t.membre.tauxJournalier, jours: 0 };
    e.jours += t.jours;
    parMembre.set(t.membreId, e);
  }
  const membres = [...parMembre.values()].sort((a, b) => b.jours * b.taux - a.jours * a.taux);
  const echelle = Math.max(budget.budget, budget.previsionFinale) || 1;
  const pct = (v: number) => `${(v / echelle) * 100}%`;

  return (
    <div className="space-y-5">
      <Carte titre="Budget vs prévision">
        <div className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Montant du marché (budget)</span>
              <span className="font-medium">{formatMontant(budget.budget)}</span>
            </div>
            <div className="h-4 rounded bg-slate-100">
              <div className="h-full rounded bg-slate-400" style={{ width: pct(budget.budget) }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Prévision à terminaison</span>
              <span className={`font-medium ${budget.ecart < 0 ? "text-red-600" : "text-emerald-600"}`}>
                {formatMontant(budget.previsionFinale)}
              </span>
            </div>
            <div className="flex h-4 overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-indigo-600" style={{ width: pct(budget.coutTemps) }} title="Temps passés" />
              <div className="h-full bg-sky-400" style={{ width: pct(budget.coutDepenses) }} title="Dépenses réalisées" />
              <div
                className="h-full bg-indigo-200 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,.6)_4px,rgba(255,255,255,.6)_8px)]"
                style={{ width: pct(budget.resteAFaire) }}
                title="Reste à faire"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
              <span>■ <span className="text-indigo-600">Temps passés</span> {formatMontant(budget.coutTemps)}</span>
              <span>■ <span className="text-sky-500">Dépenses réalisées</span> {formatMontant(budget.coutDepenses)}</span>
              <span>■ <span className="text-indigo-300">Reste à faire</span> {formatMontant(budget.resteAFaire)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Temps passés = jours saisis × taux journalier · Reste à faire = charge restante des tâches ×
            taux du responsable + achats prévus (dépenses datées dans le futur).
          </p>
        </div>
      </Carte>

      <div className="grid gap-5 lg:grid-cols-2">
        <Carte titre="Temps passés par membre">
          {membres.length === 0 ? (
            <Vide>Aucun temps saisi.</Vide>
          ) : (
            <table className={tableClass}>
              <thead className="border-b border-slate-200">
                <tr>
                  <th className={thClass}>Membre</th>
                  <th className={`${thClass} text-right`}>Jours</th>
                  <th className={`${thClass} text-right`}>Coût</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {membres.map((m) => (
                  <tr key={m.nom}>
                    <td className={tdClass}>{m.nom}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatJours(m.jours)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatMontant(m.jours * m.taux)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Carte>

        <Carte titre="Dépenses">
          {projet.depenses.length === 0 ? (
            <Vide>Aucune dépense.</Vide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projet.depenses.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{d.libelle}</div>
                    <div className="text-xs text-slate-500">
                      {d.categorie} · {formatDate(d.date)}
                      {d.date > new Date() && <span className="ml-1 font-medium text-indigo-600">(achat prévu)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap tabular-nums">{formatMontant(d.montant)}</span>
                    <form action={supprimerDepense.bind(null, projet.id, d.id)}>
                      <button className="text-xs text-slate-400 hover:text-red-600" title="Supprimer">
                        ✕
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      <Carte titre="Ajouter une dépense">
        <DepenseForm action={ajouterDepense.bind(null, projet.id)} />
      </Carte>
    </div>
  );
}

function OngletRisques({ projet }: { projet: Projet }) {
  const ouverts = projet.risques.filter((r) => r.statut !== "Clos");
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Matrice des risques ouverts">
          <MatriceRisques risques={ouverts} />
        </Carte>
        <Carte
          titre={`Registre (${projet.risques.length})`}
          className="lg:col-span-2"
          action={
            <Link href={`/projets/${projet.id}/risques/nouveau`} className="text-sm font-medium text-indigo-700 hover:underline">
              + Risque / problème
            </Link>
          }
        >
          {projet.risques.length === 0 ? (
            <Vide>Aucun risque identifié.</Vide>
          ) : (
            <ul className="divide-y divide-slate-100">
              {projet.risques.map((r) => (
                <li key={r.id} className="flex items-start gap-3 py-2.5">
                  <ScoreRisque score={criticite(r)} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/projets/${projet.id}/risques/${r.id}`} className={lienClass}>
                      {r.titre}
                    </Link>
                    <div className="text-xs text-slate-500">
                      Probabilité {libelleNiveau(r.probabilite).toLowerCase()} · impact{" "}
                      {libelleNiveau(r.impact).toLowerCase()} · {r.responsable?.nom ?? "non affecté"}
                      {r.echeance && ` · échéance ${formatDate(r.echeance)}`}
                    </div>
                    {r.mitigation && <div className="mt-1 text-sm text-slate-600">→ {r.mitigation}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Badge>{r.type}</Badge>
                    <Badge>{r.statut}</Badge>
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
