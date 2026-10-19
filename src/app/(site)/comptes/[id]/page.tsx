import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  calculMission,
  calculOpportunite,
  estEnRetard,
  getEtapesPipeline,
} from "@/lib/calculs";
import { classerEcheance } from "@/lib/agenda";
import { joursDepuis } from "@/lib/vues";
import { Badge, Section, formatDate, formatEuros, rowLinkClass } from "@/components/ui";
import { CaseTache, ListeAgenda } from "@/components/agenda";

// Fiche 360 (equivalent de la page "Account" Salesforce) : toutes les informations liees a un
// compte sur une seule page, avec la frise d'activite et des raccourcis de creation.

type EvenementFrise = {
  cle: string;
  date: Date;
  icone: string;
  titre: string;
  detail: string | null;
  href: string;
};

function Indicateur({ label, valeur, alerte }: { label: string; valeur: string; alerte?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${alerte ? "text-red-600" : "text-slate-900"}`}>
        {valeur}
      </p>
    </div>
  );
}

function Champ({ label, valeur }: { label: string; valeur: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{valeur || "–"}</span>
    </div>
  );
}

const thClass = "px-3 py-2";
const tdClass = "px-3 py-2 text-slate-600";

export default async function FicheComptePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [compte, etapes] = await Promise.all([
    prisma.compte.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: [{ nom: "asc" }, { prenom: "asc" }] },
        opportunites: { orderBy: { createdAt: "desc" } },
        missions: { include: { ressource: true }, orderBy: { createdAt: "desc" } },
        interactions: { include: { contact: true }, orderBy: { date: "desc" } },
        taches: { include: { contact: true }, orderBy: { echeance: "asc" } },
      },
    }),
    getEtapesPipeline(),
  ]);

  if (!compte) notFound();

  const retour = encodeURIComponent(`/comptes/${id}`);
  const opportunites = compte.opportunites.map((o) => ({ ...o, ...calculOpportunite(o, etapes) }));
  const ouvertes = opportunites.filter((o) => o.etape !== "Signé" && o.etape !== "Perdu");
  const pipelinePondere = opportunites.reduce((s, o) => s + o.montantPondere, 0);
  const caSigne = opportunites.filter((o) => o.etape === "Signé").reduce((s, o) => s + o.montant, 0);
  const missionsEnCours = compte.missions.filter((m) => m.statut === "En cours");
  const caMensuel = missionsEnCours.reduce((s, m) => s + (calculMission(m).caMensuel ?? 0), 0);
  const derniereInteraction = compte.interactions[0]?.date ?? null;
  const joursSansInteraction = joursDepuis(derniereInteraction);

  const tachesOuvertes = compte.taches.filter((t) => t.statut !== "Terminée");
  const tachesTerminees = compte.taches.filter((t) => t.statut === "Terminée");

  const frise: EvenementFrise[] = [
    ...compte.interactions.map((i) => ({
      cle: `i-${i.id}`,
      date: i.date,
      icone: "💬",
      titre: `${i.type}${i.sujet ? ` — ${i.sujet}` : ""}`,
      detail:
        [i.contact && `${i.contact.prenom} ${i.contact.nom}`, i.fondateur, i.compteRendu]
          .filter(Boolean)
          .join(" · ") || null,
      href: `/interactions/${i.id}`,
    })),
    ...tachesTerminees
      .filter((t) => t.termineeLe)
      .map((t) => ({
        cle: `t-${t.id}`,
        date: t.termineeLe!,
        icone: "✅",
        titre: `Tâche terminée — ${t.sujet}`,
        detail: t.fondateur,
        href: `/taches/${t.id}`,
      })),
    ...compte.opportunites.map((o) => ({
      cle: `o-${o.id}`,
      date: o.createdAt,
      icone: "💼",
      titre: `Opportunité créée — ${o.intitule}`,
      detail: `${formatEuros(o.montant)} · aujourd'hui : ${o.etape}`,
      href: `/pipeline/${o.id}`,
    })),
    ...compte.missions
      .filter((m) => m.dateDebut)
      .map((m) => ({
        cle: `m-${m.id}`,
        date: m.dateDebut!,
        icone: "🚀",
        titre: `Début de mission — ${m.mission}`,
        detail: m.ressource ? `${m.ressource.prenom} ${m.ressource.nom}` : null,
        href: `/missions/${m.id}`,
      })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 25);

  const raccourcis = [
    { href: `/interactions/nouveau?compteId=${id}&retour=${retour}`, label: "+ Interaction" },
    { href: `/taches/nouveau?compteId=${id}&retour=${retour}`, label: "+ Tâche" },
    { href: `/pipeline/nouveau?compteId=${id}&retour=${retour}`, label: "+ Opportunité" },
    { href: `/contacts/nouveau?compteId=${id}&retour=${retour}`, label: "+ Contact" },
  ];

  return (
    <div className="space-y-5">
      <Link href="/comptes" className="text-sm text-slate-500 hover:text-slate-900">
        ← Comptes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Compte</p>
          <h1 className="text-xl font-semibold text-slate-900">{compte.nom}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{compte.categorie}</Badge>
            <Badge>{compte.statutRelation}</Badge>
            <Badge retard={compte.priorite === "Haute"}>Priorité {compte.priorite.toLowerCase()}</Badge>
            {compte.secteur && <Badge>{compte.secteur}</Badge>}
          </div>
          {compte.fondateurReferent && (
            <p className="mt-2 text-sm text-slate-500">
              Référent : <span className="text-slate-800">{compte.fondateurReferent}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {raccourcis.map((r) => (
            <Link
              key={r.label}
              href={r.href}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {r.label}
            </Link>
          ))}
          <Link
            href={`/comptes/${id}/modifier`}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicateur label="Pipeline pondéré" valeur={formatEuros(pipelinePondere)} />
        <Indicateur label="CA signé" valeur={formatEuros(caSigne)} />
        <Indicateur label="CA mensuel (missions en cours)" valeur={formatEuros(caMensuel)} />
        <Indicateur
          label="Dernière interaction"
          valeur={
            joursSansInteraction == null
              ? "Jamais"
              : joursSansInteraction === 0
                ? "Aujourd'hui"
                : `Il y a ${joursSansInteraction} j`
          }
          alerte={joursSansInteraction == null || joursSansInteraction >= 90}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section
            title={`Opportunités (${opportunites.length}, dont ${ouvertes.length} ouverte${ouvertes.length > 1 ? "s" : ""})`}
            action={
              <Link href={`/pipeline?q=${encodeURIComponent(compte.nom)}&vue=kanban`} className="text-xs text-slate-500 hover:underline">
                Voir en Kanban
              </Link>
            }
          >
            {opportunites.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune opportunité.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={thClass}>Opportunité</th>
                      <th className={thClass}>Étape</th>
                      <th className={`${thClass} text-right`}>Montant</th>
                      <th className={`${thClass} text-right`}>Pondéré</th>
                      <th className={thClass}>Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {opportunites.map((o) => (
                      <tr key={o.id}>
                        <td className="px-3 py-2">
                          <Link href={`/pipeline/${o.id}`} className={rowLinkClass}>
                            {o.intitule}
                          </Link>
                        </td>
                        <td className={tdClass}>{o.etape}</td>
                        <td className={`${tdClass} text-right`}>{formatEuros(o.montant)}</td>
                        <td className={`${tdClass} text-right`}>{formatEuros(o.montantPondere)}</td>
                        <td className={tdClass}>{formatDate(o.dateClosingVisee)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={`Contacts (${compte.contacts.length})`}>
            {compte.contacts.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun contact rattaché.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={thClass}>Nom</th>
                      <th className={thClass}>Fonction</th>
                      <th className={thClass}>Coordonnées</th>
                      <th className={thClass}>Relance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compte.contacts.map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2">
                          <Link href={`/contacts/${c.id}`} className={rowLinkClass}>
                            {c.prenom} {c.nom}
                          </Link>
                          {c.roleDecision && (
                            <span className="block text-xs text-slate-400">{c.roleDecision}</span>
                          )}
                        </td>
                        <td className={tdClass}>{c.fonction ?? "–"}</td>
                        <td className={tdClass}>
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="hover:underline">
                              {c.email}
                            </a>
                          ) : (
                            "–"
                          )}
                          {c.telephone && (
                            <span className="block text-xs text-slate-400">{c.telephone}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {c.relancePrevueLe ? (
                            <Badge retard={estEnRetard(c.relancePrevueLe)}>
                              {formatDate(c.relancePrevueLe)}
                            </Badge>
                          ) : (
                            "–"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title={`Missions (${compte.missions.length})`}>
            {compte.missions.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune mission.</p>
            ) : (
              <div className="-mx-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className={thClass}>Mission</th>
                      <th className={thClass}>Ressource</th>
                      <th className={thClass}>Statut</th>
                      <th className={`${thClass} text-right`}>CA mensuel</th>
                      <th className={`${thClass} text-right`}>Marge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compte.missions.map((m) => {
                      const calc = calculMission(m);
                      return (
                        <tr key={m.id}>
                          <td className="px-3 py-2">
                            <Link href={`/missions/${m.id}`} className={rowLinkClass}>
                              {m.mission}
                            </Link>
                          </td>
                          <td className={tdClass}>
                            {m.ressource ? `${m.ressource.prenom} ${m.ressource.nom}` : "–"}
                          </td>
                          <td className={tdClass}>{m.statut}</td>
                          <td className={`${tdClass} text-right`}>{formatEuros(calc.caMensuel)}</td>
                          <td className={`${tdClass} text-right`}>
                            {formatEuros(calc.margeMensuelle)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section
            title={`Tâches ouvertes (${tachesOuvertes.length})`}
            action={
              <Link
                href={`/taches/nouveau?compteId=${id}&retour=${retour}`}
                className="text-xs text-slate-500 hover:underline"
              >
                + Ajouter
              </Link>
            }
          >
            <ListeAgenda
              vide="Aucune tâche ouverte."
              elements={tachesOuvertes.map((t) => ({
                cle: t.id,
                source: "Tâche",
                titre: t.sujet,
                contexte: t.contact ? `${t.contact.prenom} ${t.contact.nom}` : null,
                date: t.echeance,
                echeance: classerEcheance(t.echeance),
                href: `/taches/${t.id}`,
                fondateur: t.fondateur,
                priorite: t.priorite,
                tacheId: t.id,
              }))}
            />
          </Section>

          <Section title="Activité">
            {frise.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune activité enregistrée.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {frise.map((e) => (
                  <li key={e.cle} className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs ring-1 ring-slate-200"
                    >
                      {e.icone}
                    </span>
                    <p className="text-xs text-slate-400">{formatDate(e.date)}</p>
                    <Link href={e.href} className="text-sm font-medium text-slate-900 hover:underline">
                      {e.titre}
                    </Link>
                    {e.detail && (
                      <p className="line-clamp-3 text-xs text-slate-500">{e.detail}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title="Détails">
            <Champ label="Contact principal" valeur={compte.contactPrincipal} />
            <Champ label="Origine de la relation" valeur={compte.origineRelation} />
            <Champ label="Référencement" valeur={compte.statutReferencement} />
            <Champ
              label="Délai de paiement"
              valeur={compte.delaiPaiementJours != null ? `${compte.delaiPaiementJours} jours` : null}
            />
            <Champ label="Créé le" valeur={formatDate(compte.createdAt)} />
            {compte.notes && (
              <p className="mt-3 whitespace-pre-line rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                {compte.notes}
              </p>
            )}
          </Section>
        </div>
      </div>

      {tachesTerminees.length > 0 && (
        <Section title={`Tâches terminées (${tachesTerminees.length})`}>
          <ul className="divide-y divide-slate-100">
            {tachesTerminees.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-1.5">
                <CaseTache id={t.id} terminee />
                <Link href={`/taches/${t.id}`} className="text-sm text-slate-500 line-through">
                  {t.sujet}
                </Link>
                <span className="ml-auto text-xs text-slate-400">{formatDate(t.termineeLe)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
