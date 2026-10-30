"use client";

// Formulaire exemplaire (ajout / édition) : recherche IGDB, format Loose/CIB/Neuf,
// état des composants, achat, photos.

import { useActionState, useEffect, useId, useState } from "react";
import {
  COMPLETENESS_LABELS,
  COMPLETENESS_VALUES,
  GRADE_LABELS,
  GRADE_VALUES,
  KIND_LABELS,
  KIND_VALUES,
  REGION_LABELS,
  REGION_VALUES,
  type Completeness,
  type Grade,
  type ProductKind,
  type Region,
} from "@/lib/catalog";
import type { FormState } from "@/lib/item-form";
import type { GameSearchResponse, GameSuggestion } from "@/app/api/igdb/search/route";
import { Button, Cover, Field, Input, Select, cn, inputClass } from "./ui";

export type PlatformOption = { id: string; slug: string; name: string; shortName: string; manufacturer: string };

export type ItemFormInitial = {
  kind: ProductKind;
  platformId: string;
  game: Omit<GameSuggestion, "source"> | null;
  title: string;
  region: Region;
  completeness: Completeness;
  boxGrade: Grade | null;
  manualGrade: Grade | null;
  mediaGrade: Grade | null;
  boxScore: number | null;
  manualScore: number | null;
  mediaScore: number | null;
  acquiredAt: string; // AAAA-MM-JJ
  purchase: string; // euros
  manualValue: string;
  notes: string;
};

export const EMPTY_ITEM: ItemFormInitial = {
  kind: "GAME",
  platformId: "",
  game: null,
  title: "",
  region: "PAL",
  completeness: "CIB",
  boxGrade: null,
  manualGrade: null,
  mediaGrade: null,
  boxScore: null,
  manualScore: null,
  mediaScore: null,
  acquiredAt: "",
  purchase: "",
  manualValue: "",
  notes: "",
};

type Props = {
  platforms: PlatformOption[];
  initial?: ItemFormInitial;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
};

