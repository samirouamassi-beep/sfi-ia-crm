"use client";

// Carte « Vente » de la fiche exemplaire : en collection / à vendre / vendu.

import { useActionState, useState } from "react";
import { SALE_CHANNELS, STATUS_LABELS, STATUS_VALUES, type ItemStatus } from "@/lib/catalog";
import type { FormState } from "@/lib/item-form";
import { Button, Field, Input, cn } from "./ui";

export type SaleInitial = {
  status: ItemStatus;
  asking: string;
  soldAt: string;
  salePrice: string;
  saleFees: string;
  saleChannel: string;
};

export function SaleForm({ initial, action }: { initial: SaleInitial; action: (s: FormState, f: FormData) => Promise<FormState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [status, setStatus] = useState<ItemStatus>(initial.status);
  const err = state?.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <div role="radiogroup" aria-label="Statut" className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {STATUS_VALUES.map((s) => (
          <label key={s} className="flex-1">
            <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="peer sr-only" />
            <span
              className={cn(
                "flex min-h-9 cursor-pointer items-center justify-center rounded-lg text-sm text-ink-3 transition peer-focus-visible:outline-2 peer-focus-visible:outline-accent",
                status === s && "bg-surface text-ink shadow"
              )}
            >
              {STATUS_LABELS[s]}
            </span>
          </label>
        ))}
      </div>

      {status === "FOR_SALE" && (
        <Field label="Prix demandé (€)" htmlFor="asking">
          <Input id="asking" name="asking" inputMode="decimal" defaultValue={initial.asking} placeholder="0,00" />
          {err.asking && <p className="text-xs text-bad">{err.asking}</p>}
        </Field>
      )}

      {status === "SOLD" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Vendu le" htmlFor="soldAt">
            <Input id="soldAt" name="soldAt" type="date" required max={today} defaultValue={initial.soldAt || today} />
            {err.soldAt && <p className="text-xs text-bad">{err.soldAt}</p>}
          </Field>
          <Field label="Prix de vente (€)" htmlFor="salePrice">
            <Input id="salePrice" name="salePrice" inputMode="decimal" required defaultValue={initial.salePrice} placeholder="0,00" />
            {err.salePrice && <p className="text-xs text-bad">{err.salePrice}</p>}
          </Field>
          <Field label="Frais (€)" htmlFor="saleFees" hint="Commission, port à votre charge…">
            <Input id="saleFees" name="saleFees" inputMode="decimal" defaultValue={initial.saleFees} placeholder="0,00" />
            {err.saleFees && <p className="text-xs text-bad">{err.saleFees}</p>}
          </Field>
          <Field label="Vendu sur" htmlFor="saleChannel">
            <Input id="saleChannel" name="saleChannel" list="sale-channels" defaultValue={initial.saleChannel} placeholder="eBay, Leboncoin…" />
            <datalist id="sale-channels">
              {SALE_CHANNELS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>
      )}

      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      {state?.ok && !pending && <p role="status" className="text-sm text-good">✓ Enregistré</p>}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
