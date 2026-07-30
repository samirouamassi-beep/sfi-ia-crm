import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getRessourcesAvecIndicateurs } from "@/lib/calculs";
import { modifierRessource, supprimerRessource } from "../actions";
import { RessourceForm } from "../RessourceForm";
import { Section, Stat, formatEuros, formatPourcentage } from "@/components/ui";

export default async function ModifierRessourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ressource, ressourcesAvecIndicateurs] = await Promise.all([
    prisma.ressource.findUnique({ where: { id } }),
    getRessourcesAvecIndicateurs(),
  ]);

  if (!ressource) notFound();
  const indicateurs = ressourcesAvecIndicateurs.find((r) => r.id === id)!;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {ressource.nom} {ressource.prenom}
        </h1>
        <form action={supprimerRessource.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>

      <Section title="Calculé automatiquement">
        <Stat label="Coût par jour facturé" value={formatEuros(indicateurs.coutParJour)} />
        <Stat label="Marge par jour" value={formatEuros(indicateurs.margeParJour)} />
        <Stat label="Taux de marge" value={formatPourcentage(indicateurs.tauxMarge)} />
        <Stat label="Nb de certifications" value={indicateurs.nbCertifications} />
        <Stat label="Mission en cours" value={indicateurs.missionEnCours ?? "–"} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <RessourceForm action={modifierRessource.bind(null, id)} valeurs={ressource} />
      </div>
    </div>
  );
}