export function ItemForm({ platforms, initial = EMPTY_ITEM, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [kind, setKind] = useState(initial.kind);
  const [platformId, setPlatformId] = useState(initial.platformId);
  const [completeness, setCompleteness] = useState(initial.completeness);
  const [game, setGame] = useState(initial.game);
  const [title, setTitle] = useState(initial.title);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(initial.manualValue));
  const errors = state?.fieldErrors ?? {};
  const platform = platforms.find((p) => p.id === platformId);

  const byManufacturer = platforms.reduce<Record<string, PlatformOption[]>>((acc, p) => {
    (acc[p.manufacturer] ??= []).push(p);
    return acc;
  }, {});

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. Quoi ? */}
      <fieldset className="space-y-4">
        <Segmented
          name="kind"
          label="Type"
          value={kind}
          onChange={(v) => setKind(v as ProductKind)}
          options={KIND_VALUES.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
        />

        <Field label="Plateforme" htmlFor="platformId">
          <Select id="platformId" name="platformId" required value={platformId} onChange={(e) => setPlatformId(e.target.value)}>
            <option value="">Choisir…</option>
            {Object.entries(byManufacturer).map(([manufacturer, list]) => (
              <optgroup key={manufacturer} label={manufacturer}>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <FieldError message={errors.platformId} />
        </Field>

        <GameSearch
          platformSlug={platform?.slug ?? null}
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
          searchEnabled={kind === "GAME"}
        />
        <FieldError message={errors.title} />
        <GameHiddenFields game={game} />
      </fieldset>

      {/* 2. Quel exemplaire ? */}
      <fieldset className="space-y-4">
        <Segmented
          name="region"
          label="Région"
          value={undefined}
          defaultValue={initial.region}
          options={REGION_VALUES.map((r) => ({ value: r, label: REGION_LABELS[r] }))}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-2">Format</p>
          <div role="radiogroup" aria-label="Format" className="grid grid-cols-3 gap-2">
            {COMPLETENESS_VALUES.map((c) => (
              <label
                key={c}
                className={cn(
                  "cursor-pointer rounded-xl border p-3 text-center transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                  completeness === c ? "border-accent bg-accent/10" : "border-line bg-surface-2"
                )}
              >
                <input
                  type="radio"
                  name="completeness"
                  value={c}
                  checked={completeness === c}
                  onChange={() => setCompleteness(c)}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold">{COMPLETENESS_LABELS[c].label}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-ink-3">{COMPLETENESS_LABELS[c].hint}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-line p-3">
          <p className="text-sm font-medium text-ink-2">État des composants</p>
          {completeness !== "LOOSE" && (
            <GradeInput name="box" label={completeness === "SEALED" ? "Blister / boîte" : "Boîte"} grade={initial.boxGrade} score={initial.boxScore} />
          )}
          {completeness === "CIB" && <GradeInput name="manual" label="Notice" grade={initial.manualGrade} score={initial.manualScore} />}
          {completeness !== "SEALED" && (
            <GradeInput
              name="media"
              label={kind === "GAME" ? "Cartouche / disque" : "Appareil"}
              grade={initial.mediaGrade}
              score={initial.mediaScore}
            />
          )}
          <p className="text-xs text-ink-3">La note /10 (facultative) affine l&apos;estimation et prime sur l&apos;état.</p>
        </div>
      </fieldset>

      {/* 3. Achat */}
      <fieldset className="grid grid-cols-2 gap-3">
        <Field label="Date d'acquisition" htmlFor="acquiredAt">
          <Input id="acquiredAt" name="acquiredAt" type="date" defaultValue={initial.acquiredAt} max={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Prix d'achat (€)" htmlFor="purchase">
          <Input id="purchase" name="purchase" inputMode="decimal" placeholder="0,00" defaultValue={initial.purchase} />
          <FieldError message={errors.purchase} />
        </Field>
      </fieldset>

      <Field label="Photos de votre exemplaire" htmlFor="photos" hint="Jusqu'à 4 photos (JPEG, PNG, WebP, HEIC — 8 Mo max).">
        <PhotoPicker />
      </Field>

      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" rows={3} defaultValue={initial.notes} className={cn(inputClass, "py-2")} placeholder="Variante, provenance, défauts…" />
      </Field>

      <div>
        <button type="button" onClick={() => setShowAdvanced((v) => !v)} className="text-sm text-accent" aria-expanded={showAdvanced}>
          {showAdvanced ? "▾" : "▸"} Valeur manuelle
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <Field label="Valeur estimée manuelle (€)" htmlFor="manualValue" hint="Prime sur la cote automatique (variante rare, pièce gradée…).">
              <Input id="manualValue" name="manualValue" inputMode="decimal" defaultValue={initial.manualValue} />
              <FieldError message={errors.manualValue} />
            </Field>
          </div>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-bad/10 p-3 text-sm text-bad">
          {state.error}
        </p>
      )}

      <div className="sticky bottom-24 z-10 md:bottom-4">
        <Button type="submit" disabled={pending} className="w-full shadow-lg shadow-black/40">
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-bad">{message}</p> : null;
}

function Segmented({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-2">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-surface-2 p-1">
        {options.map((o) => (
          <label key={o.value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={o.value}
              className="peer sr-only"
              {...(value !== undefined ? { checked: value === o.value, onChange: () => onChange?.(o.value) } : { defaultChecked: defaultValue === o.value })}
            />
            <span className="flex min-h-9 cursor-pointer items-center justify-center rounded-lg text-sm text-ink-3 transition peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function GradeInput({ name, label, grade, score }: { name: string; label: string; grade: Grade | null; score: number | null }) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-xs text-ink-3 sm:w-32">{label}</span>
      <div role="radiogroup" aria-label={`État ${label}`} className="flex flex-1 gap-1">
        {GRADE_VALUES.map((g) => (
          <label key={g} className="flex-1">
            <input type="radio" name={`${name}Grade`} value={g} defaultChecked={grade === g} className="peer sr-only" />
            <span className="flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-line px-1 text-[11px] text-ink-3 transition peer-checked:border-accent peer-checked:bg-accent/10 peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
              {GRADE_LABELS[g]}
            </span>
          </label>
        ))}
      </div>
      <label htmlFor={id} className="sr-only">
        Note {label} sur 10
      </label>
      <select id={id} name={`${name}Score`} defaultValue={score ?? ""} className="min-h-9 rounded-lg border border-line bg-surface-2 px-2 text-xs text-ink-2">
        <option value="">/10</option>
        {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
          <option key={n} value={n}>
            {n}/10
          </option>
        ))}
      </select>
    </div>
  );
}

export function GameHiddenFields({ game }: { game: Omit<GameSuggestion, "source"> | null }) {
  return (
    <>
      <input type="hidden" name="igdbId" value={game?.igdbId || ""} />
      <input type="hidden" name="coverUrl" value={game?.coverUrl ?? ""} />
      <input type="hidden" name="releaseYear" value={game?.releaseYear ?? ""} />
      <input type="hidden" name="developer" value={game?.developer ?? ""} />
      <input type="hidden" name="publisher" value={game?.publisher ?? ""} />
      <input type="hidden" name="genres" value={game?.genres.join("|") ?? ""} />
      <input type="hidden" name="summary" value={game?.summary ?? ""} />
    </>
  );
}

/** Champ titre avec auto-complétion (IGDB + fiches locales), navigable au clavier. */
export function GameSearch({
  platformSlug,
  title,
  onTitleChange,
  selected,
  onSelect,
  searchEnabled,
}: {
  platformSlug: string | null;
  title: string;
  onTitleChange: (t: string) => void;
  selected: Omit<GameSuggestion, "source"> | null;
  onSelect: (g: GameSuggestion) => void;
  searchEnabled: boolean;
}) {
  const listId = useId();
  const [results, setResults] = useState<GameSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const query = title.trim();
  // Pas de recherche tant que le titre affiché est celui de la fiche choisie.
  const shouldSearch = searchEnabled && query.length >= 2 && selected?.title !== title;
  const visible = shouldSearch ? results : [];

  useEffect(() => {
    if (!shouldSearch) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, ...(platformSlug && { platform: platformSlug }) });
        const res = await fetch(`/api/igdb/search?${params}`, { signal: controller.signal });
        const json = (await res.json()) as GameSearchResponse;
        setResults(json.results);
        setActive(-1);
        setOpen(true);
        setNotice(json.error ?? (json.igdb ? null : "IGDB non configuré : saisie libre (seules les fiches déjà connues sont proposées)."));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setNotice("Recherche indisponible, saisie libre possible.");
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, platformSlug, shouldSearch]);

  function choose(g: GameSuggestion) {
    onSelect(g);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <label htmlFor="title" className="block text-sm font-medium text-ink-2">
        Titre
      </label>
      <div className="relative">
        <Input
          id="title"
          name="title"
          required
          autoComplete="off"
          role="combobox"
          aria-expanded={open && visible.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          placeholder={searchEnabled ? "Ex. Chrono Trigger" : "Ex. Super Nintendo PAL + 2 manettes"}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onFocus={() => visible.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || visible.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % visible.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i <= 0 ? visible.length - 1 : i - 1));
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              choose(visible[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">…</span>}
        {open && visible.length > 0 && (
          <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/50">
            {visible.map((g, i) => (
              <li
                key={`${g.source}-${g.igdbId}-${g.title}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(g)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-lg p-2", i === active ? "bg-surface-2" : "hover:bg-surface-2")}
              >
                <Cover src={g.coverUrl} title={g.title} className="h-12 w-9 shrink-0 text-xs" />
                <span className="min-w-0">
                  <span className="block truncate text-sm">{g.title}</span>
                  <span className="block truncate text-xs text-ink-3">
                    {[g.releaseYear, g.developer, g.source === "local" ? "déjà en base" : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {notice && <p className="text-xs text-ink-3">{notice}</p>}
      {selected && (
        <div className="flex gap-3 rounded-xl bg-surface-2 p-3">
          <Cover src={selected.coverUrl} title={selected.title} className="h-24 w-[72px] shrink-0" />
          <div className="min-w-0 text-xs text-ink-3">
            <p className="text-sm font-medium text-ink">{selected.title}</p>
            <p>{[selected.releaseYear, selected.developer, selected.publisher].filter(Boolean).join(" · ")}</p>
            {selected.genres.length > 0 && <p className="mt-1">{selected.genres.join(", ")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoPicker() {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  return (
    <div className="space-y-2">
      <input
        id="photos"
        name="photos"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={(e) => setPreviews([...(e.target.files ?? [])].slice(0, 4).map((f) => URL.createObjectURL(f)))}
        className="block w-full text-sm text-ink-3 file:mr-3 file:min-h-10 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:text-ink"
      />
      {previews.length > 0 && (
        <div className="flex gap-2">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="Aperçu" className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
