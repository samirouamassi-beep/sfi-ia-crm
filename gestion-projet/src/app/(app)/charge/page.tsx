import Link from "next/link";
import { prisma } from "@/lib/db";
import { ajouterJours, chargeSemaine, lundi, numeroSemaine, tacheTerminee } from "@/lib/calculs";
import { Carte, EnTete, boutonSecondaire, formatDateCourte, formatJours } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plan de charge" };

const NB_SEMAINES = 12;

function couleur(taux: number): string {
  if (taux === 0) return "bg-white text-slate-300";
  if (taux > 1.05) return "bg-red-500 text-white";
  if (taux > 0.85) return "bg-amber-300 text-amber-950";
  if (taux > 0.5) return "bg-emerald-300 text-emerald-950";
  return "bg-emerald-100 text-emerald-900";
}

/**
 * Plan de charge : pour chaque membre et chaque semaine, la charge planifiée des tâches
 * non terminées (répartie uniformément sur leurs jours ouvrés) rapportée à sa capacité.
 */
export default async function ChargePage({
  searchParams,
}: {
  searchParams: Promise<{ decalage?: string }>;
}) {
  const decalage = Number((await searchParams).decalage ?? 0) || 0;
  const premiere = ajouterJours(lundi(new Date()), decalage * 7);
  const semaines = Array.from({ length: NB_SEMAINES }, (_, i) => ajouterJours(premiere, i * 7));
  const finPeriode = ajouterJours(semaines[NB_SEMAINES - 1], 6);

  const membres = await prisma.membre.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: {
      taches: {
        where: {
          jalon: false,
          debut: { lte: finPeriode },
          fin: { gte: premiere },
          projet: { statut: { in: ["Cadrage", "En cours", "En pause"] } },
        },
        include: { projet: true },
      },
    },
  });

  const lignes = membres.map((m) => {
    const cellules = semaines.map((s) => {
      const detail = new Map<string, number>();
      let total = 0;
      for (const t of m.taches) {
        if (tacheTerminee(t)) continue;
        const c = chargeSemaine(t, s);
        if (c <= 0) continue;
        total += c;
        detail.set(t.projet.nom, (detail.get(t.projet.nom) ?? 0) + c);
      }
      return { total, taux: m.capaciteJours > 0 ? total / m.capaciteJours : 0, detail };
    });
    return { membre: m, cellules };
  });
  const surcharges = lignes.reduce((n, l) => n + l.cellules.filter((c) => c.taux > 1.05).length, 0);

  return (
    <div className="space-y-5">
      <EnTete
        titre="Plan de charge"
        sousTitre={`Charge planifiée / capacité hebdomadaire · ${surcharges} cellule(s) en surcharge`}
        actions={
          <>
            <Link href={`/charge?decalage=${decalage - 4}`} className={boutonSecondaire}>
              ← 4 semaines
            </Link>
            {decalage !== 0 && (
              <Link href="/charge" className={boutonSecondaire}>
                Aujourd&apos;hui
              </Link>
            )}
            <Link href={`/charge?decalage=${decalage + 4}`} className={boutonSecondaire}>
              4 semaines →
            </Link>
          </>
        }
      />
      <Carte>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Membre
                </th>
                {semaines.map((s) => (
                  <th key={s.getTime()} className="min-w-14 px-1 text-center text-[11px] font-medium text-slate-500">
                    S{numeroSemaine(s)}
                    <div className="font-normal text-slate-400">{formatDateCourte(s)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map(({ membre, cellules }) => (
                <tr key={membre.id}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1">
                    <Link href={`/mes-taches?membre=${membre.id}`} className="font-medium hover:text-indigo-700">
                      {membre.nom}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {membre.role} · {formatJours(membre.capaciteJours)}/sem.
                    </div>
                  </td>
                  {cellules.map((c, i) => (
                    <td
                      key={i}
                      className={`rounded text-center text-xs font-medium tabular-nums ${couleur(c.taux)}`}
                      title={
                        c.detail.size
                          ? [...c.detail].map(([p, j]) => `${p} : ${formatJours(j)}`).join("\n")
                          : "Disponible"
                      }
                    >
                      {c.total > 0 ? `${Math.round(c.taux * 100)}%` : "·"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-emerald-100" /> &lt; 50 %</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-emerald-300" /> 50–85 %</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-amber-300" /> 85–105 %</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-red-500" /> Surcharge</span>
          <span>Survolez une cellule pour voir la répartition par projet.</span>
        </div>
      </Carte>
    </div>
  );
}
