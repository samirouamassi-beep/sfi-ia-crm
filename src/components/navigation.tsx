"use client";

import Link from "next/link";
import Form from "next/form";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export function LiensNavigation({ liens }: { liens: { href: string; label: string }[] }) {
  const chemin = usePathname();
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto text-sm">
      {liens.map((lien) => {
        const actif = lien.href === "/" ? chemin === "/" : chemin.startsWith(lien.href);
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 ${
              actif
                ? "border-slate-900 font-medium text-slate-900"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {lien.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barre de recherche globale. Raccourci clavier : « / » place le curseur dedans. */
export function RechercheGlobale() {
  const champ = useRef<HTMLInputElement>(null);
  const chemin = usePathname();
  const q = useSearchParams().get("q") ?? "";

  useEffect(() => {
    function raccourci(e: KeyboardEvent) {
      const cible = e.target as HTMLElement;
      const enSaisie =
        cible.tagName === "INPUT" || cible.tagName === "TEXTAREA" || cible.tagName === "SELECT";
      if (e.key === "/" && !enSaisie) {
        e.preventDefault();
        champ.current?.focus();
      }
    }
    window.addEventListener("keydown", raccourci);
    return () => window.removeEventListener("keydown", raccourci);
  }, []);

  return (
    <Form action="/recherche" className="w-full max-w-sm" key={chemin === "/recherche" ? q : "x"}>
      <input
        ref={champ}
        name="q"
        type="search"
        defaultValue={chemin === "/recherche" ? q : ""}
        placeholder="Rechercher partout…  ( / )"
        aria-label="Recherche globale"
        className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm focus:border-slate-500 focus:bg-white focus:outline-none"
      />
    </Form>
  );
}
