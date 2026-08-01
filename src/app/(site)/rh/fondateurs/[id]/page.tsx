import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ajouterDocumentFondateur } from "../../actions";
import { DocumentFolder } from "../../DocumentFolder";

export const dynamic = "force-dynamic";

export default async function DossierFondateurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fondateur = await prisma.fondateur.findUnique({
    where: { id },
    include: { documents: { orderBy: { createdAt: "desc" } } },
  });

  if (!fondateur) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{fondateur.nom}</h1>
        <Link href="/rh" className="text-sm text-slate-500 hover:underline">
          ← Retour RH
        </Link>
      </div>
      <DocumentFolder
        documents={fondateur.documents}
        uploadAction={ajouterDocumentFondateur.bind(null, id)}
        retourPath={`/rh/fondateurs/${id}`}
      />
    </div>
  );
}
