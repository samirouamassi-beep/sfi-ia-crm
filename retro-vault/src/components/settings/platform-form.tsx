"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/item-form";
import { Button, Field, Input } from "../ui";

export type PlatformValues = {
  name: string;
  shortName: string;
  manufacturer: string;
  releaseYear: number | null;
  igdbId: number | null;
  priceChartingName: string | null;
  active: boolean;
};

export function PlatformForm({
  initial,
  manufacturers,
  action,
  submitLabel,
}: {
  initial?: PlatformValues;
  manufacturers: string[];
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const err = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nom" htmlFor="name">
        <Input id="name" name="name" required defaultValue={initial?.name} placeholder="Ex. Nintendo Virtual Boy" />
        <FieldError message={err.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Abréviation" htmlFor="shortName" hint="Affichée sur les badges.">
          <Input id="shortName" name="shortName" required maxLength={12} defaultValue={initial?.shortName} placeholder="VB" />
          <FieldError message={err.shortName} />
        </Field>
        <Field label="Année de sortie" htmlFor="releaseYear">
          <Input id="releaseYear" name="releaseYear" inputMode="numeric" defaultValue={initial?.releaseYear ?? ""} placeholder="1995" />
          <FieldError message={err.releaseYear} />
        </Field>
      </div>
      <Field label="Constructeur" htmlFor="manufacturer" hint="Sert à regrouper les consoles dans la liste de choix.">
        <Input id="manufacturer" name="manufacturer" required list="manufacturers" defaultValue={initial?.manufacturer} placeholder="Nintendo" />
        <datalist id="manufacturers">
          {manufacturers.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <FieldError message={err.manufacturer} />
      </Field>

      <details className="rounded-2xl border border-line p-3" open={Boolean(initial?.igdbId || initial?.priceChartingName)}>
        <summary className="cursor-pointer text-sm text-ink-2">Liens avec les services externes (facultatif)</summary>
        <div className="mt-3 space-y-4">
          <Field label="Identifiant plateforme IGDB" htmlFor="igdbId" hint="Filtre l'auto-complétion sur cette console (ex. 87 pour la Virtual Boy).">
            <Input id="igdbId" name="igdbId" inputMode="numeric" defaultValue={initial?.igdbId ?? ""} />
            <FieldError message={err.igdbId} />
          </Field>
          <Field label="Nom côté PriceCharting" htmlFor="priceChartingName" hint="Nom de la console NTSC-U sur PriceCharting ; « PAL » / « JP » est ajouté selon la région.">
            <Input id="priceChartingName" name="priceChartingName" defaultValue={initial?.priceChartingName ?? ""} placeholder="Virtual Boy" />
          </Field>
        </div>
      </details>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-5 w-5 accent-[var(--color-accent-strong)]" />
        Proposer cette console dans les formulaires
      </label>

      {state?.error && <p role="alert" className="rounded-xl bg-bad/10 p-3 text-sm text-bad">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-bad">{message}</p> : null;
}
