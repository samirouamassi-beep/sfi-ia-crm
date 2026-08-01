import { prisma } from "@/lib/db";
import { creerContact } from "../actions";
import { ContactForm } from "../ContactForm";

export const dynamic = "force-dynamic";

export default async function NouveauContactPage() {
  const [comptes, fondateurs] = await Promise.all([
    prisma.compte.findMany({ orderBy: { nom: "asc" } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Nouveau contact</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ContactForm action={creerContact} comptes={comptes} fondateurs={fondateurs} />
      </div>
    </div>
  );
}
