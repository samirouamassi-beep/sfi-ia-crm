import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { modifierCompte, supprimerCompte } from "../../actions";
import { CompteForm } from "../../CompteForm";

export default async function ModifierComptePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [compte, fondateurs] = await Promise.all([
    prisma.compte.findUnique({ where: { id } }),
    prisma.fondateur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!compte) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <Link href={`/comptes/${id}`} className="text-sm text-slate-500 hover:text-slate-900">
        ← Retour à la fiche
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Modifier {compte.nom}</h1>
        <form action={supprimerCompte.bind(null, id)}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Supprimer
          </button>
        </form>
      </div>

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
