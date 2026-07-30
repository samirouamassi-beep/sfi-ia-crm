import { prisma } from "@/lib/db";
import { creerMission } from "../actions";
import { MissionForm } from "../MissionForm";

export default async function NouvelleMissionPage() {
  const [comptes, ressources, fondateurs] = await Promise.all([
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.ressource.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouvelle mission</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <MissionForm
          action={creerMission}
          comptes={comptes}
          ressources={ressources}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
