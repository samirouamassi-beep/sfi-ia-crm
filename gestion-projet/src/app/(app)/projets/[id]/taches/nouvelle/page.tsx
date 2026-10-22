import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete } from "@/components/ui";
import { TacheForm } from "../../../formulaires";
import { creerTache } from "../../../actions";
import { cheminValide } from "@/lib/retour";

export const dynamic = "force-dynamic";

export default async function NouvelleTache({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ retour?: string }>;
}) {
  const { id } = await params;
  const { retour } = await searchParams;
  const [projet, membres] = await Promise.all([
    prisma.projet.findUnique({
      where: { id },
      include: {
        phases: { orderBy: { ordre: "asc" } },
        taches: { include: { phase: true }, orderBy: { ordre: "asc" } },
      },
    }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!projet) notFound();
  const debut = projet.debut > new Date() ? projet.debut : new Date();
  return (
    <div className="space-y-5">
      <EnTete titre="Nouvelle tâche" sousTitre={projet.nom} />
      <Carte>
        <TacheForm
          action={creerTache.bind(null, id)}
          membres={membres}
          phases={projet.phases}
          autresTaches={projet.taches.map((t) => ({ id: t.id, nom: t.nom, phase: t.phase?.nom ?? null, jalon: t.jalon }))}
          valeurs={{ debut, fin: debut, phaseId: projet.phases[0]?.id }}
          annuler={cheminValide(retour) ? retour : `/projets/${id}?onglet=taches`}
          retour={cheminValide(retour) ? retour : undefined}
        />
      </Carte>
    </div>
  );
}
