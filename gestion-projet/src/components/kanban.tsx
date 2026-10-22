"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";

export type CarteKanban = {
  id: string;
  nom: string;
  statut: string;
  responsable: string | null;
  fin: string; // date formatée
  avancement: number;
  priorite: string;
  retard: boolean;
  jalon: boolean;
  href: string;
};

const COULEUR_COLONNE: Record<string, string> = {
  "À faire": "border-t-slate-400",
  "En cours": "border-t-indigo-500",
  "En revue": "border-t-violet-500",
  Terminée: "border-t-emerald-500",
};

/**
 * Tableau Kanban : glisser-déposer une carte change son statut (mise à jour optimiste).
 * Sur écran tactile, la liste déroulante de chaque carte fait la même chose.
 */
export function Kanban({
  cartes,
  colonnes,
  deplacer,
}: {
  cartes: CarteKanban[];
  colonnes: readonly string[];
  deplacer: (id: string, statut: string) => Promise<void>;
}) {
  const [liste, appliquer] = useOptimistic(cartes, (etat, { id, statut }: { id: string; statut: string }) =>
    etat.map((c) => (c.id === id ? { ...c, statut } : c))
  );
  const [, demarrer] = useTransition();
  const [survol, setSurvol] = useState<string | null>(null);

  function changer(id: string, statut: string) {
    demarrer(async () => {
      appliquer({ id, statut });
      await deplacer(id, statut);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {colonnes.map((col) => {
        const items = liste.filter((c) => c.statut === col);
        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(col);
            }}
            onDragLeave={() => setSurvol(null)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) changer(id, col);
            }}
            className={`rounded-xl border-t-4 bg-slate-100 p-2 ${COULEUR_COLONNE[col] ?? "border-t-slate-400"} ${
              survol === col ? "ring-2 ring-indigo-300" : ""
            }`}
          >
            <div className="flex items-center justify-between px-1 py-1.5">
              <span className="text-sm font-semibold text-slate-700">{col}</span>
              <span className="rounded-full bg-white px-2 text-xs text-slate-500">{items.length}</span>
            </div>
            <div className="min-h-24 space-y-2">
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
                  className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <Link href={c.href} className="text-sm font-medium text-slate-900 hover:text-indigo-700">
                    {c.jalon && "◆ "}
                    {c.nom}
                  </Link>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{c.responsable ?? "Non affectée"}</span>
                    <span className={c.retard ? "font-medium text-red-600" : ""}>{c.fin}</span>
                  </div>
                  {!c.jalon && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full bg-indigo-500" style={{ width: `${c.avancement}%` }} />
                    </div>
                  )}
                  <select
                    aria-label="Changer le statut"
                    value={c.statut}
                    onChange={(e) => changer(c.id, e.target.value)}
                    className="mt-2 w-full rounded border border-slate-200 bg-slate-50 px-1.5 py-1 text-xs text-slate-600 md:hidden"
                  >
                    {colonnes.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
