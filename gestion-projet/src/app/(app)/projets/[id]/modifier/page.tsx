import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete, boutonDanger } from "@/components/ui";
import { ProjetForm } from "../../formulaires";
import { modifierProjet, supprimerProjet } from "../../actions";

export const dynamic = "force-dynamic";

export default async function ModifierProjet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projet, membres] = await Promise.all([
    prisma.projet.findUnique({ where: { id } }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!projet) notFound();
  return (
    <div className="space-y-5">
      <EnTete titre={`Modifier — ${projet.nom}`} />
      <Carte>
        <ProjetForm
          action={modifierProjet.bind(null, id)}
          valeurs={projet}
          membres={membres}
          annuler={`/projets/${id}`}
        />
      </Carte>
      <form action={supprimerProjet.bind(null, id)}>
        <button type="submit" className={boutonDanger}>
          Supprimer le projet (et toutes ses tâches, temps, dépenses et risques)
        </button>
      </form>
    </div>
  );
}
