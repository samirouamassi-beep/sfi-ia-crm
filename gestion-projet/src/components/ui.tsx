import Link from "next/link";
import { MARQUE } from "@/lib/marque";

export function Carte({
  titre,
  children,
  action,
  className = "",
}: {
  titre?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {(titre || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {titre && (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {titre}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  valeur,
  detail,
  ton = "neutre",
}: {
  label: string;
  valeur: string | number;
  detail?: string;
  ton?: "neutre" | "bon" | "alerte" | "danger";
}) {
  const couleur = {
    neutre: "text-slate-900",
    bon: "text-emerald-600",
    alerte: "text-amber-600",
    danger: "text-red-600",
  }[ton];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${couleur}`}>{valeur}</div>
      {detail && <div className="mt-0.5 text-xs text-slate-500">{detail}</div>}
    </div>
  );
}

const COULEURS_METEO: Record<string, string> = {
  Vert: "bg-emerald-500",
  Orange: "bg-amber-500",
  Rouge: "bg-red-500",
};

export function Meteo({ valeur, avecLibelle }: { valeur: string; avecLibelle?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Météo : ${valeur}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${COULEURS_METEO[valeur] ?? "bg-slate-300"}`} />
      {avecLibelle && <span className="text-sm text-slate-700">{valeur}</span>}
    </span>
  );
}

const COULEURS_STATUT: Record<string, string> = {
  Cadrage: "bg-sky-100 text-sky-800",
  "En cours": "bg-indigo-100 text-indigo-800",
  "En pause": "bg-amber-100 text-amber-800",
  Terminé: "bg-emerald-100 text-emerald-800",
  Terminée: "bg-emerald-100 text-emerald-800",
  Annulé: "bg-slate-200 text-slate-600",
  "À faire": "bg-slate-100 text-slate-700",
  "En revue": "bg-violet-100 text-violet-800",
  Ouvert: "bg-red-100 text-red-700",
  "En traitement": "bg-amber-100 text-amber-800",
  Clos: "bg-slate-100 text-slate-600",
  Critique: "bg-red-100 text-red-700",
  Haute: "bg-orange-100 text-orange-800",
  Normale: "bg-slate-100 text-slate-700",
  Basse: "bg-slate-50 text-slate-500",
  Risque: "bg-amber-100 text-amber-800",
  Problème: "bg-red-100 text-red-700",
};

export function Badge({ children, ton }: { children: React.ReactNode; ton?: string }) {
  const cle = ton ?? (typeof children === "string" ? children : "");
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
        COULEURS_STATUT[cle] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  );
}

export function BadgeRetard() {
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      En retard
    </span>
  );
}

export function ScoreRisque({ score }: { score: number }) {
  const couleur =
    score >= 9 ? "bg-red-600 text-white" : score >= 4 ? "bg-amber-400 text-amber-950" : "bg-emerald-100 text-emerald-800";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-xs font-semibold ${couleur}`}
      title="Criticité = probabilité × impact"
    >
      {score}
    </span>
  );
}

export function Progression({
  valeur,
  prevu,
  couleur = "bg-indigo-500",
}: {
  valeur: number;
  prevu?: number;
  couleur?: string;
}) {
  const v = Math.max(0, Math.min(100, valeur));
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-full min-w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${couleur}`} style={{ width: `${v}%` }} />
        {prevu != null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-700"
            style={{ left: `${Math.min(100, prevu)}%` }}
            title={`Prévu à date : ${prevu} %`}
          />
        )}
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-slate-600">{v}%</span>
    </div>
  );
}

export function Onglets({
  onglets,
  actif,
}: {
  onglets: { cle: string; label: string; href: string }[];
  actif: string;
}) {
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-slate-200 text-sm">
      {onglets.map((o) => (
        <Link
          key={o.cle}
          href={o.href}
          className={`whitespace-nowrap border-b-2 px-3 py-2 ${
            o.cle === actif
              ? "border-indigo-600 font-medium text-indigo-700"
              : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

export function Vide({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

export function EnTete({
  titre,
  sousTitre,
  actions,
}: {
  titre: React.ReactNode;
  sousTitre?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-slate-900">{titre}</h1>
        {sousTitre && <div className="mt-0.5 text-sm text-slate-500">{sousTitre}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function formatMontant(valeur: number | null | undefined): string {
  if (valeur == null) return "–";
  const nombre = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(valeur);
  return `${nombre} ${MARQUE.devise}`;
}

export function formatPourcentage(valeur: number | null | undefined): string {
  if (valeur == null) return "–";
  return new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 }).format(
    valeur
  );
}

export function formatJours(valeur: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(valeur)} j`;
}

export function formatDate(valeur: Date | string | null | undefined): string {
  if (!valeur) return "–";
  const date = typeof valeur === "string" ? new Date(valeur) : valeur;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(date);
}

export function formatDateCourte(valeur: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(valeur);
}

export function dateInput(d?: Date | null): string {
  if (!d) return "";
  const x = new Date(d);
  const mois = String(x.getMonth() + 1).padStart(2, "0");
  const jour = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${mois}-${jour}`;
}

export const lienClass = "font-medium text-indigo-700 hover:text-indigo-900 hover:underline";

export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";
export const labelClass = "block text-sm font-medium text-slate-700";
export const boutonPrincipal =
  "inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50";
export const boutonSecondaire =
  "inline-flex items-center rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const boutonDanger =
  "inline-flex items-center rounded-md border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50";

export const tableClass = "w-full text-left text-sm";
export const thClass = "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500";
export const tdClass = "px-3 py-2 align-middle";
