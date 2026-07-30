import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierInteraction, supprimerInteraction } from "../actions";
import { InteractionForm } from "../InteractionForm";

export default async function ModifierInteractionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [interaction, comptes, contacts, fondateurs] = await Promise.all([
    prisma.interaction.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.contact.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!interaction) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Interaction du {" "}
          {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(interaction.date)}
        </h1>
        <form action={supprimerInteraction.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <InteractionForm
          action={modifierInteraction.bind(null, id)}
          valeurs={interaction}
          comptes={comptes}
          contacts={contacts}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
