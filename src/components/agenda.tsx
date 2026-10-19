import Link from "next/link";
import { basculerTache } from "@/app/(site)/taches/actions";
import type { ElementAgenda } from "@/lib/agenda";
import { formatDate } from "@/components/ui";

const COULEUR_SOURCE: Record<ElementAgenda["source"], string> = {
  Tâche: "bg-blue-50 text-blue-700",
  "Relance contact": "bg-violet-50 text-violet-700",
  Opportunité: "bg-emerald-50 text-emerald-700",
  Interaction: "bg-slate-100 text-slate-600",
};

/** Bouton rond "cocher" d'une tache (ou la rouvrir si elle est terminee). */
export function CaseTache({ id, terminee = false }: { id: string; terminee?: boolean }) {
  return (
    <form action={basculerTache.bind(null, id)} className="flex">
      <button
        type="submit"
        title={terminee ? "Rouvrir la tâche" : "Marquer comme terminée"}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
          terminee
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-400 text-transparent hover:border-emerald-500 hover:text-emerald-500"
        }`}
      >
        ✓
      </button>
    </form>
  );
}

export function ListeAgenda({
  elements,
  vide = "Rien à faire.",
}: {
  elements: ElementAgenda[];
  vide?: string;
}) {
  if (elements.length === 0) {
    return <p className="py-3 text-center text-sm text-slate-400">{vide}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {elements.map((e) => (
        <li key={e.cle} className="flex items-start gap-3 py-2">
          <div className="pt-0.5">
            {e.tacheId ? (
              <CaseTache id={e.tacheId} />
            ) : (
              <span className="block h-5 w-5" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={e.href} className="text-sm font-medium text-slate-900 hover:underline">
              {e.titre}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span className={`rounded px-1.5 py-0.5 font-medium ${COULEUR_SOURCE[e.source]}`}>
                {e.source}
              </span>
              {e.contexte && <span>{e.contexte}</span>}
              {e.fondateur && <span>· {e.fondateur}</span>}
              {e.priorite === "Haute" && <span className="font-medium text-orange-600">· Priorité haute</span>}
            </div>
          </div>
          <span
            className={`shrink-0 text-xs ${
              e.echeance === "retard" ? "font-medium text-red-600" : "text-slate-500"
            }`}
          >
            {e.date ? formatDate(e.date) : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
