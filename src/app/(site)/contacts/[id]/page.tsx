import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierContact, supprimerContact } from "../actions";
import { ContactForm } from "../ContactForm";

export default async function ModifierContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [contact, comptes, fondateurs] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!contact) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {contact.nom} {contact.prenom}
        </h1>
        <form action={supprimerContact.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ContactForm
          action={modifierContact.bind(null, id)}
          valeurs={contact}
          comptes={comptes}
          fondateurs={fondateurs}
        />
      </div>
    </div>
  );
}
