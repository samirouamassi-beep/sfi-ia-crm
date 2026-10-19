import Link from "next/link";
import { prisma } from "@/lib/db";
import { getAgenda, LIBELLES_ECHEANCE, type Echeance } from "@/lib/agenda";
import { construireRequete, lireParam, type SearchParams } from "@/lib/vues";
import { Section, formatDate, linkButtonClass } from "@/components/ui";
import { CaseTache, ListeAgenda } from "@/components/agenda";

export const dynamic = "force-dynamic";

const GROUPES: Echeance[] = ["retard", "aujourdhui", "semaine", "plusTard", "sansDate"];

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const fondateur = lireParam(params, "fondateur");
  const seulementTaches = lireParam(params, "type") === "taches";

  const [agenda, fondateurs, terminees] = await Promise.all([
    getAgenda({ fondateur: fondateur || undefined }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    prisma.tache.findMany({
      where: { statut: "Terminée", ...(fondateur ? { fondateur } : {}) },
      include: { compte: true },
      orderBy: { termineeLe: "desc" },
      take: 15,
    }),
  ]);
  const elements = seulementTaches ? agenda.filter((e) => e.tacheId) : agenda;

  const puce = (href: string, actif: boolean, label: string) => (
    <Link
      key={label}
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        actif
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );
  const lien = (changements: Record<string, string>) =>
    `/taches?${construireRequete(params, changements)}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tâches et relances</h1>
          <p className="text-sm text-slate-500">
            Vos tâches, plus les relances déjà prévues sur les contacts, opportunités et
            interactions.
          </p>
        </div>
        <Link href="/taches/nouveau" className={linkButtonClass}>
          + Nouvelle tâche
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Pour</span>
        {puce(lien({ fondateur: "" }), !fondateur, "Toute l'équipe")}
        {fondateurs.map((f) => puce(lien({ fondateur: f.nom }), fondateur === f.nom, f.nom))}
        <span className="ml-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Afficher
        </span>
        {puce(lien({ type: "" }), !seulementTaches, "Tâches + relances")}
        {puce(lien({ type: "taches" }), seulementTaches, "Tâches seulement")}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {GROUPES.map((g) => {
            const groupe = elements.filter((e) => e.echeance === g);
            if (groupe.length === 0 && g !== "retard" && g !== "aujourdhui") return null;
            return (
              <Section key={g} title={`${LIBELLES_ECHEANCE[g]} (${groupe.length})`}>
                <ListeAgenda
                  elements={groupe}
                  vide={g === "retard" ? "Aucun retard, bravo." : "Rien de prévu aujourd'hui."}
                />
              </Section>
            );
          })}
        </div>

        <Section title="Terminées récemment">
          <ul className="divide-y divide-slate-100">
            {terminees.map((t) => (
              <li key={t.id} className="flex items-start gap-3 py-2">
                <CaseTache id={t.id} terminee />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/taches/${t.id}`}
                    className="text-sm text-slate-500 line-through hover:underline"
                  >
                    {t.sujet}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {[t.compte?.nom, t.fondateur, formatDate(t.termineeLe)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </li>
            ))}
            {terminees.length === 0 && (
              <li className="py-3 text-center text-sm text-slate-400">
                Aucune tâche terminée pour l&apos;instant.
              </li>
            )}
          </ul>
        </Section>
      </div>
    </div>
  );
}
