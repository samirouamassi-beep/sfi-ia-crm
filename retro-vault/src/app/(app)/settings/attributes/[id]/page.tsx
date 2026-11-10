import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { AttributeForm } from "@/components/settings/attribute-form";
import { PageHeader } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteAttribute, saveAttribute } from "../actions";

export const metadata = { title: "Modifier la caractéristique" };

export default async function EditAttributePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const attribute = await prisma.itemAttribute.findFirst({
    where: { id, userId },
    include: { _count: { select: { values: true } } },
  });
  if (!attribute) notFound();
  const usage = attribute._count.values;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={attribute.label} subtitle={`Renseignée sur ${usage} exemplaire${usage > 1 ? "s" : ""}`} />
      <Link href="/settings/attributes" className="text-sm text-accent">
        ← Caractéristiques
      </Link>
      <AttributeForm initial={attribute} usage={usage} action={saveAttribute.bind(null, attribute.id)} submitLabel="Enregistrer" />
      <form action={deleteAttribute.bind(null, attribute.id)}>
        <ConfirmButton
          message={`Supprimer « ${attribute.label} »${usage ? ` et les valeurs saisies sur ${usage} exemplaire(s)` : ""} ?`}
          variant="danger"
          className="w-full"
        >
          Supprimer
        </ConfirmButton>
      </form>
    </div>
  );
}
