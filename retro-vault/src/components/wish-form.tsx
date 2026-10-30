"use client";

import { useActionState, useState } from "react";
import { COMPLETENESS_LABELS, COMPLETENESS_VALUES, REGION_LABELS, REGION_VALUES } from "@/lib/catalog";
import type { FormState } from "@/lib/item-form";
import type { GameSuggestion } from "@/app/api/igdb/search/route";
import { GameHiddenFields, GameSearch, type PlatformOption } from "./item-form";
import { Button, Field, Input, Select } from "./ui";

export function WishForm({ platforms, action }: { platforms: PlatformOption[]; action: (s: FormState, f: FormData) => Promise<FormState> }) {
  const [title, setTitle] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [game, setGame] = useState<Omit<GameSuggestion, "source"> | null>(null);
  // Le formulaire (champs non contrôlés) est réinitialisé par React après l'action ;
  // on vide aussi l'état contrôlé du titre en cas de succès.
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result?.ok) {
      setTitle("");
      setGame(null);
    }
    return result;
  }, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="kind" value="GAME" />
      <Field label="Plateforme" htmlFor="wish-platform">
        <Select id="wish-platform" name="platformId" required value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
          <option value="">Choisir…</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <GameSearch
        platformSlug={platforms.find((p) => p.id === platformId)?.slug ?? null}
        title={title}
        onTitleChange={(t) => {
          setTitle(t);
          if (game && t !== game.title) setGame(null);
        }}
        selected={game}
        onSelect={(g) => {
          setGame(g);
          setTitle(g.title);
        }}
        searchEnabled
      />
      <GameHiddenFields game={game} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Région" htmlFor="wish-region">
          <Select id="wish-region" name="region" defaultValue="PAL">
            {REGION_VALUES.map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Format visé" htmlFor="wish-completeness">
          <Select id="wish-completeness" name="completeness" defaultValue="CIB">
            {COMPLETENESS_VALUES.map((c) => (
              <option key={c} value={c}>
                {COMPLETENESS_LABELS[c].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prix cible (€)" htmlFor="wish-target">
          <Input id="wish-target" name="target" inputMode="decimal" placeholder="0,00" />
        </Field>
        <Field label="Priorité" htmlFor="wish-priority">
          <Select id="wish-priority" name="priority" defaultValue="2">
            <option value="1">Haute</option>
            <option value="2">Normale</option>
            <option value="3">Basse</option>
          </Select>
        </Field>
      </div>
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Ajout…" : "Ajouter à la wishlist"}
      </Button>
    </form>
  );
}
