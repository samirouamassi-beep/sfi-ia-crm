// Montants : stockés en centimes (Int), affichés en euros.

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const eurRound = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatCents(cents: number | null | undefined, opts?: { round?: boolean }): string {
  if (cents == null) return "—";
  return (opts?.round ? eurRound : eur).format(cents / 100);
}

/** Variation signée : "+12,50 €" / "−3,00 €". */
export function formatDelta(cents: number): string {
  const sign = cents > 0 ? "+" : cents < 0 ? "−" : "";
  return `${sign}${eur.format(Math.abs(cents) / 100)}`;
}

export function formatPercent(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  const sign = ratio > 0 ? "+" : ratio < 0 ? "−" : "";
  return `${sign}${(Math.abs(ratio) * 100).toFixed(1).replace(".", ",")} %`;
}

/** "12,5" / "12.50" / "1 200" -> centimes. null si vide ou invalide. */
export function parseEurosToCents(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = input.replace(/[\s€]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function centsToEurosInput(cents: number | null | undefined): string {
  return cents == null ? "" : (cents / 100).toFixed(2);
}
