import Link from "next/link";
import { prisma } from "@/lib/db";
import { SOURCES_PROSPECT, STATUTS_PROSPECT } from "@/lib/listes";
import { correspond, lireParam, trier, type SearchParams } from "@/lib/vues";
import { Badge, formatDate, linkButtonClass, rowLinkClass } from "@/components/ui";
import { EnTeteTriable, ListeOutils } from "@/components/vues";

export const dynamic = "force-dynamic";

const CHEMIN = "/prospects";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [prospects, fondateurs, vues] = await Promise.all([
    prisma.prospect.findMany({ include: { compte: true }, orderBy: { createdAt: "desc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.vueListe.findMany({ where: { page: CHEMIN }, orderBy: { createdAt: "asc" } }),
  ]);

  const q = lireParam(params, "q");
  const statut = lireParam(params, "statut");
  const source = lireParam(params, "source");
  const fondateur = lireParam(params, "fondateur");

  const filtres = prospects.filter((p) => {
    if (!correspond(q, `${p.nom} ${p.prenom}`, `${p.prenom} ${p.nom}`, p.societe, p.email, p.fonction))
      return false;
    if (statut === "aTraiter" && p.statut !== "Nouveau" && p.statut !== "Contacté") return false;
    if (statut && statut !== "aTraiter" && p.statut !== statut) return false;
    if (source && p.source !== source) return false;
    if (fondateur && p.fondateurReferent !== fondateur) return false;
    return true;
  });

  const lignes = trier(
    filtres,
    params,
    {
      nom: (p) => `${p.nom} ${p.prenom}`,
      societe: (p) => p.societe,
      statut: (p) => STATUTS_PROSPECT.indexOf(p.statut as (typeof STATUTS_PROSPECT)[number]),
      source: (p) => p.source,
      fondateur: (p) => p.fondateurReferent,
      creation: (p) => p.createdAt,
    },
    { tri: "creation", sens: "desc" }
  );

  const nbOuverts = prospects.filter((p) => !p.convertiLe && p.statut !== "Non qualifié").length;
  const nbConvertis = prospects.filter((p) => p.convertiLe).length;

  const th = (colonne: string, label: string, sens: "asc" | "desc" = "asc") => (
    <EnTeteTriable chemin={CHEMIN} params={params} colonne={colonne} sensParDefaut={sens}>
      {label}
    </EnTeteTriable>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Prospects</h1>
          <p className="text-sm text-slate-500">
            Personnes pas encore qualifiées. Une fois qualifiées, « Convertir » crée le compte, le
            contact et, si besoin, l&apos;opportunité. {nbOuverts} en cours · {nbConvertis}{" "}
            convertis.
          </p>
        </div>
        <Link href="/prospects/nouveau" className={linkButtonClass}>
          + Nouveau prospect
        </Link>
      </div>

      <ListeOutils
        chemin={CHEMIN}
        params={params}
        placeholder="Nom, société, email…"
        nbResultats={lignes.length}
        vuesEnregistrees={vues}
        vuesPredefinies={[
          { nom: "À traiter", requete: "statut=aTraiter" },
          { nom: "Qualifiés à convertir", requete: "statut=Qualifié" },
          { nom: "Convertis", requete: "statut=Converti" },
        ]}
        filtres={[
          {
            nom: "statut",
            label: "Statut",
            options: [{ valeur: "aTraiter", label: "À traiter (nouveaux + contactés)" }, ...STATUTS_PROSPECT],
          },
          { nom: "source", label: "Source", options: SOURCES_PROSPECT },
          { nom: "fondateur", label: "Fondateur", options: fondateurs.map((f) => f.nom) },
        ]}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {th("nom", "Nom")}
              {th("societe", "Société")}
              <th className="px-3 py-2">Fonction</th>
              {th("statut", "Statut")}
              {th("source", "Source")}
              {th("fondateur", "Fondateur référent")}
              {th("creation", "Créé le", "desc")}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/prospects/${p.id}`} className={rowLinkClass}>
                    {p.nom} {p.prenom}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">{p.societe}</td>
                <td className="px-3 py-2 text-slate-600">{p.fonction ?? "–"}</td>
                <td className="px-3 py-2">
                  <Badge>{p.statut}</Badge>
                </td>
                <td className="px-3 py-2 text-slate-600">{p.source ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{p.fondateurReferent ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{formatDate(p.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  {p.convertiLe && p.compte ? (
                    <Link href={`/comptes/${p.compte.id}`} className="text-xs text-emerald-700 hover:underline">
                      → {p.compte.nom}
                    </Link>
                  ) : (
                    <Link
                      href={`/prospects/${p.id}/convertir`}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      Convertir
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                  {prospects.length === 0
                    ? "Aucun prospect pour l'instant."
                    : "Aucun prospect ne correspond à ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
