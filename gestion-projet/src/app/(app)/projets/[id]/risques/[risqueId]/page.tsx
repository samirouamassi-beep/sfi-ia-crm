import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete, boutonDanger } from "@/components/ui";
import { RisqueForm } from "../../../formulaires";
import { modifierRisque, supprimerRisque } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierRisque({
  params,
}: {
  params: Promise<{ id: string; risqueId: string }>;
}) {
  const { id, risqueId } = await params;
  const [risque, membres] = await Promise.all([
    prisma.risque.findUnique({ where: { id: risqueId }, include: { projet: true } }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!risque || risque.projetId !== id) notFound();
  return (
    <div className="space-y-5">
      <EnTete titre={risque.titre} sousTitre={risque.projet.nom} />
      <Carte>
        <RisqueForm
          action={modifierRisque.bind(null, id, risqueId)}
          valeurs={risque}
          membres={membres}
          annuler={`/projets/${id}?onglet=risques`}
        />
      </Carte>
      <form action={supprimerRisque.bind(null, id, risqueId)}>
        <button type="submit" className={boutonDanger}>
          Supprimer
        </button>
      </form>
    </div>
  );
}
