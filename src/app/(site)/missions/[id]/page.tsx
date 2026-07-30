import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculMission } from "@/lib/calculs";
import { modifierMission, supprimerMission } from "../actions";
import { MissionForm } from "../MissionForm";
import { Section, Stat, formatEuros, formatPourcentage } from "@/components/ui";

export default async function ModifierMissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [mission, comptes, ressources, fondateurs] = await Promise.all([
    prisma.mission.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.ressource.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!mission) notFound();
  const calc = calculMission(mission);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{mission.mission}</h1>
        <form action={supprimerMission.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>

      <Section title="Calculé automatiquement">
        <Stat label="CA mensuel" value={formatEuros(calc.caMensuel)} />
        <Stat label="Coût mensuel" value={formatEuros(calc.coutMensuel)} />
        <Stat label="Marge mensuelle" value={formatEuros(calc.margeMensuelle)} />
        <Stat label="Taux de marge" value={formatPourcentage(calc.tauxMarge)} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <MissionForm
          action={modifierMission.bind(null, id)}
          valeurs={mission}
          comptes={comptes}
          ressources={ressources}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
