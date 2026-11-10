import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { PlatformForm } from "@/components/settings/platform-form";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/db";
import { deletePlatform, savePlatform } from "../actions";

export const metadata = { title: "Modifier la console" };

export default async function EditPlatformPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [platform, manufacturers] = await Promise.all([
    prisma.platform.findUnique({ where: { id }, include: { _count: { select: { products: true } } } }),
    prisma.platform.findMany({ distinct: ["manufacturer"], select: { manufacturer: true }, orderBy: { manufacturer: "asc" } }),
  ]);
  if (!platform) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={platform.name} subtitle={`${platform._count.products} fiche(s) produit sur cette console`} />
      <Link href="/settings/platforms" className="text-sm text-accent">
        ← Consoles
      </Link>
      <PlatformForm
        initial={platform}
        manufacturers={manufacturers.map((m) => m.manufacturer)}
        action={savePlatform.bind(null, platform.id)}
        submitLabel="Enregistrer"
      />
      {platform._count.products === 0 ? (
        <form action={deletePlatform.bind(null, platform.id)}>
          <ConfirmButton message={`Supprimer ${platform.name} ?`} variant="danger" className="w-full">
            Supprimer la console
          </ConfirmButton>
        </form>
      ) : (
        <p className="text-xs text-ink-3">
          Cette console est utilisée : elle ne peut pas être supprimée, mais vous pouvez la masquer des formulaires.
        </p>
      )}
    </div>
  );
}
