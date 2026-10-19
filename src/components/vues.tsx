import Link from "next/link";
import Form from "next/form";
import { construireRequete, lireParam, type SearchParams } from "@/lib/vues";
import { enregistrerVue, supprimerVue } from "@/app/(site)/vues/actions";

export type Filtre = {
  nom: string;
  label: string;
  options: readonly (string | { valeur: string; label: string })[];
};

export type VuePredefinie = { nom: string; requete: string };

const selectClass =
  "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none";

/** Ordre des cles indifferent : "a=1&b=2" et "b=2&a=1" designent la meme vue. */
function normaliserRequete(requete: string): string {
  const sp = new URLSearchParams(requete);
  return [...sp.entries()]
    .filter(([, v]) => v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function Puce({ href, actif, children }: { href: string; actif: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        actif
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

/** Barre "vues de liste" : vues predefinies et enregistrees, recherche, filtres. */
export function ListeOutils({
  chemin,
  params,
  filtres,
  placeholder = "Rechercher…",
  vuesPredefinies = [],
  vuesEnregistrees = [],
  conserver = [],
  nbResultats,
}: {
  chemin: string;
  params: SearchParams;
  filtres: Filtre[];
  placeholder?: string;
  vuesPredefinies?: VuePredefinie[];
  vuesEnregistrees?: { id: string; nom: string; requete: string }[];
  /** Parametres a garder d'une vue a l'autre (ex. mode liste/kanban du pipeline). */
  conserver?: string[];
  nbResultats: number;
}) {
  const requeteCourante = construireRequete(params);
  const courante = normaliserRequete(requeteCourante);
  const base = construireRequete(
    Object.fromEntries(conserver.map((c) => [c, lireParam(params, c)]))
  );
  const avecBase = (requete: string) => {
    const sp = new URLSearchParams(base);
    new URLSearchParams(requete).forEach((v, k) => sp.set(k, v));
    return sp.toString();
  };
  const href = (requete: string) => (requete ? `${chemin}?${requete}` : chemin);
  const filtreActif = courante !== normaliserRequete(base);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Vues</span>
        <Puce href={href(base)} actif={!filtreActif}>
          Toutes
        </Puce>
        {vuesPredefinies.map((v) => {
          const requete = avecBase(v.requete);
          return (
            <Puce key={v.nom} href={href(requete)} actif={courante === normaliserRequete(requete)}>
              {v.nom}
            </Puce>
          );
        })}
        {vuesEnregistrees.map((v) => (
          <span key={v.id} className="inline-flex items-center">
            <Puce href={href(v.requete)} actif={courante === normaliserRequete(v.requete)}>
              ★ {v.nom}
            </Puce>
            <form action={supprimerVue.bind(null, v.id, chemin)}>
              <button
                type="submit"
                title={`Supprimer la vue « ${v.nom} »`}
                className="ml-0.5 px-1 text-xs text-slate-400 hover:text-red-600"
              >
                ×
              </button>
            </form>
          </span>
        ))}
      </div>

      <Form
        key={courante}
        action={chemin}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      >
        {conserver.map((c) =>
          lireParam(params, c) ? (
            <input key={c} type="hidden" name={c} value={lireParam(params, c)} />
          ) : null
        )}
        {lireParam(params, "tri") && (
          <input type="hidden" name="tri" value={lireParam(params, "tri")} />
        )}
        {lireParam(params, "sens") && (
          <input type="hidden" name="sens" value={lireParam(params, "sens")} />
        )}
        <input
          name="q"
          defaultValue={lireParam(params, "q")}
          placeholder={placeholder}
          className={`${selectClass} min-w-48 flex-1`}
        />
        {filtres.map((f) => (
          <select
            key={f.nom}
            name={f.nom}
            defaultValue={lireParam(params, f.nom)}
            aria-label={f.label}
            className={selectClass}
          >
            <option value="">{f.label} : tous</option>
            {f.options.map((o) => {
              const valeur = typeof o === "string" ? o : o.valeur;
              const label = typeof o === "string" ? o : o.label;
              return (
                <option key={valeur} value={valeur}>
                  {label}
                </option>
              );
            })}
          </select>
        ))}
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Filtrer
        </button>
        {filtreActif && (
          <Link href={href(base)} className="text-sm text-slate-500 hover:text-slate-900">
            Réinitialiser
          </Link>
        )}
        <span className="ml-auto text-xs text-slate-500">
          {nbResultats} résultat{nbResultats > 1 ? "s" : ""}
        </span>
      </Form>

      {filtreActif && (
        <form
          action={enregistrerVue.bind(null, chemin, requeteCourante)}
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="nom"
            required
            placeholder="Nom de la vue (ex : Mes prospects prioritaires)"
            className={`${selectClass} w-72`}
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ★ Enregistrer cette vue
          </button>
        </form>
      )}
    </div>
  );
}

/** En-tete de colonne cliquable : trie la liste, un second clic inverse le sens. */
export function EnTeteTriable({
  chemin,
  params,
  colonne,
  children,
  droite,
  sensParDefaut = "asc",
}: {
  chemin: string;
  params: SearchParams;
  colonne: string;
  children: React.ReactNode;
  droite?: boolean;
  sensParDefaut?: "asc" | "desc";
}) {
  const actif = lireParam(params, "tri") === colonne;
  const sens = lireParam(params, "sens");
  const prochainSens = actif ? (sens === "asc" ? "desc" : "asc") : sensParDefaut;
  const requete = construireRequete(params, { tri: colonne, sens: prochainSens });
  return (
    <th className={`px-3 py-2 ${droite ? "text-right" : ""}`}>
      <Link
        href={`${chemin}?${requete}`}
        className={`inline-flex items-center gap-1 hover:text-slate-900 ${
          actif ? "text-slate-900" : ""
        }`}
      >
        {children}
        <span aria-hidden className="text-[10px]">
          {actif ? (sens === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </Link>
    </th>
  );
}
