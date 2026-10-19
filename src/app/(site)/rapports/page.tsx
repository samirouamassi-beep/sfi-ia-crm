import Link from "next/link";
import { getRapports } from "@/lib/rapports";
import { Section, formatEuros, formatPourcentage } from "@/components/ui";
import { BarresHorizontales, COULEURS, Colonnes, Legende, Tuile } from "@/components/graphiques";

export const dynamic = "force-dynamic";

const thClass = "px-3 py-2";
const tdClass = "px-3 py-2 text-slate-600";

export default async function RapportsPage() {
  const r = await getRapports();
  const s = r.synthese;
  const colonnesPrevisionnel = [
    ...(r.previsionnel.closingDepasse > 0
      ? [
          {
            label: "Dépassé",
            valeur: r.previsionnel.closingDepasse,
            texte: formatEuros(r.previsionnel.closingDepasse),
            infobulle: `Closing visé déjà passé : ${formatEuros(r.previsionnel.closingDepasse)} pondérés`,
            accent: true,
          },
        ]
      : []),
    ...r.previsionnel.mois.map((m) => ({
      label: m.label,
      valeur: m.pondere,
      texte: formatEuros(m.pondere),
      infobulle: `${m.label} : ${formatEuros(m.pondere)} pondérés (${m.nb} opportunité${m.nb > 1 ? "s" : ""})`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Rapports</h1>
        <p className="text-sm text-slate-500">
          Calculés en direct à partir du pipeline, des interactions, des missions et des
          prospects. Survolez une barre pour le détail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tuile
          label="Pipeline pondéré ouvert"
          valeur={formatEuros(s.pipelinePondere)}
          detail={`${s.nbOuvertes} opportunités · ${formatEuros(s.pipelineTotal)} brut`}
        />
        <Tuile
          label="Taux de réussite"
          valeur={formatPourcentage(s.tauxReussite)}
          detail={`${s.nbSignees} signées · ${formatEuros(s.montantSigne)}`}
        />
        <Tuile
          label="CA mensuel récurrent"
          valeur={formatEuros(s.caMensuel)}
          detail={`Marge ${formatPourcentage(s.tauxMarge)}`}
        />
        <Tuile
          label="Taux d'occupation"
          valeur={formatPourcentage(s.tauxOccupation)}
          detail={`${s.enMission} en mission sur ${s.mobilisables} mobilisables`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Pipeline ouvert par étape">
          <Legende
            elements={[
              { label: "Montant pondéré", couleur: COULEURS.principale },
              { label: "Montant total", couleur: COULEURS.secondaire },
            ]}
          />
          <BarresHorizontales
            vide="Aucune opportunité ouverte."
            barres={r.parEtape.map((e) => ({
              label: e.etape,
              valeur: e.pondere,
              fond: e.montant,
              texte: formatEuros(e.pondere),
              href: `/pipeline?etape=${encodeURIComponent(e.etape)}&vue=kanban`,
              infobulle: `${e.etape} (${Math.round(e.probabilite * 100)} %) : ${e.nb} opportunité${
                e.nb > 1 ? "s" : ""
              }, ${formatEuros(e.montant)} au total, ${formatEuros(e.pondere)} pondérés`,
            }))}
          />
        </Section>

        <Section title="Prévisionnel pondéré par mois de closing">
          <Colonnes vide="Aucune date de closing renseignée." colonnes={colonnesPrevisionnel} />
          {r.previsionnel.sansDate > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              + {formatEuros(r.previsionnel.sansDate)} pondérés sans date de closing.
            </p>
          )}
        </Section>

        <Section title="Activité : interactions par semaine (12 semaines)">
          <Colonnes
            vide="Aucune interaction sur les 12 dernières semaines."
            colonnes={r.semaines.map((w) => ({
              label: w.label,
              valeur: w.nb,
              infobulle: `Semaine du ${w.label} : ${w.nb} interaction${w.nb > 1 ? "s" : ""}`,
            }))}
          />
          {r.parType.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              90 derniers jours : {r.parType.map(([type, nb]) => `${type} ${nb}`).join(" · ")}
            </p>
          )}
        </Section>

        <Section title="CA mensuel récurrent par compte">
          <BarresHorizontales
            vide="Aucune mission en cours."
            barres={r.caParCompte.slice(0, 8).map((c) => ({
              label: c.nom,
              valeur: c.ca,
              texte: formatEuros(c.ca),
              href: `/comptes/${c.id}`,
              infobulle: `${c.nom} : ${formatEuros(c.ca)} / mois, marge ${formatEuros(c.marge)}`,
            }))}
          />
          {r.caParCompte.length > 8 && (
            <p className="mt-2 text-xs text-slate-500">
              + {r.caParCompte.length - 8} autres comptes :{" "}
              {formatEuros(r.caParCompte.slice(8).reduce((t, c) => t + c.ca, 0))}
            </p>
          )}
        </Section>
      </div>

      <Section title="Résultats par fondateur">
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className={thClass}>Fondateur</th>
                <th className={`${thClass} text-right`}>Opp. ouvertes</th>
                <th className={`${thClass} text-right`}>Pipeline pondéré</th>
                <th className={`${thClass} text-right`}>Signées / perdues</th>
                <th className={`${thClass} text-right`}>Montant signé</th>
                <th className={thClass}>Taux de réussite</th>
                <th className={`${thClass} text-right`}>Interactions 90 j</th>
                <th className={`${thClass} text-right`}>Tâches ouvertes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {r.parFondateur.map((f) => (
                <tr key={f.fondateur}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {f.fondateur === "Non attribué" ? (
                      f.fondateur
                    ) : (
                      <Link
                        href={`/pipeline?fondateur=${encodeURIComponent(f.fondateur)}&statut=ouvertes`}
                        className="hover:underline"
                      >
                        {f.fondateur}
                      </Link>
                    )}
                  </td>
                  <td className={`${tdClass} text-right`}>{f.nbOuvertes}</td>
                  <td className={`${tdClass} text-right`}>{formatEuros(f.pondere)}</td>
                  <td className={`${tdClass} text-right`}>
                    {f.nbSignees} / {f.nbPerdues}
                  </td>
                  <td className={`${tdClass} text-right`}>{formatEuros(f.montantSigne)}</td>
                  <td className={tdClass}>
                    {f.tauxReussite == null ? (
                      "–"
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-20 rounded-full bg-[#cde2fb]">
                          <span
                            className="block h-2 rounded-full"
                            style={{
                              width: `${f.tauxReussite * 100}%`,
                              backgroundColor: COULEURS.principale,
                            }}
                          />
                        </span>
                        {formatPourcentage(f.tauxReussite)}
                      </span>
                    )}
                  </td>
                  <td className={`${tdClass} text-right`}>{f.interactions90j}</td>
                  <td className={`${tdClass} text-right`}>{f.tachesOuvertes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Prospects par statut">
          <BarresHorizontales
            vide="Aucun prospect."
            barres={r.prospectsParStatut.map((p) => ({
              label: p.statut,
              valeur: p.nb,
              href: `/prospects?statut=${encodeURIComponent(p.statut)}`,
            }))}
          />
          <p className="mt-3 text-xs text-slate-500">
            Taux de conversion global : {formatPourcentage(s.tauxConversionProspects)}
          </p>
        </Section>

        <Section title="Conversion des prospects par source">
          {r.sources.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun prospect.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Source</th>
                  <th className="py-2 text-right">Prospects</th>
                  <th className="py-2 text-right">Convertis</th>
                  <th className="py-2 text-right">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.sources.map(([source, v]) => (
                  <tr key={source}>
                    <td className="py-2 text-slate-700">{source}</td>
                    <td className="py-2 text-right text-slate-600">{v.total}</td>
                    <td className="py-2 text-right text-slate-600">{v.convertis}</td>
                    <td className="py-2 text-right text-slate-600">
                      {formatPourcentage(v.convertis / v.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </div>
  );
}
