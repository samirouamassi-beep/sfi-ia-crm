import { prisma } from "@/lib/db";
import { ajouterJours } from "@/lib/calculs";
import { Carte, EnTete } from "@/components/ui";
import { AppelOffreForm } from "../AppelOffreForm";
import { creerAppelOffre } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nouvel appel d'offres" };

export default async function NouvelAppelOffre() {
  const membres = await prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } });
  return (
    <div className="space-y-5">
      <EnTete titre="Nouvel appel d'offres" />
      <Carte>
        <AppelOffreForm
          action={creerAppelOffre}
          membres={membres}
          valeurs={{ dateLimite: ajouterJours(new Date(), 21), statut: "Veille" }}
        />
      </Carte>
    </div>
  );
}
