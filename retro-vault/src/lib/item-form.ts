// Validation du formulaire exemplaire (ajout / édition), partagée par les server actions.

import { z } from "zod";
import { Completeness, Grade, ProductKind, Region } from "./catalog";
import { parseEurosToCents } from "./money";

const text = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() !== "" ? v.trim() : undefined), z.string().max(max).optional());
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(min).max(max).optional());
const optGrade = z.preprocess((v) => (v === "" ? undefined : v), z.enum(Grade).optional());
const euros = (label: string) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()).transform((v, ctx) => {
    if (v === undefined) return null;
    const cents = parseEurosToCents(v);
    if (cents == null) ctx.addIssue({ code: "custom", message: `${label} : montant invalide` });
    return cents;
  });

export const ItemFormSchema = z
  .object({
    kind: z.enum(ProductKind),
    platformId: z.string().min(1, "Choisissez une plateforme"),
    title: z.string().trim().min(1, "Titre obligatoire").max(200),
    igdbId: optInt(1, 10_000_000),
    coverUrl: z.preprocess((v) => (v === "" ? undefined : v), z.url().optional()),
    releaseYear: optInt(1970, 2100),
    developer: text(200),
    publisher: text(200),
    summary: text(5000),
    genres: z.preprocess(
      (v) => (typeof v === "string" && v ? v.split("|").map((g) => g.trim()).filter(Boolean) : []),
      z.array(z.string().max(80)).max(20)
    ),
    region: z.enum(Region),
    completeness: z.enum(Completeness),
    boxGrade: optGrade,
    manualGrade: optGrade,
    mediaGrade: optGrade,
    boxScore: optInt(1, 10),
    manualScore: optInt(1, 10),
    mediaScore: optInt(1, 10),
    acquiredAt: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((s) => new Date(`${s}T00:00:00Z`)).optional()
    ),
    purchase: euros("Prix d'achat"),
    manualValue: euros("Valeur manuelle"),
    notes: text(2000),
  })
  .transform((v) => {
    // Composants sans objet selon le format : un loose n'a ni boîte ni notice.
    const hasBox = v.completeness !== "LOOSE";
    const hasManual = v.completeness === "CIB";
    const hasMedia = v.completeness !== "SEALED";
    return {
      ...v,
      boxGrade: hasBox ? v.boxGrade : undefined,
      boxScore: hasBox ? v.boxScore : undefined,
      manualGrade: hasManual ? v.manualGrade : undefined,
      manualScore: hasManual ? v.manualScore : undefined,
      mediaGrade: hasMedia ? v.mediaGrade : undefined,
      mediaScore: hasMedia ? v.mediaScore : undefined,
    };
  });

export type ItemFormValues = z.infer<typeof ItemFormSchema>;

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> } | undefined;

export function parseItemForm(formData: FormData) {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const result = ItemFormSchema.safeParse(raw);
  if (result.success) return { data: result.data } as const;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { state: { error: "Vérifiez les champs signalés.", fieldErrors } satisfies FormState } as const;
}
