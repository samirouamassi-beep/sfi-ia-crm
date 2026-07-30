import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getEtapesPipeline, calculOpportunite } from "@/lib/calculs";
import { modifierOpportunite, supprimerOpportunite } from "../actions";
import { OpportuniteForm } from "../OpportuniteForm";
import { Section, Stat, formatEuros, formatPourcentage } from "@/components/ui";

export default async function ModifierOpportunitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [opportunite, comptes, fondateurs, etapes] = await Promise.all([
    prisma.opportunite.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    getEtapesPipeline(),
  ]);

  if (!opportunite) notFound();
  const calc = calculOpportunite(opportunite, etapes);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{opportunite.intitule}</h1>
        <form action={supprimerOpportunite.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>

      <Section title="Calculé depuis l'étape">
        <Stat label="Probabilité" value={formatPourcentage(calc.probabilite)} />
        <Stat label="Montant pondéré" value={formatEuros(calc.montantPondere)} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <OpportuniteForm
          action={modifierOpportunite.bind(null, id)}
          valeurs={opportunite}
          comptes={comptes}
          fondateurs={fondateurs}
          etapes={etapes}
        />
      </div>
    </div>
  );
}
