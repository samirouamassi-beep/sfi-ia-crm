"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

const TABS = [
  { href: "/", label: "Tableau", icon: "📈", match: (p: string) => p === "/" },
  { href: "/collection", label: "Collection", icon: "🗂️", match: (p: string) => p.startsWith("/collection") && p !== "/collection/new" },
  { href: "/collection/new", label: "Ajouter", icon: "＋", match: (p: string) => p === "/collection/new", primary: true },
  { href: "/wishlist", label: "Wishlist", icon: "⭐", match: (p: string) => p.startsWith("/wishlist") },
  { href: "/settings", label: "Plus", icon: "⚙️", match: (p: string) => p.startsWith("/settings") || p.startsWith("/share") },
];

/** Barre d'onglets en bas d'écran (mobile) / barre latérale (desktop). */
export function Nav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pt-1.5 backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-56 md:border-r md:border-t-0 md:pt-6"
    >
      <p className="hidden px-5 pb-6 text-sm font-semibold tracking-wide md:block">
        RETRO<span className="text-accent">VAULT</span>
      </p>
      <ul className="mx-auto flex max-w-md justify-around md:flex-col md:gap-1 md:px-3">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-14 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm",
                  active ? "text-ink" : "text-ink-3 hover:text-ink-2",
                  active && "md:bg-surface-2"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-7 w-7 items-center justify-center text-lg",
                    tab.primary && "rounded-full bg-accent-strong text-white"
                  )}
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
