import Link from "next/link";
import { prisma } from "@/lib/db";
import { calculOpportunite, estEnRetard, getEtapesPipeline } from "@/lib/calculs";
import { TYPES_OFFRE } from "@/lib/listes";
import { construireRequete, correspond, dansJours, lireParam, trier, type SearchParams } from "@/lib/vues";
import { formatEuros, formatPourcentage, formatDate, linkButtonClass, Badge, rowLinkClass } from "@/components/ui";
import { EnTeteTriable, ListeOutils } from "@/components/vues";
import { Kanban } from "./Kanban";

export const dynamic = "force-dynamic";

const CHEMIN = "/pipeline";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [opportunites, etapes, fondateurs, vues] = await Promise.all([
    prisma.opportunite.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
    getEtapesPipeline(),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.vueListe.findMany({ where: { page: CHEMIN }, orderBy: { createdAt: "asc" } }),
  ]);

  const modeKanban = lireParam(params, "vue") === "kanban";
  const q = lireParam(params, "q");
  const etape = lireParam(params, "etape");
  const fondateur = lireParam(params, "fondateur");
  const typeOffre = lireParam(params, "typeOffre");
  const statut = lireParam(params, "statut");
  const closing = Number(lireParam(params, "closing")) || 0;
  const limiteClosing = dansJours(closing);

  const filtres = opportunites.filter((o) => {
    if (!correspond(q, o.intitule, o.compte.nom, o.prochaineAction, o.concurrenceIdentifiee))
      return false;
    if (etape && o.etape !== etape) return false;
    if (fondateur && o.fondateurReferent !== fondateur) return false;
    if (typeOffre && o.typeOffre !== typeOffre) return false;
    const fermee = o.etape === "Signé" || o.etape === "Perdu";
    if (statut === "ouvertes" && fermee) return false;
    if (statut === "signees" && o.etape !== "Signé") return false;
    if (statut === "perdues" && o.etape !== "Perdu") return false;
    if (statut === "retard" && !estEnRetard(o.echeanceProchaineAction)) return false;
    if (closing && (fermee || !o.dateClosingVisee || o.dateClosingVisee.getTime() > limiteClosing))
      return false;
    return true;
  });

  const lignes = trier(
    filtres.map((o) => ({ ...o, ...calculOpportunite(o, etapes) })),
    params,
    {
      intitule: (o) => o.intitule,
      compte: (o) => o.compte.nom,
      etape: (o) => etapes.findIndex((e) => e.etape === o.etape),
      montant: (o) => o.montant,
      probabilite: (o) => o.probabilite,
      pondere: (o) => o.montantPondere,
      closing: (o) => o.dateClosingVisee,
      echeance: (o) => o.echeanceProchaineAction,
    },
    { tri: "creation", sens: "desc" }
  );

  const totalMontant = lignes.reduce((s, o) => s + o.montant, 0);
  const totalPondere = lignes.reduce((s, o) => s + o.montantPondere, 0);

  const th = (colonne: string, label: string, droite = false, sens: "asc" | "desc" = "asc") => (
    <EnTeteTriable
      chemin={CHEMIN}
      params={params}
      colonne={colonne}
      droite={droite}
      sensParDefaut={sens}
    >
      {label}
    </EnTeteTriable>
  );

  const ongletClass = (actif: boolean) =>
    `px-3 py-1.5 text-sm font-medium ${
      actif ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Pipeline commercial</h1>
          <p className="text-sm text-slate-500">
            La probabilité et le montant pondéré se calculent depuis l&apos;étape.
            {modeKanban && " Glissez une carte d'une colonne à l'autre pour changer d'étape."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
            <Link
              href={`${CHEMIN}?${construireRequete(params, { vue: "" })}`}
              className={ongletClass(!modeKanban)}
            >
              Liste
            </Link>
            <Link
              href={`${CHEMIN}?${construireRequete(params, { vue: "kanban" })}`}
              className={`border-l border-slate-300 ${ongletClass(modeKanban)}`}
            >
              Kanban
            </Link>
          </div>
          <Link href="/pipeline/nouveau" className={linkButtonClass}>
            + Nouvelle opportunité
          </Link>
        </div>
      </div>

      <ListeOutils
        chemin={CHEMIN}
        params={params}
        conserver={["vue"]}
        placeholder="Opportunité, compte, prochaine action…"
        nbResultats={lignes.length}
        vuesEnregistrees={vues}
        vuesPredefinies={[
          { nom: "Opportunités ouvertes", requete: "statut=ouvertes" },
          { nom: "Closing sous 90 jours", requete: "closing=90" },
          { nom: "Actions en retard", requete: "statut=retard" },
          { nom: "Signées", requete: "statut=signees" },
        ]}
        filtres={[
          { nom: "etape", label: "Étape", options: etapes.map((e) => e.etape) },
          { nom: "fondateur", label: "Fondateur", options: fondateurs.map((f) => f.nom) },
          { nom: "typeOffre", label: "Offre", options: TYPES_OFFRE },
          {
            nom: "statut",
            label: "Statut",
            options: [
              { valeur: "ouvertes", label: "Ouvertes" },
              { valeur: "signees", label: "Signées" },
              { valeur: "perdues", label: "Perdues" },
              { valeur: "retard", label: "Action en retard" },
            ],
          },
          {
            nom: "closing",
            label: "Closing",
            options: [
              { valeur: "30", label: "Closing sous 30 j" },
              { valeur: "90", label: "Closing sous 90 j" },
              { valeur: "180", label: "Closing sous 180 j" },
            ],
          },
        ]}
      />

      <p className="text-sm text-slate-600">
        Total : <span className="font-semibold text-slate-900">{formatEuros(totalMontant)}</span>
        {" · "}pondéré :{" "}
        <span className="font-semibold text-slate-900">{formatEuros(totalPondere)}</span>
      </p>

      {modeKanban ? (
        <Kanban
          etapes={etapes}
          cartes={lignes.map((o) => ({
            id: o.id,
            intitule: o.intitule,
            compteId: o.compteId,
            compteNom: o.compte.nom,
            montant: o.montant,
            etape: o.etape,
            dateClosingVisee: o.dateClosingVisee,
            echeanceProchaineAction: o.echeanceProchaineAction,
            prochaineAction: o.prochaineAction,
            fondateurReferent: o.fondateurReferent,
          }))}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {th("intitule", "Opportunité")}
                {th("compte", "Compte")}
                {th("etape", "Étape")}
                {th("montant", "Montant", true, "desc")}
                {th("probabilite", "Probabilité", true, "desc")}
                {th("pondere", "Montant pondéré", true, "desc")}
                {th("closing", "Closing visé")}
                {th("echeance", "Échéance action")}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/pipeline/${o.id}`} className={rowLinkClass}>
                      {o.intitule}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <Link href={`/comptes/${o.compteId}`} className="hover:underline">
                      {o.compte.nom}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{o.etape}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatEuros(o.montant)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatPourcentage(o.probabilite)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(o.montantPondere)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(o.dateClosingVisee)}</td>
                  <td className="px-3 py-2">
                    {o.echeanceProchaineAction ? (
                      <Badge retard={estEnRetard(o.echeanceProchaineAction)}>
                        {formatDate(o.echeanceProchaineAction)}
                      </Badge>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    {opportunites.length === 0
                      ? "Aucune opportunité pour l'instant."
                      : "Aucune opportunité ne correspond à ces filtres."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
