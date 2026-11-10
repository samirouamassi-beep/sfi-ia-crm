import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { Badge, ButtonLink, Cover, EmptyState, PageHeader, Trend } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { COMPLETENESS_LABELS, COMPLETENESS_VALUES, KIND_LABELS, KIND_VALUES, REGION_LABELS, REGION_VALUES } from "@/lib/catalog";
import { SORTS, loadCollection, loadFilterOptions, parseFilters } from "@/lib/collection";
import { formatCents, formatPercent } from "@/lib/money";

export const metadata = { title: "Collection" };

export default async function CollectionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const userId = await requireUserId();
  const params = await searchParams;
  const filters = parseFilters(params);
  // Les exports reprennent les filtres et le tri affichés.
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) => (typeof v === "string" && v !== "" ? [[k, v]] : []))
  ).toString();
  const exportHref = (format: "xlsx" | "pdf") => `/api/export?format=${format}${query ? `&${query}` : ""}`;
  const [rows, options] = await Promise.all([loadCollection(userId, filters), loadFilterOptions(userId)]);

  const totalValue = rows.reduce((s, r) => s + (r.valueCents ?? r.purchaseCents ?? 0), 0);
  const totalPurchase = rows.reduce((s, r) => s + (r.purchaseCents ?? 0), 0);
  const filtered = Boolean(filters.q || filters.platform || filters.completeness || filters.region || filters.kind || filters.genre || filters.attr);

  return (
    <>
      <PageHeader
        title="Collection"
        subtitle={`${rows.length} exemplaire${rows.length > 1 ? "s" : ""} · ${formatCents(totalValue, { round: true })} estimés · ${formatCents(totalPurchase, { round: true })} investis`}
        action={
          // Mobile : l'ajout passe par l'onglet central de la barre de navigation.
          <div className="hidden md:block">
            <ButtonLink href="/collection/new">＋ Ajouter</ButtonLink>
          </div>
        }
      />

      <FilterBar
        action="/collection"
        q={filters.q}
        filters={[
          { name: "platform", label: "Console", value: filters.platform, options: options.platforms.map((p) => ({ value: p.slug, label: p.shortName })) },
          { name: "completeness", label: "État", value: filters.completeness, options: COMPLETENESS_VALUES.map((c) => ({ value: c, label: COMPLETENESS_LABELS[c].label })) },
          { name: "region", label: "Région", value: filters.region, options: REGION_VALUES.map((r) => ({ value: r, label: REGION_LABELS[r] })) },
          { name: "kind", label: "Type", value: filters.kind, options: KIND_VALUES.map((k) => ({ value: k, label: KIND_LABELS[k] })) },
          { name: "genre", label: "Genre", value: filters.genre, options: options.genres.map((g) => ({ value: g, label: g })) },
          ...(options.flags.length > 0
            ? [{ name: "attr", label: "Avec…", value: filters.attr, options: options.flags.map((a) => ({ value: a.id, label: a.label })) }]
            : []),
          { name: "sort", label: "Trier", value: filters.sort, options: Object.entries(SORTS).map(([value, label]) => ({ value, label: `↕ ${label}` })) },
        ]}
      />

      {rows.length > 0 && (
        <div className="-mt-2 mb-3 flex items-center justify-end gap-2 text-xs text-ink-3">
          <span>Exporter {filtered ? "cette sélection" : "la liste"} :</span>
          <a href={exportHref("xlsx")} download className="rounded-full border border-line px-3 py-1.5 text-ink-2 hover:border-ink-3">
            Excel
          </a>
          <a href={exportHref("pdf")} download className="rounded-full border border-line px-3 py-1.5 text-ink-2 hover:border-ink-3">
            PDF
          </a>
        </div>
      )}

      {rows.length === 0 ? (
        filtered ? (
          <EmptyState title="Aucun résultat">Essayez d&apos;élargir les filtres.</EmptyState>
        ) : (
          <EmptyState title="Votre coffre est vide" action={<ButtonLink href="/collection/new">Ajouter un premier jeu</ButtonLink>}>
            Ajoutez un jeu en tapant son titre, ou importez une collection existante (CSV / JSON) depuis l&apos;onglet Plus.
          </EmptyState>
        )
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/collection/${r.id}`} className="flex items-center gap-3 p-3 hover:bg-surface-2">
                <Cover src={r.photos[0]?.url ?? r.product.coverUrl} title={r.product.title} className="h-16 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.product.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge>{r.product.platform.shortName}</Badge>
                    <Badge>{REGION_LABELS[r.region]}</Badge>
                    <Badge className={r.completeness === "SEALED" ? "text-accent" : undefined}>{COMPLETENESS_LABELS[r.completeness].label}</Badge>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-medium tabular-nums">{formatCents(r.valueCents, { round: true })}</p>
                  <p className="text-xs">
                    <Trend value={r.deltaCents}>{formatPercent(r.ratio)}</Trend>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
