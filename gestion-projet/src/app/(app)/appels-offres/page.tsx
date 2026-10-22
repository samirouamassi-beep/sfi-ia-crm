import Link from "next/link";
import { prisma } from "@/lib/db";
import { debutJour, dureeJours } from "@/lib/calculs";
import { STATUTS_AO } from "@/lib/listes";
import {
  Badge,
  Carte,
  EnTete,
  Kpi,
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

export const metadata = { title: "Appels d'offres" };

const EN_COURS = ["Veille", "En préparation", "Déposé"];

export default async function AppelsOffresPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut = "en-cours" } = await searchParams;
  const tous = await prisma.appelOffre.findMany({
    include: { responsable: true, projet: true },
    orderBy: { dateLimite: "asc" },
  });
  const auj = debutJour(new Date());
  const liste =
    statut === "en-cours" ? tous.filter((a) => EN_COURS.includes(a.statut)) : statut === "tous" ? tous : tous.filter((a) => a.statut === statut);

  const enCours = tous.filter((a) => EN_COURS.includes(a.statut));
  const gagnes = tous.filter((a) => a.statut === "Gagné");
  const perdus = tous.filter((a) => a.statut === "Perdu");
  const aDeposer = enCours.filter((a) => a.statut !== "Déposé" && a.dateLimite >= auj);
  const prochain = aDeposer[0];
  const cautions = tous
    .filter((a) => a.statut === "Déposé")
    .reduce((s, a) => s + (a.cautionProvisoire ?? 0), 0);

  const puce = (valeur: string, label: string) => (
    <Link
      key={valeur}
      href={`/appels-offres?statut=${encodeURIComponent(valeur)}`}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        statut === valeur ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <EnTete
        titre="Appels d'offres"
        sousTitre="Veille, préparation et suivi des offres auprès de l'ONEE, des SRM et des régies."
        actions={
          <Link href="/appels-offres/nouveau" className={boutonPrincipal}>
            + Nouvel appel d&apos;offres
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Offres en cours"
          valeur={enCours.length}
          detail={`${formatMontant(enCours.reduce((s, a) => s + (a.montantSoumis ?? a.montantEstime ?? 0), 0))} en jeu`}
        />
        <Kpi
          label="Prochain dépôt"
          valeur={prochain ? `J-${dureeJours(auj, prochain.dateLimite) - 1}` : "—"}
          detail={prochain ? `${prochain.maitreOuvrage} · ${formatDate(prochain.dateLimite)}` : "Aucun dépôt prévu"}
          ton={prochain && dureeJours(auj, prochain.dateLimite) <= 8 ? "alerte" : "neutre"}
        />
        <Kpi
          label="Taux de réussite"
          valeur={gagnes.length + perdus.length ? formatPourcentage(gagnes.length / (gagnes.length + perdus.length)) : "—"}
          detail={`${gagnes.length} gagné(s) · ${perdus.length} perdu(s)`}
          ton="bon"
        />
        <Kpi label="Cautions provisoires immobilisées" valeur={formatMontant(cautions)} detail="offres déposées en attente" />
      </div>

      <Carte>
        <div className="mb-3 flex flex-wrap gap-2">
          {puce("en-cours", "En cours")}
          {STATUTS_AO.map((s) => puce(s, s))}
          {puce("tous", "Tous")}
        </div>
        <div className="-mx-4 overflow-x-auto">
          <table className={tableClass}>
            <thead className="border-b border-slate-200">
              <tr>
                <th className={thClass}>Référence</th>
                <th className={thClass}>Objet</th>
                <th className={thClass}>Maître d&apos;ouvrage</th>
                <th className={thClass}>Date limite</th>
                <th className={`${thClass} text-right`}>Estimation</th>
                <th className={`${thClass} text-right`}>Soumis</th>
                <th className={thClass}>Responsable</th>
                <th className={thClass}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {liste.map((a) => {
                const jours = dureeJours(auj, a.dateLimite) - 1;
                const urgent = EN_COURS.includes(a.statut) && a.statut !== "Déposé" && jours >= 0 && jours <= 7;
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className={`${tdClass} whitespace-nowrap font-mono text-xs text-slate-500`}>{a.reference}</td>
                    <td className={tdClass}>
                      <Link href={`/appels-offres/${a.id}`} className={lienClass}>
                        {a.objet}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {a.activite} · {a.procedure}
                      </div>
                    </td>
                    <td className={tdClass}>{a.maitreOuvrage}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <div className={urgent ? "font-medium text-red-600" : ""}>{formatDate(a.dateLimite)}</div>
                      {EN_COURS.includes(a.statut) && a.statut !== "Déposé" && jours >= 0 && (
                        <div className="text-xs text-slate-500">dans {jours} j</div>
                      )}
                    </td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatMontant(a.montantEstime)}</td>
                    <td className={`${tdClass} text-right tabular-nums`}>{formatMontant(a.montantSoumis)}</td>
                    <td className={tdClass}>{a.responsable?.nom ?? "—"}</td>
                    <td className={tdClass}>
                      <Badge ton={a.statut === "Gagné" ? "Terminé" : a.statut === "Perdu" ? "Ouvert" : a.statut === "Déposé" ? "En revue" : a.statut === "En préparation" ? "En cours" : "À faire"}>
                        {a.statut}
                      </Badge>
                      {a.projet && (
                        <Link href={`/projets/${a.projet.id}`} className="ml-1 text-xs text-indigo-700 hover:underline">
                          → {a.projet.code}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {liste.length === 0 && <Vide>Aucun appel d&apos;offres.</Vide>}
        </div>
      </Carte>
    </div>
  );
}
