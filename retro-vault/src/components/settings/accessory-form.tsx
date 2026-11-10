"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/item-form";
import { Button, Input } from "../ui";

/** Ajout (champ seul, vidé après succès) ou édition (nom + affichage). */
export function AccessoryTypeForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: { name: string; active: boolean };
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-2">
        <Input name="name" required maxLength={60} defaultValue={initial?.name} placeholder="Ex. Câble composante" aria-label="Nom du type d'accessoire" />
        {!initial && (
          <Button type="submit" disabled={pending} className="shrink-0">
            {submitLabel}
          </Button>
        )}
      </div>
      {initial && (
        <>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="active" defaultChecked={initial.active} className="h-5 w-5 accent-[var(--color-accent-strong)]" />
            Proposer ce type dans le formulaire d&apos;ajout
          </label>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enregistrement…" : submitLabel}
          </Button>
        </>
      )}
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
    </form>
  );
}
