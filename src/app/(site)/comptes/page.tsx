import Link from "next/link";
import { prisma } from "@/lib/db";
import { getComptesAvecIndicateurs } from "@/lib/calculs";
import { CATEGORIES_COMPTE, PRIORITES, STATUTS_RELATION } from "@/lib/listes";
import { correspond, joursDepuis, lireParam, trier, type SearchParams } from "@/lib/vues";
import { formatEuros, formatDate, linkButtonClass, rowLinkClass, Badge } from "@/components/ui";
import { EnTeteTriable, ListeOutils } from "@/components/vues";

export const dynamic = "force-dynamic";

const CHEMIN = "/comptes";

export default async function ComptesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [comptes, fondateurs, vues] = await Promise.all([
    getComptesAvecIndicateurs(),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.vueListe.findMany({ where: { page: CHEMIN }, orderBy: { createdAt: "asc" } }),
  ]);

  const q = lireParam(params, "q");
  const categorie = lireParam(params, "categorie");
  const statutRelation = lireParam(params, "statutRelation");
  const priorite = lireParam(params, "priorite");
  const fondateur = lireParam(params, "fondateur");
  const inactif = Number(lireParam(params, "inactif")) || 0;

  const filtres = comptes.filter((c) => {
    if (!correspond(q, c.nom, c.secteur, c.contactPrincipal, c.notes)) return false;
    if (categorie && c.categorie !== categorie) return false;
    if (statutRelation && c.statutRelation !== statutRelation) return false;
    if (priorite && c.priorite !== priorite) return false;
    if (fondateur && c.fondateurReferent !== fondateur) return false;
    if (inactif) {
      const jours = joursDepuis(c.derniereInteraction);
      if (jours != null && jours < inactif) return false;
    }
    return true;
  });

  const lignes = trier(
    filtres,
    params,
    {
      nom: (c) => c.nom,
      categorie: (c) => c.categorie,
      statut: (c) => c.statutRelation,
      priorite: (c) => PRIORITES.indexOf(c.priorite as (typeof PRIORITES)[number]),
      fondateur: (c) => c.fondateurReferent,
      contacts: (c) => c.nbContacts,
      pipeline: (c) => c.pipelinePondere,
      ca: (c) => c.caSigne,
      interaction: (c) => c.derniereInteraction,
    },
    { tri: "nom", sens: "asc" }
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Comptes</h1>
          <p className="text-sm text-slate-500">
            Une ligne par organisation : clients, prospects, partenaires intégrateurs, éditeur
            Salesforce.
          </p>
        </div>
        <Link href="/comptes/nouveau" className={linkButtonClass}>
          + Nouveau compte
        </Link>
      </div>

      <ListeOutils
        chemin={CHEMIN}
        params={params}
        placeholder="Nom, secteur, contact principal…"
        nbResultats={lignes.length}
        vuesEnregistrees={vues}
        vuesPredefinies={[
          { nom: "Clients actifs", requete: "categorie=Client actif" },
          { nom: "Prospects prioritaires", requete: "categorie=Prospect&priorite=Haute" },
          { nom: "Sans interaction depuis 90 jours", requete: "inactif=90" },
        ]}
        filtres={[
          { nom: "categorie", label: "Catégorie", options: CATEGORIES_COMPTE },
          { nom: "statutRelation", label: "Statut", options: STATUTS_RELATION },
          { nom: "priorite", label: "Priorité", options: PRIORITES },
          { nom: "fondateur", label: "Fondateur", options: fondateurs.map((f) => f.nom) },
          {
            nom: "inactif",
            label: "Sans interaction",
            options: [
              { valeur: "30", label: "Sans interaction depuis 30 j" },
              { valeur: "60", label: "Sans interaction depuis 60 j" },
              { valeur: "90", label: "Sans interaction depuis 90 j" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {th("nom", "Nom")}
              {th("categorie", "Catégorie")}
              {th("statut", "Statut relation")}
              {th("priorite", "Priorité")}
              {th("fondateur", "Fondateur référent")}
              {th("contacts", "Contacts", true, "desc")}
              {th("pipeline", "Pipeline pondéré", true, "desc")}
              {th("ca", "CA signé", true, "desc")}
              {th("interaction", "Dernière interaction", false, "desc")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((c) => {
              const jours = joursDepuis(c.derniereInteraction);
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/comptes/${c.id}`} className={rowLinkClass}>
                      {c.nom}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{c.categorie}</td>
                  <td className="px-3 py-2 text-slate-600">{c.statutRelation}</td>
                  <td className="px-3 py-2 text-slate-600">{c.priorite}</td>
                  <td className="px-3 py-2 text-slate-600">{c.fondateurReferent ?? "–"}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{c.nbContacts}</td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatEuros(c.pipelinePondere)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">{formatEuros(c.caSigne)}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {c.derniereInteraction ? (
                      <Badge retard={jours != null && jours >= 90}>
                        {formatDate(c.derniereInteraction)}
                      </Badge>
                    ) : (
                      "–"
                    )}
                  </td>
                </tr>
              );
            })}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                  {comptes.length === 0
                    ? "Aucun compte pour l'instant."
                    : "Aucun compte ne correspond à ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
