import { prisma } from "@/lib/db";
import { avancementPondere, tacheEnRetard } from "@/lib/calculs";
import { STATUTS_PROJET } from "@/lib/listes";
import { Carte, EnTete } from "@/components/ui";
import { Gantt, LegendeGantt, type LigneGantt } from "@/components/gantt";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = { title: "Planning" };

/** Planning du portefeuille : une barre par projet, avec ses jalons (ou ses phases). */
export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string; tous?: string }>;
}) {
  const { detail = "jalons", tous } = await searchParams;
  const projets = await prisma.projet.findMany({
    where: tous ? {} : { statut: { in: ["Cadrage", "En cours", "En pause"] } },
    include: {
      chef: true,
      phases: { orderBy: { ordre: "asc" } },
      taches: { orderBy: { ordre: "asc" } },
    },
    orderBy: { debut: "asc" },
  });

  const lignes: LigneGantt[] = [];
  for (const p of projets) {
    lignes.push({
      id: p.id,
      label: p.nom,
      sousLabel: `${p.code} · ${p.chef?.nom ?? "—"}`,
      debut: p.debut,
      fin: p.fin,
      avancement: avancementPondere(p.taches),
      groupe: true,
      href: `/projets/${p.id}?onglet=gantt`,
    });
    if (detail === "phases") {
      for (const ph of p.phases) {
        const taches = p.taches.filter((t) => t.phaseId === ph.id);
        if (taches.length === 0) continue;
        lignes.push({
          id: ph.id,
          label: ph.nom,
          debut: new Date(Math.min(...taches.map((t) => t.debut.getTime()))),
          fin: new Date(Math.max(...taches.map((t) => t.fin.getTime()))),
          avancement: avancementPondere(taches),
          retard: taches.some((t) => tacheEnRetard(t)),
        });
      }
    } else {
      for (const j of p.taches.filter((t) => t.jalon)) {
        lignes.push({
          id: j.id,
          label: j.nom,
          debut: j.fin,
          fin: j.fin,
          avancement: j.avancement,
          jalon: true,
          retard: tacheEnRetard(j),
          href: `/projets/${p.id}/taches/${j.id}`,
        });
      }
    }
  }

  const lien = (changements: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const d = "detail" in changements ? changements.detail : detail;
    const t = "tous" in changements ? changements.tous : tous;
    if (d && d !== "jalons") q.set("detail", d);
    if (t) q.set("tous", t);
    return `/planning?${q}`;
  };
  const puce = (href: string, actif: boolean, label: string) => (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        actif ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <EnTete titre="Planning du portefeuille" sousTitre={`${projets.length} projets · statuts : ${tous ? STATUTS_PROJET.join(", ") : "actifs"}`} />
      <div className="flex flex-wrap items-center gap-2">
        {puce(lien({ detail: "jalons" }), detail !== "phases", "Projets + jalons")}
        {puce(lien({ detail: "phases" }), detail === "phases", "Projets + phases")}
        <span className="mx-2 h-4 w-px bg-slate-300" />
        {puce(lien({ tous: undefined }), !tous, "Projets actifs")}
        {puce(lien({ tous: "1" }), !!tous, "Tous les projets")}
      </div>
      <Carte>
        <div className="space-y-3">
          <LegendeGantt />
          <Gantt lignes={lignes} />
        </div>
      </Carte>
    </div>
  );
}
