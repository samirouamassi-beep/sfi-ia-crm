"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Input, Select } from "./ui";

type Option = { value: string; label: string };

/** `omitWhen` : valeur par défaut, laissée hors de l'URL (ex. tri « ajout récent »). */
export type FilterDef = { name: string; label: string; options: Option[]; value: string | null; omitWhen?: string };

/** Cases à cocher en pastilles (choix multiple) ; aucune valeur = tout coché. */
export type ToggleDef = { name: string; label: string; options: Option[]; values: string[] };

/**
 * Filtres portés par l'URL (navigation client vers ?q=…&platform=…) : partageables,
 * compatibles retour arrière, rendus côté serveur. Les champs vides sont omis de l'URL.
 */
export function FilterBar({ action, q, filters, toggles }: { action: string; q: string; filters: FilterDef[]; toggles?: ToggleDef }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const checked: string[] = [];
    for (const [key, value] of new FormData(e.currentTarget)) {
      if (typeof value !== "string" || value === "") continue;
      if (filters.some((f) => f.name === key && f.omitWhen === value)) continue;
      if (key === toggles?.name) checked.push(value);
      else params.set(key, value);
    }
    // Pastilles en un seul paramètre (kind=CONSOLE,ACCESSORY) : le cache du routeur Next
    // confond les URL à paramètres répétés. Toutes cochées = pas de filtre.
    if (toggles && checked.length > 0 && checked.length < toggles.options.length) params.set(toggles.name, checked.join(","));
    const query = params.toString();
    router.push(query ? `${action}?${query}` : action, { scroll: false });
  };
  const active = filters.filter((f) => f.value && f.name !== "sort").length + (q ? 1 : 0) + (toggles?.values.length ? 1 : 0);

  const boxes = () => [...(form.current?.querySelectorAll<HTMLInputElement>(`input[name="${toggles?.name}"]`) ?? [])];
  /** Une case décochée : on garde au moins un choix coché. */
  const onToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!boxes().some((b) => b.checked)) e.target.checked = true;
    submit();
  };
  const checkAll = () => {
    boxes().forEach((b) => (b.checked = true));
    submit();
  };
  const allChecked = !toggles || toggles.values.length === 0;

  return (
    <form ref={form} onSubmit={onSubmit} className="mb-4 space-y-2" role="search">
      {toggles && (
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">{toggles.label}</legend>
          <button
            type="button"
            onClick={checkAll}
            aria-pressed={allChecked}
            className={`min-h-9 rounded-full border px-3 text-sm transition ${allChecked ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-3 hover:text-ink-2"}`}
          >
            Tout
          </button>
          {toggles.options.map((o) => (
            <label
              key={o.value}
              className="flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-sm text-ink-3 transition has-[:checked]:border-accent has-[:checked]:bg-accent/15 has-[:checked]:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
            >
              <input
                type="checkbox"
                name={toggles.name}
                value={o.value}
                defaultChecked={allChecked || toggles.values.includes(o.value)}
                onChange={onToggle}
                className="accent-[var(--color-accent-strong)]"
              />
              {o.label}
            </label>
          ))}
        </fieldset>
      )}
      <Input name="q" type="search" placeholder="Rechercher un titre…" defaultValue={q} aria-label="Rechercher un titre" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map((f) => (
          <Select
            key={f.name}
            name={f.name}
            defaultValue={f.value ?? ""}
            onChange={submit}
            aria-label={f.label}
            className="min-h-9 w-auto! shrink-0 rounded-full py-0 text-sm"
          >
            {f.name !== "sort" && <option value="">{f.label}</option>}
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
        {active > 0 && (
          <a href={action} className="flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm text-accent">
            Effacer ({active})
          </a>
        )}
      </div>
    </form>
  );
}
