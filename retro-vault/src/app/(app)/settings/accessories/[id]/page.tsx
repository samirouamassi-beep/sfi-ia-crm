import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { AccessoryTypeForm } from "@/components/settings/accessory-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { deleteAccessoryType, saveAccessoryType } from "../actions";

export const metadata = { title: "Modifier le type d'accessoire" };

export default async function EditAccessoryTypePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const type = await prisma.accessoryType.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!type) notFound();
  const used = type._count.products;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={type.name} subtitle={`${used} fiche${used > 1 ? "s" : ""} d'accessoire de ce type`} />
      <Link href="/settings/accessories" className="text-sm text-accent">
        ← Accessoires
      </Link>
      <AccessoryTypeForm initial={type} action={saveAccessoryType.bind(null, type.id)} submitLabel="Enregistrer" />
      <form action={deleteAccessoryType.bind(null, type.id)}>
        <ConfirmButton
          message={`Supprimer « ${type.name} » ?${used ? ` ${used} accessoire(s) passeront en « type non précisé ».` : ""}`}
          variant="danger"
          className="w-full"
        >
          Supprimer
        </ConfirmButton>
      </form>
    </div>
  );
}
