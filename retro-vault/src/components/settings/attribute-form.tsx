"use client";

import { useActionState, useState } from "react";
import type { AttributeDef } from "@/lib/attributes";
import { ATTRIBUTE_TYPE_LABELS, ATTRIBUTE_TYPE_VALUES, KIND_LABELS, KIND_VALUES, type AttributeType } from "@/lib/catalog";
import type { FormState } from "@/lib/item-form";
import { Button, Field, Input, cn, inputClass } from "../ui";

export function AttributeForm({
  initial,
  usage,
  action,
  submitLabel,
}: {
  initial?: AttributeDef & { active: boolean };
  /** Nombre d'exemplaires ayant une valeur (édition) : avertit avant un changement de type. */
  usage?: number;
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<AttributeType>(initial?.type ?? "BOOLEAN");
  const err = state?.fieldErrors ?? {};
  const typeChanged = Boolean(initial && usage && type !== initial.type);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nom" htmlFor="label">
        <Input id="label" name="label" required maxLength={60} defaultValue={initial?.label} placeholder="Ex. Avec notice" />
        {err.label && <p className="text-xs text-bad">{err.label}</p>}
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-medium text-ink-2">Type de saisie</p>
        <div role="radiogroup" aria-label="Type de saisie" className="grid grid-cols-2 gap-2">
          {ATTRIBUTE_TYPE_VALUES.map((t) => (
            <label
              key={t}
              className={cn(
                "cursor-pointer rounded-xl border p-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                type === t ? "border-accent bg-accent/10" : "border-line bg-surface-2"
              )}
            >
              <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
              <span className="block text-sm font-semibold">{ATTRIBUTE_TYPE_LABELS[t].label}</span>
              <span className="mt-0.5 block text-[11px] leading-tight text-ink-3">{ATTRIBUTE_TYPE_LABELS[t].hint}</span>
            </label>
          ))}
        </div>
        {typeChanged && (
          <p className="mt-2 text-xs text-bad">
            Changer de type efface les valeurs déjà saisies sur {usage} exemplaire{(usage ?? 0) > 1 ? "s" : ""}.
          </p>
        )}
      </div>

      {type === "SELECT" && (
        <Field label="Choix possibles" htmlFor="options" hint="Un choix par ligne (ou séparés par des virgules). Supprimer un choix efface les valeurs correspondantes.">
          <textarea
            id="options"
            name="options"
            rows={4}
            defaultValue={initial?.options.join("\n")}
            className={cn(inputClass, "py-2")}
            placeholder={"Standard\nPlayer's Choice\nCollector"}
          />
          {err.options && <p className="text-xs text-bad">{err.options}</p>}
        </Field>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink-2">Concerne</legend>
        <div className="flex flex-wrap gap-2">
          {KIND_VALUES.map((k) => (
            <label key={k} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10">
              <input type="checkbox" name="kinds" value={k} defaultChecked={initial ? initial.kinds.includes(k) : true} className="accent-[var(--color-accent-strong)]" />
              {KIND_LABELS[k]}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-ink-3">Aucune case cochée = tous les types.</p>
      </fieldset>

      {initial && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="active" defaultChecked={initial.active} className="h-5 w-5 accent-[var(--color-accent-strong)]" />
          Afficher dans le formulaire d&apos;ajout
        </label>
      )}

      {state?.error && <p role="alert" className="rounded-xl bg-bad/10 p-3 text-sm text-bad">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
