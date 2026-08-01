import Link from "next/link";
import { prisma } from "@/lib/db";
import { Section, rowLinkClass } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RHPage() {
  const [fondateurs, ressources] = await Promise.all([
    prisma.fondateur.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: { nom: "asc" },
    }),
    prisma.ressource.findMany({
      include: { _count: { select: { documents: true } } },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">RH</h1>
        <p className="text-sm text-slate-500">
          Un dossier de documents par personne : fondateurs, salariés et freelances.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Fondateurs">
          <ul className="divide-y divide-slate-100">
            {fondateurs.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <Link href={`/rh/fondateurs/${f.id}`} className={rowLinkClass}>
                  {f.nom}
                </Link>
                <span className="text-sm text-slate-500">
                  {f._count.documents} document{f._count.documents > 1 ? "s" : ""}
                </span>
              </li>
            ))}
            {fondateurs.length === 0 && (
              <li className="py-6 text-center text-slate-400">Aucun fondateur pour l&apos;instant.</li>
            )}
          </ul>
        </Section>

        <Section title="Salariés & freelances">
          <ul className="divide-y divide-slate-100">
            {ressources.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <Link href={`/rh/ressources/${r.id}`} className={rowLinkClass}>
                  {r.nom} {r.prenom}
                </Link>
                <span className="text-sm text-slate-500">
                  {r._count.documents} document{r._count.documents > 1 ? "s" : ""}
                </span>
              </li>
            ))}
            {ressources.length === 0 && (
              <li className="py-6 text-center text-slate-400">Aucune ressource pour l&apos;instant.</li>
            )}
          </ul>
        </Section>
      </div>
    </div>
  );
}
