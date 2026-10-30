"use client";

// Courbe(s) temporelle(s) en SVG : un seul axe en euros, réticule + infobulle au survol/toucher,
// légende dès 2 séries, tableau des données pour l'accessibilité.

import { useId, useMemo, useState } from "react";
import { formatCents } from "@/lib/money";

export type Series = { key: string; label: string; color: string; values: (number | null)[] };

type Props = {
  dates: string[]; // ISO
  series: Series[];
  height?: number;
  ariaLabel: string;
};

const W = 640;
const PAD = { top: 12, right: 72, bottom: 24, left: 8 };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

export function LineChart({ dates, series, height = 220, ariaLabel }: Props) {
  const tableId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const { max, x, y } = useMemo(() => {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
    const max = niceMax(Math.max(0, ...all) * 1.05);
    const n = Math.max(dates.length - 1, 1);
    return {
      max,
      x: (i: number) => PAD.left + (i / n) * innerW,
      y: (v: number) => PAD.top + innerH - (v / max) * innerH,
    };
  }, [series, dates.length, innerW, innerH]);

  if (dates.length === 0) return null;

  const path = (values: (number | null)[]) =>
    values
      .map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .reduce<string>((d, pt, i, arr) => (pt == null ? d : `${d}${d === "" || arr[i - 1] == null ? "M" : "L"}${pt}`), "");

  const ticks = [0, 0.5, 1].map((r) => r * max);
  const xLabels = dates.length <= 6 ? dates.map((_, i) => i) : [0, Math.floor((dates.length - 1) / 2), dates.length - 1];

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.round(ratio * (dates.length - 1)));
  }

  const last = dates.length - 1;
  const tipLeft = hover != null ? (x(hover) / W) * 100 : 0;

  return (
    <figure className="relative">
      {series.length > 1 && (
        <figcaption className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y select-none" role="img" aria-label={ariaLabel} aria-describedby={tableId}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t === 0 ? undefined : "2 4"} />
            <text x={W - PAD.right + 6} y={y(t) + 4} fontSize="11" fill="var(--color-ink-3)">
              {formatCents(t, { round: true })}
            </text>
          </g>
        ))}
        {xLabels.map((i) => (
          <text key={i} x={x(i)} y={H - 6} fontSize="11" fill="var(--color-ink-3)" textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}>
            {dateFmt.format(new Date(dates[i]))}
          </text>
        ))}
        {series.map((s) => (
          <path key={s.key} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--color-ink-3)" strokeWidth={1} />
            {series.map((s) =>
              s.values[hover] == null ? null : (
                <circle key={s.key} cx={x(hover)} cy={y(s.values[hover]!)} r={4.5} fill={s.color} stroke="var(--color-surface)" strokeWidth={2} />
              )
            )}
          </g>
        )}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hover != null && (
        <div
          className="pointer-events-none absolute top-8 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `clamp(4.5rem, ${tipLeft}%, calc(100% - 4.5rem))` }}
        >
          <p className="mb-1 text-ink-3">{dayFmt.format(new Date(dates[hover]))}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-ink-2">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium tabular-nums text-ink">{formatCents(s.values[hover])}</span>
            </p>
          ))}
        </div>
      )}

      <details className="mt-2 text-xs text-ink-3">
        <summary className="cursor-pointer">Voir les données</summary>
        <table id={tableId} className="mt-2 w-full tabular-nums">
          <thead>
            <tr>
              <th className="text-left font-normal">Date</th>
              {series.map((s) => (
                <th key={s.key} className="text-right font-normal">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink-2">
            {dates.map((d, i) => (
              <tr key={d}>
                <td>{dayFmt.format(new Date(d))}</td>
                {series.map((s) => (
                  <td key={s.key} className="text-right">
                    {formatCents(s.values[i])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
