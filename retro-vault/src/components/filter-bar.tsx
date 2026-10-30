"use client";

import Form from "next/form";
import { useRef } from "react";
import { Input, Select } from "./ui";

type Option = { value: string; label: string };

export type FilterDef = { name: string; label: string; options: Option[]; value: string | null };

/**
 * Filtres portés par l'URL (formulaire GET + navigation client next/form) :
 * partageables, compatibles retour arrière, rendus côté serveur.
 */
export function FilterBar({ action, q, filters }: { action: string; q: string; filters: FilterDef[] }) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();
  const active = filters.filter((f) => f.value && f.name !== "sort").length + (q ? 1 : 0);

  return (
    <Form ref={form} action={action} className="mb-4 space-y-2" role="search">
      <Input name="q" type="search" placeholder="Rechercher un titre…" defaultValue={q} aria-label="Rechercher un titre" />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map((f) => (
          <Select
            key={f.name}
            name={f.name}
            defaultValue={f.value ?? ""}
            onChange={submit}
            aria-label={f.label}
            className="min-h-9 w-auto shrink-0 rounded-full py-0 text-sm"
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
    </Form>
  );
}
