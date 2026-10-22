import Link from "next/link";
import Form from "next/form";
import { prisma } from "@/lib/db";
import { ajouterJours, lundi, numeroSemaine } from "@/lib/calculs";
import { dateInput, Carte, EnTete, boutonPrincipal, boutonSecondaire, formatDate, formatJours } from "@/components/ui";
import { enregistrerFeuille } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Feuilles de temps" };

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven"];

function lireLundi(valeur?: string): Date {
  if (!valeur) return lundi(new Date());
  const [a, m, j] = valeur.split("-").map(Number);
  const d = new Date(a, (m ?? 1) - 1, j ?? 1);
  return Number.isNaN(d.getTime()) ? lundi(new Date()) : lundi(d);
}

export default async function TempsPage({
  searchParams,
}: {
  searchParams: Promise<{ membre?: string; semaine?: string; ajout?: string }>;
}) {
  const params = await searchParams;
  const debut = lireLundi(params.semaine);
  const fin = ajouterJours(debut, 7);
  const membres = await prisma.membre.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
    include: { _count: { select: { taches: { where: { jalon: false, debut: { lt: fin }, fin: { gte: debut } } } } } },
  });
  // Par défaut : le premier collaborateur qui a des tâches planifiées cette semaine.
  const membre =
    membres.find((m) => m.id === params.membre) ?? membres.find((m) => m._count.taches > 0) ?? membres[0];
  if (!membre) {
    return <EnTete titre="Feuilles de temps" sousTitre="Ajoutez d'abord des membres dans l'équipe." />;
  }
  const ajouts = (params.ajout ?? "").split(",").filter(Boolean);

  const [temps, taches, toutesTaches] = await Promise.all([
    prisma.temps.findMany({ where: { membreId: membre.id, date: { gte: debut, lt: fin } } }),
    // Lignes proposées : tâches du membre actives cette semaine, tâches déjà saisies, ajouts.
    prisma.tache.findMany({
      where: {
        jalon: false,
        OR: [
          { responsableId: membre.id, debut: { lt: fin }, fin: { gte: debut } },
          { temps: { some: { membreId: membre.id, date: { gte: debut, lt: fin } } } },
          { id: { in: ajouts } },
        ],
      },
      include: { projet: true },
      orderBy: [{ projet: { nom: "asc" } }, { ordre: "asc" }],
    }),
    prisma.tache.findMany({
      where: { jalon: false, statut: { not: "Terminée" }, projet: { statut: { in: ["Cadrage", "En cours"] } } },
      include: { projet: true },
      orderBy: [{ projet: { nom: "asc" } }, { ordre: "asc" }],
    }),
  ]);

  const valeur = (tacheId: string, i: number) => {
    const d = ajouterJours(debut, i).getTime();
    return temps
      .filter((t) => t.tacheId === tacheId && t.date.getTime() === d)
      .reduce((s, t) => s + t.jours, 0);
  };
  const totalJour = (i: number) => taches.reduce((s, t) => s + valeur(t.id, i), 0);
  const total = temps.reduce((s, t) => s + t.jours, 0);
  const semaineIso = dateInput(debut);
  const lien = (changements: Record<string, string>) =>
    `/temps?${new URLSearchParams({ membre: membre.id, semaine: semaineIso, ...changements })}`;
  const autresTaches = toutesTaches.filter((t) => !taches.some((x) => x.id === t.id));

  return (
    <div className="space-y-5">
      <EnTete
        titre="Feuilles de temps"
        sousTitre={`Semaine ${numeroSemaine(debut)} · du ${formatDate(debut)} au ${formatDate(ajouterJours(debut, 4))}`}
        actions={
          <>
            <Link href={lien({ semaine: dateInput(ajouterJours(debut, -7)) })} className={boutonSecondaire}>
              ← Semaine précédente
            </Link>
            <Link href={lien({ semaine: dateInput(lundi(new Date())) })} className={boutonSecondaire}>
              Cette semaine
            </Link>
            <Link href={lien({ semaine: dateInput(ajouterJours(debut, 7)) })} className={boutonSecondaire}>
              Semaine suivante →
            </Link>
          </>
        }
      />

      <Form action="/temps" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="semaine" value={semaineIso} />
        <label className="text-sm text-slate-600">
          Collaborateur
          <select
            name="membre"
            defaultValue={membre.id}
            className="ml-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            {membres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={boutonSecondaire}>
          Afficher
        </button>
      </Form>

      <Carte titre={`${membre.nom} · ${formatJours(total)} saisis / ${formatJours(membre.capaciteJours)} de capacité`}>
        <form action={enregistrerFeuille.bind(null, membre.id, debut.toISOString())}>
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Projet / tâche
                  </th>
                  {JOURS.map((j, i) => (
                    <th key={j} className="w-20 px-1 py-2 text-center text-xs font-semibold text-slate-500">
                      {j}
                      <div className="font-normal text-slate-400">{ajouterJours(debut, i).getDate()}</div>
                    </th>
                  ))}
                  <th className="w-20 px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taches.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-1.5">
                      <div className="text-xs text-slate-500">{t.projet.nom}</div>
                      <div className="font-medium">{t.nom}</div>
                    </td>
                    {JOURS.map((j, i) => {
                      const v = valeur(t.id, i);
                      return (
                        <td key={j} className="px-1 py-1.5">
                          <input
                            name={`t|${t.id}|${i}`}
                            type="number"
                            min="0"
                            max="1"
                            step="0.25"
                            defaultValue={v ? v : ""}
                            aria-label={`${t.nom} — ${j}`}
                            className="w-full rounded border border-slate-200 px-1.5 py-1 text-center text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-600">
                      {formatJours(JOURS.reduce((s, _, i) => s + valeur(t.id, i), 0))}
                    </td>
                  </tr>
                ))}
                {taches.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-sm text-slate-400">
                      Aucune tâche planifiée cette semaine. Ajoutez une ligne ci-dessous.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t border-slate-200 font-medium">
                <tr>
                  <td className="px-3 py-2 text-right text-xs uppercase text-slate-500">Total jour</td>
                  {JOURS.map((j, i) => {
                    const v = totalJour(i);
                    return (
                      <td key={j} className={`px-1 py-2 text-center tabular-nums ${v > 1 ? "text-red-600" : ""}`}>
                        {v ? formatJours(v) : "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right tabular-nums">{formatJours(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className={boutonPrincipal}>
              Enregistrer la semaine
            </button>
          </div>
        </form>
      </Carte>

      {autresTaches.length > 0 && (
        <Form action="/temps" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="membre" value={membre.id} />
          <input type="hidden" name="semaine" value={semaineIso} />
          <label className="text-sm text-slate-600">
            Ajouter une ligne
            <select name="ajout" className="ml-2 max-w-md rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
              {autresTaches.map((t) => (
                <option key={t.id} value={[...ajouts, t.id].join(",")}>
                  {t.projet.nom} — {t.nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={boutonSecondaire}>
            Ajouter
          </button>
        </Form>
      )}
    </div>
  );
}
