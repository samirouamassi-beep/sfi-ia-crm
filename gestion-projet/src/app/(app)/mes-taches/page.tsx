import Link from "next/link";
import { prisma } from "@/lib/db";
import { ajouterJours, debutJour, tacheEnRetard } from "@/lib/calculs";
import {
  Badge,
  BadgeRetard,
  Carte,
  EnTete,
  Progression,
  Vide,
  formatDate,
  lienClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tâches" };

type Groupe = "retard" | "semaine" | "prochaines" | "plusTard";
const LIBELLES: Record<Groupe, string> = {
  retard: "En retard",
  semaine: "À terminer dans les 7 jours",
  prochaines: "Dans les 30 jours",
  plusTard: "Plus tard",
};

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ membre?: string }>;
}) {
  const { membre = "" } = await searchParams;
  const [membres, taches] = await Promise.all([
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
    prisma.tache.findMany({
      where: {
        statut: { not: "Terminée" },
        jalon: false,
        projet: { statut: { in: ["Cadrage", "En cours", "En pause"] } },
        ...(membre ? { responsableId: membre } : {}),
      },
      include: { projet: true, responsable: true },
      orderBy: { fin: "asc" },
    }),
  ]);
  const auj = debutJour(new Date());
  const groupe = (fin: Date, retard: boolean): Groupe =>
    retard ? "retard" : fin <= ajouterJours(auj, 7) ? "semaine" : fin <= ajouterJours(auj, 30) ? "prochaines" : "plusTard";
  const classees = taches.map((t) => {
    const retard = tacheEnRetard(t, auj);
    return { ...t, retard, groupe: groupe(t.fin, retard) };
  });

  const puce = (id: string, label: string) => (
    <Link
      key={id || "tous"}
      href={id ? `/mes-taches?membre=${id}` : "/mes-taches"}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        membre === id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-5">
      <EnTete titre="Tâches ouvertes" sousTitre="Toutes les tâches non terminées des projets actifs, par échéance." />
      <div className="flex flex-wrap gap-2">
        {puce("", "Toute l'équipe")}
        {membres.map((m) => puce(m.id, m.nom))}
      </div>
      {(Object.keys(LIBELLES) as Groupe[]).map((g) => {
        const liste = classees.filter((t) => t.groupe === g);
        if (liste.length === 0 && g !== "retard") return null;
        return (
          <Carte key={g} titre={`${LIBELLES[g]} (${liste.length})`}>
            {liste.length === 0 ? (
              <Vide>Aucune tâche en retard.</Vide>
            ) : (
              <div className="-mx-4 overflow-x-auto">
                <table className={tableClass}>
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className={thClass}>Tâche</th>
                      <th className={thClass}>Projet</th>
                      <th className={thClass}>Responsable</th>
                      <th className={thClass}>Échéance</th>
                      <th className={`${thClass} w-40`}>Avancement</th>
                      <th className={thClass}>Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liste.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className={tdClass}>
                          <Link href={`/projets/${t.projetId}/taches/${t.id}?retour=/mes-taches`} className={lienClass}>
                            {t.nom}
                          </Link>
                        </td>
                        <td className={tdClass}>
                          <Link href={`/projets/${t.projetId}`} className="text-slate-600 hover:underline">
                            {t.projet.nom}
                          </Link>
                        </td>
                        <td className={tdClass}>{t.responsable?.nom ?? "—"}</td>
                        <td className={`${tdClass} whitespace-nowrap ${t.retard ? "font-medium text-red-600" : ""}`}>
                          {formatDate(t.fin)}
                        </td>
                        <td className={tdClass}>
                          <Progression valeur={t.avancement} />
                        </td>
                        <td className={tdClass}>
                          <div className="flex gap-1">
                            <Badge>{t.statut}</Badge>
                            {t.retard && <BadgeRetard />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        );
      })}
    </div>
  );
}
