export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  alerte,
}: {
  label: string;
  value: string | number;
  alerte?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-medium ${alerte ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </span>
    </div>
  );
}

export function formatEuros(valeur: number | null | undefined): string {
  if (valeur == null) return "–";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(valeur);
}

export function formatPourcentage(valeur: number | null | undefined): string {
  if (valeur == null) return "–";
  return new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(
    valeur
  );
}

export function formatDate(valeur: Date | string | null | undefined): string {
  if (!valeur) return "–";
  const date = typeof valeur === "string" ? new Date(valeur) : valeur;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function Badge({ children, retard }: { children: React.ReactNode; retard?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        retard ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}

export const rowLinkClass = "font-medium text-blue-700 underline underline-offset-2 hover:text-blue-900";

export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";
export const labelClass = "block text-sm font-medium text-slate-700";
export const buttonPrimaryClass =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";
export const buttonSecondaryClass =
  "rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const linkButtonClass =
  "inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700";
