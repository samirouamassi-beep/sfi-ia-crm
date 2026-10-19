import Link from "next/link";
import { prisma } from "@/lib/db";
import { getContactsAvecIndicateurs } from "@/lib/calculs";
import { PRIORITES } from "@/lib/listes";
import { correspond, lireParam, trier, type SearchParams } from "@/lib/vues";
import { formatDate, linkButtonClass, Badge, rowLinkClass } from "@/components/ui";
import { EnTeteTriable, ListeOutils } from "@/components/vues";

export const dynamic = "force-dynamic";

const CHEMIN = "/contacts";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [contacts, comptes, fondateurs, vues] = await Promise.all([
    getContactsAvecIndicateurs(),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.vueListe.findMany({ where: { page: CHEMIN }, orderBy: { createdAt: "asc" } }),
  ]);

  const q = lireParam(params, "q");
  const compteId = lireParam(params, "compte");
  const fondateur = lireParam(params, "fondateur");
  const priorite = lireParam(params, "priorite");
  const relance = lireParam(params, "relance");

  const filtres = contacts.filter((c) => {
    if (!correspond(q, `${c.nom} ${c.prenom}`, `${c.prenom} ${c.nom}`, c.email, c.fonction, c.compte?.nom))
      return false;
    if (compteId && c.compteId !== compteId) return false;
    if (fondateur && c.fondateurReferent !== fondateur) return false;
    if (priorite && c.priorite !== priorite) return false;
    if (relance === "retard" && !c.relanceEnRetard) return false;
    if (relance === "prevue" && !c.relancePrevueLe) return false;
    return true;
  });

  const lignes = trier(
    filtres,
    params,
    {
      nom: (c) => `${c.nom} ${c.prenom}`,
      compte: (c) => c.compte?.nom,
      fonction: (c) => c.fonction,
      email: (c) => c.email,
      fondateur: (c) => c.fondateurReferent,
      dernier: (c) => c.dernierContact,
      relance: (c) => c.relancePrevueLe,
    },
    { tri: "nom", sens: "asc" }
  );

  const th = (colonne: string, label: string, sens: "asc" | "desc" = "asc") => (
    <EnTeteTriable chemin={CHEMIN} params={params} colonne={colonne} sensParDefaut={sens}>
      {label}
    </EnTeteTriable>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500">
            Une ligne par personne. Rattachée à un compte via « Compte rattaché ».
          </p>
        </div>
        <Link href="/contacts/nouveau" className={linkButtonClass}>
          + Nouveau contact
        </Link>
      </div>

      <ListeOutils
        chemin={CHEMIN}
        params={params}
        placeholder="Nom, email, fonction, compte…"
        nbResultats={lignes.length}
        vuesEnregistrees={vues}
        vuesPredefinies={[
          { nom: "Relances en retard", requete: "relance=retard" },
          { nom: "Priorité haute", requete: "priorite=Haute" },
        ]}
        filtres={[
          {
            nom: "compte",
            label: "Compte",
            options: comptes.map((c) => ({ valeur: c.id, label: c.nom })),
          },
          { nom: "fondateur", label: "Fondateur", options: fondateurs.map((f) => f.nom) },
          { nom: "priorite", label: "Priorité", options: PRIORITES },
          {
            nom: "relance",
            label: "Relance",
            options: [
              { valeur: "retard", label: "Relance en retard" },
              { valeur: "prevue", label: "Relance prévue" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {th("nom", "Nom")}
              {th("compte", "Compte rattaché")}
              {th("fonction", "Fonction")}
              {th("email", "Email")}
              {th("fondateur", "Fondateur référent")}
              {th("dernier", "Dernier contact", "desc")}
              {th("relance", "Relance prévue")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lignes.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  <Link href={`/contacts/${c.id}`} className={rowLinkClass}>
                    {c.nom} {c.prenom}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {c.compte ? (
                    <Link href={`/comptes/${c.compte.id}`} className="hover:underline">
                      {c.compte.nom}
                    </Link>
                  ) : (
                    "–"
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">{c.fonction ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{c.email ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{c.fondateurReferent ?? "–"}</td>
                <td className="px-3 py-2 text-slate-600">{formatDate(c.dernierContact)}</td>
                <td className="px-3 py-2">
                  {c.relancePrevueLe ? (
                    <Badge retard={c.relanceEnRetard}>{formatDate(c.relancePrevueLe)}</Badge>
                  ) : (
                    "–"
                  )}
                </td>
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  {contacts.length === 0
                    ? "Aucun contact pour l'instant."
                    : "Aucun contact ne correspond à ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
