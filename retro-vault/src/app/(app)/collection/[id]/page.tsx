import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/confirm-button";
import { LineChart } from "@/components/line-chart";
import { Badge, Button, ButtonLink, Card, CardTitle, Cover, Trend } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { COMPLETENESS_LABELS, GRADE_LABELS, KIND_LABELS, REGION_LABELS, type Grade } from "@/lib/catalog";
import { loadPriceIndex } from "@/lib/collection";
import { prisma } from "@/lib/db";
import { formatCents, formatDelta, formatPercent } from "@/lib/money";
import { basePriceCents, conditionFactor, estimateValueCents, gain } from "@/lib/valuation";
import { deleteItem, refreshItemPrice, removePhoto } from "../actions";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ warning?: string }>;
}) {
  const [{ id }, { warning }] = await Promise.all([params, searchParams]);
  const userId = await requireUserId();
  const item = await prisma.collectionItem.findFirst({
    where: { id, userId },
    include: { product: { include: { platform: true } }, photos: { orderBy: { position: "asc" } } },
  });
  if (!item) notFound();

  const p = item.product;
  const history = await prisma.priceSnapshot.findMany({
    where: { productId: p.id, region: item.region },
    orderBy: { capturedAt: "asc" },
    take: 365,
  });
  const quote = (await loadPriceIndex([p.id])).quoteAt(p.id, item.region, new Date());
  const valueCents = estimateValueCents(item, quote);
  const { deltaCents, ratio } = gain(valueCents, item.purchaseCents);
  const base = quote ? basePriceCents(quote, item.completeness) : null;
  const factor = conditionFactor(item);

  const components: { label: string; grade: Grade | null; score: number | null }[] = [
    ...(item.completeness !== "LOOSE" ? [{ label: item.completeness === "SEALED" ? "Blister / boîte" : "Boîte", grade: item.boxGrade, score: item.boxScore }] : []),
    ...(item.completeness === "CIB" ? [{ label: "Notice", grade: item.manualGrade, score: item.manualScore }] : []),
    ...(item.completeness !== "SEALED" ? [{ label: p.kind === "GAME" ? "Cartouche / disque" : "Appareil", grade: item.mediaGrade, score: item.mediaScore }] : []),
  ];

  return (
    <div className="space-y-4">
      {warning && <p className="rounded-xl bg-bad/10 p-3 text-sm text-bad">{warning}</p>}

      <div className="flex gap-4">
        <Cover src={p.coverUrl} title={p.title} className="h-40 w-30 shrink-0 shadow-lg shadow-black/40" />
        <div className="min-w-0 space-y-2">
          <h1 className="text-xl font-semibold leading-tight">{p.title}</h1>
          <div className="flex flex-wrap gap-1">
            <Badge>{p.platform.shortName}</Badge>
            <Badge>{REGION_LABELS[item.region]}</Badge>
            <Badge>{COMPLETENESS_LABELS[item.completeness].label}</Badge>
            {p.kind !== "GAME" && <Badge>{KIND_LABELS[p.kind]}</Badge>}
          </div>
          <p className="text-xs text-ink-3">{[p.releaseYear, p.developer, p.publisher].filter(Boolean).join(" · ")}</p>
          {p.genres.length > 0 && <p className="text-xs text-ink-3">{p.genres.join(", ")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-ink-3">Valeur estimée</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCents(valueCents)}</p>
          <p className="mt-1 text-xs text-ink-3">
            {item.manualValueCents != null
              ? "Valeur saisie manuellement"
              : quote
                ? `Cote ${COMPLETENESS_LABELS[item.completeness].label} ${formatCents(base)} × état ${factor.toFixed(2).replace(".", ",")}`
                : "Pas encore de cote"}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink-3">Plus-value</p>
          <p className="mt-1 text-2xl font-semibold">
            <Trend value={deltaCents}>{deltaCents != null ? formatDelta(deltaCents) : "—"}</Trend>
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Acheté {formatCents(item.purchaseCents)} {ratio != null && `· ${formatPercent(ratio)}`}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle
          action={
            <form action={refreshItemPrice.bind(null, item.id)}>
              <Button variant="ghost" className="min-h-8 px-2 text-xs">
                ↻ Actualiser
              </Button>
            </form>
          }
        >
          Historique de la cote ({REGION_LABELS[item.region]})
        </CardTitle>
        {history.length >= 2 ? (
          <LineChart
            ariaLabel={`Évolution de la cote de ${p.title}`}
            dates={history.map((h) => h.capturedAt.toISOString())}
            series={[
              { key: "value", label: "Votre exemplaire", color: "var(--color-series-value)", values: history.map((h) => estimateValueCents({ ...item, manualValueCents: null }, h)) },
            ]}
            height={180}
          />
        ) : (
          <p className="text-sm text-ink-3">
            {history.length === 1
              ? `Une seule cote relevée (${dateFmt.format(history[0].capturedAt)}). La courbe apparaîtra au prochain relevé.`
              : "Aucune cote relevée pour l'instant : configurez PRICECHARTING_TOKEN ou saisissez une valeur manuelle."}
          </p>
        )}
        {quote && (
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs">
            {(["LOOSE", "CIB", "SEALED"] as const).map((c) => (
              <div key={c} className={c === item.completeness ? "text-ink" : "text-ink-3"}>
                <dt>{COMPLETENESS_LABELS[c].label}</dt>
                <dd className="mt-0.5 font-medium tabular-nums">{formatCents(basePriceCents(quote, c))}</dd>
              </div>
            ))}
          </dl>
        )}
      </Card>

      <Card>
        <CardTitle>Exemplaire</CardTitle>
        <dl className="space-y-2 text-sm">
          {components.map((c) => (
            <div key={c.label} className="flex justify-between gap-4">
              <dt className="text-ink-3">{c.label}</dt>
              <dd>{[c.grade && GRADE_LABELS[c.grade], c.score != null && `${c.score}/10`].filter(Boolean).join(" · ") || "Non renseigné"}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-3">Acquis le</dt>
            <dd>{item.acquiredAt ? dateFmt.format(item.acquiredAt) : "—"}</dd>
          </div>
          {item.notes && <p className="whitespace-pre-line border-t border-line pt-2 text-ink-2">{item.notes}</p>}
        </dl>
      </Card>

      {item.photos.length > 0 && (
        <Card>
          <CardTitle>Photos</CardTitle>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4">
            {item.photos.map((photo) => (
              <div key={photo.id} className="relative shrink-0 snap-start">
                <a href={photo.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={`Photo de ${p.title}`} className="h-40 w-40 rounded-xl object-cover" />
                </a>
                <form action={removePhoto.bind(null, photo.id)} className="absolute right-1 top-1">
                  <ConfirmButton message="Supprimer cette photo ?" variant="secondary" className="min-h-8 rounded-full px-2 text-xs" aria-label="Supprimer la photo">
                    ✕
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      {p.summary && (
        <details className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-2">
          <summary className="cursor-pointer text-ink-3">Résumé (IGDB)</summary>
          <p className="mt-2">{p.summary}</p>
        </details>
      )}

      <div className="flex gap-2">
        <ButtonLink href={`/collection/${item.id}/edit`} variant="secondary" className="flex-1">
          Modifier
        </ButtonLink>
        <form action={deleteItem.bind(null, item.id)} className="flex-1">
          <ConfirmButton message="Supprimer définitivement cet exemplaire et ses photos ?" variant="danger" className="w-full">
            Supprimer
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
}
