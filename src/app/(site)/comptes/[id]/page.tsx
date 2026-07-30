import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierCompte, supprimerCompte } from "../actions";
import { CompteForm } from "../CompteForm";
import { Section, Stat, formatEuros, formatDate } from "@/components/ui";
import { getComptesAvecIndicateurs } from "@/lib/calculs";

export default async function ModifierComptePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [compte, fondateurs, comptesAvecIndicateurs] = await Promise.all([
    prisma.compte.findUnique({ where: { id } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
    getComptesAvecIndicateurs(),
  ]);

  if (!compte) notFound();
  const indicateurs = comptesAvecIndicateurs.find((c) => c.id === id)!;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{compte.nom}</h1>
        <form action={supprimerCompte.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>

      <Section title="Indicateurs (calculés)">
        <Stat label="Contacts rattachés" value={indicateurs.nbContacts} />
        <Stat label="Pipeline pondéré" value={formatEuros(indicateurs.pipelinePondere)} />
        <Stat label="CA signé" value={formatEuros(indicateurs.caSigne)} />
        <Stat label="Dernière interaction" value={formatDate(indicateurs.derniereInteraction)} />
      </Section>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <CompteForm
          action={modifierCompte.bind(null, id)}
          valeurs={compte}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
