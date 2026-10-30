import Link from "next/link";
import { LineChart } from "@/components/line-chart";
import { ButtonLink, Card, CardTitle, Cover, EmptyState, PageHeader, Trend } from "@/components/ui";
import { requireUserId } from "@/lib/auth";
import { COMPLETENESS_LABELS, COMPLETENESS_VALUES, REGION_LABELS } from "@/lib/catalog";
import { formatCents, formatDelta, formatPercent } from "@/lib/money";
import { loadDashboard, type Dashboard } from "@/lib/stats";
import { gain } from "@/lib/valuation";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const d = await loadDashboard(userId);

  if (d.count === 0) {
    return (
      <>
        <PageHeader title="Tableau de bord" />
        <EmptyState title="Bienvenue dans votre coffre" action={<ButtonLink href="/collection/new">Ajouter un premier jeu</ButtonLink>}>
          Ajoutez vos jeux, consoles et accessoires : la valeur de la collection et sa plus-value seront suivies
          automatiquement.
        </EmptyState>
      </>
    );
  }

  const { deltaCents, ratio } = gain(d.valueCents, d.investedCents);

  return (
    <div className="space-y-4">
      <PageHeader title="Tableau de bord" subtitle={`${d.count} pièce${d.count > 1 ? "s" : ""} en collection`} />

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="col-span-2">
          <p className="text-xs text-ink-3">Valeur estimée</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{formatCents(d.valueCents, { round: true })}</p>
          <p className="mt-1 text-sm">
            <Trend value={deltaCents}>
              {deltaCents != null ? `${formatDelta(deltaCents)} (${formatPercent(ratio)})` : "—"}
            </Trend>
            <span className="text-ink-3"> vs investi</span>
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink-3">Investi</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatCents(d.investedCents, { round: true })}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-3">ROI</p>
          <p className="mt-1 text-lg font-semibold">
            <Trend value={ratio}>{formatPercent(ratio)}</Trend>
          </p>
        </Card>
      </div>

      {d.unpriced > 0 && (
        <p className="text-xs text-ink-3">
          {d.unpriced} pièce{d.unpriced > 1 ? "s" : ""} sans cote : comptée{d.unpriced > 1 ? "s" : ""} à leur prix d&apos;achat.
        </p>
      )}

      <Card>
        <CardTitle>Valeur estimée vs investissement</CardTitle>
        <LineChart
          ariaLabel="Évolution de la valeur estimée de la collection et de l'investissement cumulé"
          dates={d.timeline.map((p) => p.date.toISOString())}
          series={[
            { key: "value", label: "Valeur estimée", color: "var(--color-series-value)", values: d.timeline.map((p) => p.valueCents) },
            { key: "invested", label: "Investi", color: "var(--color-series-invested)", values: d.timeline.map((p) => p.investedCents) },
          ]}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <MoversCard title={`En hausse sur ${d.moversWindowDays} jours`} movers={d.gainers} empty="Aucune hausse de cote récente." />
        <MoversCard title={`En baisse sur ${d.moversWindowDays} jours`} movers={d.losers} empty="Aucune baisse de cote récente." />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/collection?sort=value" className="text-xs text-accent">Tout voir</Link>}>Pièces maîtresses</CardTitle>
          <ol className="space-y-2">
            {d.topPieces.map(({ item, valueCents }) => (
              <li key={item.id}>
                <Link href={`/collection/${item.id}`} className="flex items-center gap-3">
                  <Cover src={item.product.coverUrl} title={item.product.title} className="h-12 w-9 shrink-0 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.product.title}</span>
                    <span className="block text-xs text-ink-3">
                      {item.product.platform.shortName} · {REGION_LABELS[item.region]} · {COMPLETENESS_LABELS[item.completeness].label}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">{formatCents(valueCents, { round: true })}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardTitle>Répartition par plateforme</CardTitle>
          <PlatformBars platforms={d.platforms} total={d.valueCents} />
          <div className="mt-4 flex justify-between border-t border-line pt-3 text-center text-xs">
            {COMPLETENESS_VALUES.map((c) => (
              <div key={c} className="flex-1">
                <p className="text-ink-3">{COMPLETENESS_LABELS[c].label}</p>
                <p className="mt-0.5 text-base font-medium tabular-nums">{d.completeness[c]}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MoversCard({ title, movers, empty }: { title: string; movers: Dashboard["gainers"]; empty: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {movers.length === 0 ? (
        <p className="text-sm text-ink-3">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {movers.map((m) => (
            <li key={m.itemId}>
              <Link href={`/collection/${m.itemId}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {m.item.product.title} <span className="text-xs text-ink-3">{m.item.product.platform.shortName}</span>
                </span>
                <span className="shrink-0 text-right">
                  <Trend value={m.deltaCents}>{formatPercent(m.ratio)}</Trend>
                  <span className="block text-xs tabular-nums text-ink-3">
                    {formatCents(m.beforeCents, { round: true })} → {formatCents(m.nowCents, { round: true })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Barres horizontales : une seule teinte (magnitude), valeur en libellé, pas de couleur par catégorie. */
function PlatformBars({ platforms, total }: { platforms: Dashboard["platforms"]; total: number }) {
  const max = Math.max(1, ...platforms.map((p) => p.valueCents));
  return (
    <ul className="space-y-2">
      {platforms.slice(0, 8).map((p) => (
        <li key={p.name} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 text-xs">
          <span className="text-ink-2">{p.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-series-value" style={{ width: `${(p.valueCents / max) * 100}%` }} />
          </span>
          <span className="tabular-nums text-ink-2" title={`${p.count} pièce(s)`}>
            {formatCents(p.valueCents, { round: true })}
            <span className="ml-1 text-ink-3">{total > 0 ? `${Math.round((p.valueCents / total) * 100)} %` : ""}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
