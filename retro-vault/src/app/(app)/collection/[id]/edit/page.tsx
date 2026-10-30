import { notFound } from "next/navigation";
import { ItemForm, type ItemFormInitial } from "@/components/item-form";
import { PageHeader } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToEurosInput } from "@/lib/money";
import { listPlatforms } from "@/lib/platforms";
import { updateItem } from "../../actions";

export const metadata = { title: "Modifier l'exemplaire" };

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [item, platforms] = await Promise.all([
    prisma.collectionItem.findFirst({ where: { id, userId }, include: { product: true } }),
    listPlatforms(),
  ]);
  if (!item) notFound();

  const p = item.product;
  const initial: ItemFormInitial = {
    kind: p.kind,
    platformId: p.platformId,
    game: {
      igdbId: p.igdbId ?? 0,
      title: p.title,
      coverUrl: p.coverUrl,
      releaseYear: p.releaseYear,
      developer: p.developer,
      publisher: p.publisher,
      genres: p.genres,
      summary: p.summary,
    },
    title: p.title,
    region: item.region,
    completeness: item.completeness,
    boxGrade: item.boxGrade,
    manualGrade: item.manualGrade,
    mediaGrade: item.mediaGrade,
    boxScore: item.boxScore,
    manualScore: item.manualScore,
    mediaScore: item.mediaScore,
    acquiredAt: item.acquiredAt?.toISOString().slice(0, 10) ?? "",
    purchase: centsToEurosInput(item.purchaseCents),
    manualValue: centsToEurosInput(item.manualValueCents),
    notes: item.notes ?? "",
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Modifier" subtitle={p.title} />
      <ItemForm platforms={platforms} initial={initial} action={updateItem.bind(null, id)} submitLabel="Enregistrer" />
    </div>
  );
}
