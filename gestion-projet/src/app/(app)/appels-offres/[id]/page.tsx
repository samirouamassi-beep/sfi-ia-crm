import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Carte, EnTete, boutonDanger, boutonPrincipal, formatMontant } from "@/components/ui";
import { CAUTION_LIBEREE } from "@/lib/listes";
import { AjoutCaution, TableauCautions } from "../Cautions";
import { AppelOffreForm } from "../AppelOffreForm";
import { convertirEnProjet, modifierAppelOffre, supprimerAppelOffre } from "../actions";

export const dynamic = "force-dynamic";

export default async function ModifierAppelOffre({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ao, membres] = await Promise.all([
    prisma.appelOffre.findUnique({
      where: { id },
      include: { projet: true, cautions: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.membre.findMany({ where: { actif: true }, orderBy: { nom: "asc" } }),
  ]);
  if (!ao) notFound();
  const convertible = ["Déposé", "Gagné"].includes(ao.statut) && !ao.projet;

  return (
    <div className="space-y-5">
      <EnTete
        titre={ao.objet}
        sousTitre={`${ao.reference} · ${ao.maitreOuvrage}`}
        actions={
          ao.projet ? (
            <Link href={`/projets/${ao.projet.id}`} className={boutonPrincipal}>
              Voir le projet {ao.projet.code}
            </Link>
          ) : convertible ? (
            <form action={convertirEnProjet.bind(null, id)}>
              <button type="submit" className={boutonPrincipal}>
                Marché gagné → créer le projet
              </button>
            </form>
          ) : null
        }
      />
      <Carte>
        <AppelOffreForm action={modifierAppelOffre.bind(null, id)} valeurs={ao} membres={membres} />
      </Carte>
      <Carte
        titre={`Cautions · ${formatMontant(
          ao.cautions.filter((c) => c.statut !== CAUTION_LIBEREE).reduce((t, c) => t + c.montant, 0)
        )} immobilisés`}
      >
        <div className="space-y-4">
          <TableauCautions cautions={ao.cautions} />
          <div className="border-t border-slate-100 pt-4">
            <AjoutCaution appelOffreId={id} />
          </div>
        </div>
      </Carte>
      <form action={supprimerAppelOffre.bind(null, id)}>
        <button type="submit" className={boutonDanger}>
          Supprimer l&apos;appel d&apos;offres
        </button>
      </form>
    </div>
  );
}
