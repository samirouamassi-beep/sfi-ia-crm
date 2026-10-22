import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete } from "@/components/ui";
import { RisqueForm } from "../../../formulaires";
import { creerRisque } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function NouveauRisque({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [projet, membres] = await Promise.all([
    prisma.projet.findUnique({ where: { id } }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!projet) notFound();
  return (
    <div className="space-y-5">
      <EnTete titre="Nouveau risque ou problème" sousTitre={projet.nom} />
      <Carte>
        <RisqueForm
          action={creerRisque.bind(null, id)}
          membres={membres}
          annuler={`/projets/${id}?onglet=risques`}
        />
      </Carte>
    </div>
  );
}
