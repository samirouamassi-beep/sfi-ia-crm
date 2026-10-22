"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LienNav = { href: string; label: string; icone: string };

// Icônes : tracés SVG 24x24 (style trait), pour éviter une dépendance.
const ICONES: Record<string, string> = {
  accueil: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  projets: "M3 7h18M3 12h18M3 17h12",
  planning: "M4 6h8M8 11h10M6 16h7M3 3v18",
  taches: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9",
  charge: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  temps: "M12 7v5l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  risques: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
  equipe: "M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8",
};

export function Icone({ nom, className = "h-4 w-4" }: { nom: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONES[nom] ?? ""} />
    </svg>
  );
}

export function MenuLateral({ liens }: { liens: LienNav[] }) {
  const chemin = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {liens.map((lien) => {
        const actif = lien.href === "/" ? chemin === "/" : chemin.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
              actif
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icone nom={lien.icone} />
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}
