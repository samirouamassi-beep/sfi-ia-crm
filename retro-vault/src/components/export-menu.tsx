"use client";

// Bouton « Exporter » de la barre du haut, présent sur tous les écrans.
// Sur la liste de la collection, les exports Excel / PDF reprennent les filtres affichés.

import { usePathname, useSearchParams } from "next/navigation";
import { useRef } from "react";

export function ExportMenu() {
  const pathname = usePathname();
  const params = useSearchParams();
  const menu = useRef<HTMLDetailsElement>(null);

  const onCollection = pathname === "/collection";
  const query = onCollection ? params.toString() : "";
  const href = (format: string) => `/api/export?format=${format}${query ? `&${query}` : ""}`;
  const scope = onCollection && query ? "la sélection affichée" : "toute la collection";
  const close = () => menu.current?.removeAttribute("open");

  const item = "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-surface-2";
  return (
    <details ref={menu} className="relative">
      <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm text-ink-2 hover:border-ink-3 [&::-webkit-details-marker]:hidden">
        <span aria-hidden>⬇</span> Exporter
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/50">
        <p className="px-3 pb-1 pt-2 text-xs text-ink-3">Télécharger {scope}</p>
        <a href={href("xlsx")} download onClick={close} className={item}>
          <span aria-hidden>📊</span> Excel (.xlsx)
        </a>
        <a href={href("pdf")} download onClick={close} className={item}>
          <span aria-hidden>📄</span> PDF
        </a>
        <div className="my-1 border-t border-line" />
        <p className="px-3 pb-1 pt-1 text-xs text-ink-3">Sauvegarde réimportable (tout)</p>
        <a href="/api/export?format=csv" download onClick={close} className={item}>
          <span aria-hidden>🗂️</span> CSV
        </a>
      </div>
    </details>
  );
}
