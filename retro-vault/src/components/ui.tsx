// Primitives d'interface (esprit shadcn/ui : composition Tailwind, sans dépendance).

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary: "bg-accent-strong text-white hover:bg-accent",
  secondary: "bg-surface-2 text-ink border border-line hover:border-ink-3",
  ghost: "text-ink-2 hover:bg-surface-2",
  danger: "bg-transparent text-bad border border-bad/40 hover:bg-bad/10",
} as const;

type Variant = keyof typeof buttonVariants;
const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-2xl border border-line bg-surface p-4", className)} {...props} />;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-ink-2">{children}</h2>
      {action}
    </div>
  );
}

export function Badge({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ink-2", className)}
      {...props}
    />
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full min-h-11 rounded-xl border border-line bg-surface-2 px-3 text-base text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none sm:text-sm";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClass, "appearance-none pr-8", className)} {...props} />;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-3">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** Variation colorée + signe : la couleur n'est jamais seule porteuse du sens. */
export function Trend({ value, children }: { value: number | null; children: ReactNode }) {
  if (value == null) return <span className="text-ink-3">—</span>;
  const tone = value > 0 ? "text-good" : value < 0 ? "text-bad" : "text-ink-3";
  const icon = value > 0 ? "▲" : value < 0 ? "▼" : "•";
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", tone)}>
      <span aria-hidden className="text-[10px]">{icon}</span>
      {children}
    </span>
  );
}

export function Cover({ src, title, className }: { src: string | null; title: string; className?: string }) {
  return src ? (
    // Jaquettes IGDB / photos Supabase : domaines variables, pas de next/image ici.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={`Jaquette de ${title}`} loading="lazy" className={cn("rounded-lg bg-surface-2 object-cover", className)} />
  ) : (
    <div aria-hidden className={cn("flex items-center justify-center rounded-lg bg-surface-2 text-lg text-ink-3", className)}>
      🎮
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-3">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
