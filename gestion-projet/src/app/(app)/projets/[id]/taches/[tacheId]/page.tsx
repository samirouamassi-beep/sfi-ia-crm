import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete, boutonDanger, formatDate, formatJours } from "@/components/ui";
import { TacheForm } from "../../../formulaires";
import { modifierTache, supprimerTache } from "../../../actions";
import { cheminValide } from "@/lib/retour";

export const dynamic = "force-dynamic";

export default async function ModifierTache({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tacheId: string }>;
  searchParams: Promise<{ retour?: string }>;
}) {
  const { id, tacheId } = await params;
  const { retour } = await searchParams;
  const retourValide = cheminValide(retour) ? retour : undefined;
  const [tache, membres] = await Promise.all([
    prisma.tache.findUnique({
      where: { id: tacheId },
      include: {
        projet: { include: { phases: { orderBy: { ordre: "asc" } } } },
        temps: { include: { membre: true }, orderBy: { date: "desc" } },
      },
    }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!tache || tache.projetId !== id) notFound();
  const totalTemps = tache.temps.reduce((s, t) => s + t.jours, 0);

  return (
    <div className="space-y-5">
      <EnTete titre={tache.nom} sousTitre={tache.projet.nom} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Carte className="lg:col-span-2">
          <TacheForm
            action={modifierTache.bind(null, id, tacheId)}
            valeurs={tache}
            membres={membres}
            phases={tache.projet.phases}
            annuler={retourValide ?? `/projets/${id}?onglet=taches`}
            retour={retourValide}
          />
        </Carte>
        <Carte titre={`Temps passés · ${formatJours(totalTemps)} / ${formatJours(tache.chargeJours)} prévus`}>
          {tache.temps.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun temps saisi sur cette tâche.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {tache.temps.map((t) => (
                <li key={t.id} className="flex justify-between py-1.5">
                  <span>
                    {t.membre.nom}
                    <span className="ml-2 text-xs text-slate-500">sem. du {formatDate(t.date)}</span>
                  </span>
                  <span className="tabular-nums">{formatJours(t.jours)}</span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>
      <form action={supprimerTache.bind(null, id, tacheId)}>
        <button type="submit" className={boutonDanger}>
          Supprimer la tâche
        </button>
      </form>
    </div>
  );
}
