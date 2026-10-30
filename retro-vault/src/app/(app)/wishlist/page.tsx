import { ConfirmButton } from "@/components/confirm-button";
import { Badge, Card, CardTitle, Cover, EmptyState, PageHeader } from "@/components/ui";
import { WishForm } from "@/components/wish-form";
import { requireUserId } from "@/lib/auth";
import { COMPLETENESS_LABELS, REGION_LABELS } from "@/lib/catalog";
import { loadPriceIndex } from "@/lib/collection";
import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/money";
import { listPlatforms } from "@/lib/platforms";
import { basePriceCents } from "@/lib/valuation";
import { addWish, removeWish } from "./actions";

export const metadata = { title: "Wishlist" };

const PRIORITY = { 1: "Haute", 2: "Normale", 3: "Basse" } as Record<number, string>;

export default async function WishlistPage() {
  const userId = await requireUserId();
  const [wishes, platforms] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { platform: true } } },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    listPlatforms(),
  ]);
  const index = await loadPriceIndex(wishes.map((w) => w.productId));
  const now = new Date();
  const rows = wishes.map((w) => {
    const quote = index.quoteAt(w.productId, w.region, now);
    const market = quote ? basePriceCents(quote, w.completeness) : null;
    return { ...w, market, deal: market != null && w.targetPriceCents != null && market <= w.targetPriceCents };
  });
  const budget = rows.reduce((s, r) => s + (r.targetPriceCents ?? r.market ?? 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Wishlist" subtitle={`${rows.length} envie${rows.length > 1 ? "s" : ""} · budget ${formatCents(budget, { round: true })}`} />

      {rows.length === 0 ? (
        <EmptyState title="Aucune envie pour l'instant">Ajoutez les jeux que vous cherchez avec un prix cible : la cote du marché s&apos;affiche en face.</EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((w) => (
            <li key={w.id} className="flex items-center gap-3 p-3">
              <Cover src={w.product.coverUrl} title={w.product.title} className="h-16 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{w.product.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge>{w.product.platform.shortName}</Badge>
                  <Badge>{REGION_LABELS[w.region]}</Badge>
                  <Badge>{COMPLETENESS_LABELS[w.completeness].label}</Badge>
                  <Badge>Priorité {PRIORITY[w.priority]?.toLowerCase()}</Badge>
                </div>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="text-ink-3">
                  Cible <span className="font-medium text-ink tabular-nums">{formatCents(w.targetPriceCents, { round: true })}</span>
                </p>
                <p className="text-ink-3">
                  Cote <span className="tabular-nums text-ink-2">{formatCents(w.market, { round: true })}</span>
                </p>
                {w.deal && <p className="mt-0.5 font-medium text-good">✓ Sous la cible</p>}
              </div>
              <form action={removeWish.bind(null, w.id)}>
                <ConfirmButton message="Retirer de la wishlist ?" variant="ghost" className="min-h-9 px-2" aria-label={`Retirer ${w.product.title}`}>
                  ✕
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardTitle>Ajouter une envie</CardTitle>
        <WishForm platforms={platforms} action={addWish} />
      </Card>
    </div>
  );
}
