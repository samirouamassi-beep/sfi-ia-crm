import { prisma } from "@/lib/db";
import { Carte, EnTete } from "@/components/ui";
import { ProjetForm } from "../formulaires";
import { creerProjet } from "../actions";
import { ajouterJours } from "@/lib/calculs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouveau projet" };

export default async function NouveauProjet() {
  const [membres, nb] = await Promise.all([
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
    prisma.projet.count(),
  ]);
  const debut = new Date();
  return (
    <div className="space-y-5">
      <EnTete titre="Nouveau projet" sousTitre="Trois phases de départ sont créées automatiquement." />
      <Carte>
        <ProjetForm
          action={creerProjet}
          membres={membres}
          annuler="/projets"
          valeurs={{
            code: `PRJ-${String(nb + 1).padStart(3, "0")}`,
            debut,
            fin: ajouterJours(debut, 90),
            statut: "Cadrage",
            meteo: "Vert",
          }}
        />
      </Carte>
    </div>
  );
}
