// Caractéristiques personnalisées des exemplaires (« Avec notice », « Édition »…) :
// définies par le collectionneur dans Plus → Caractéristiques, saisies dans le formulaire.
// Lecture/validation des valeurs : logique pure, testée dans attributes.test.ts.

import type { AttributeType, ProductKind } from "@/generated/prisma/enums";

export type AttributeDef = {
  id: string;
  label: string;
  type: AttributeType;
  options: string[];
  kinds: ProductKind[];
};

export const ATTRIBUTE_FIELD_PREFIX = "attr_";
export const MAX_TEXT_LENGTH = 200;

/** Caractéristiques proposées en un clic dans l'écran de paramétrage. */
export const ATTRIBUTE_SUGGESTIONS: Omit<AttributeDef, "id">[] = [
  { label: "Avec notice", type: "BOOLEAN", options: [], kinds: ["GAME", "CONSOLE", "ACCESSORY"] },
  { label: "Avec cale", type: "BOOLEAN", options: [], kinds: ["GAME", "CONSOLE"] },
  { label: "Avec poster / goodies", type: "BOOLEAN", options: [], kinds: ["GAME"] },
  { label: "Carte d'enregistrement", type: "BOOLEAN", options: [], kinds: ["GAME", "CONSOLE"] },
  { label: "Édition", type: "SELECT", options: ["Standard", "Player's Choice", "Platinum", "Classics", "Collector"], kinds: ["GAME"] },
  { label: "Langue", type: "SELECT", options: ["FR", "EN", "JP", "Multi"], kinds: ["GAME"] },
  { label: "Câbles et alimentation", type: "BOOLEAN", options: [], kinds: ["CONSOLE"] },
  { label: "Nombre de manettes", type: "NUMBER", options: [], kinds: ["CONSOLE"] },
  { label: "N° de série", type: "TEXT", options: [], kinds: ["CONSOLE", "ACCESSORY"] },
];

/** Une caractéristique sans type de produit coché s'applique à tous. */
export function appliesTo(attr: Pick<AttributeDef, "kinds">, kind: ProductKind): boolean {
  return attr.kinds.length === 0 || attr.kinds.includes(kind);
}

/**
 * Normalise une saisie : chaîne stockée, null pour « pas de valeur » (supprime la ligne),
 * ou { error } si la saisie est invalide.
 */
export function normalizeValue(attr: AttributeDef, raw: unknown): string | null | { error: string } {
  const text = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
  switch (attr.type) {
    case "BOOLEAN": {
      if (text === "") return null;
      const t = text.toLowerCase();
      if (["on", "true", "1", "oui", "yes", "x"].includes(t)) return "true";
      if (["false", "0", "non", "no"].includes(t)) return null;
      return { error: `« ${attr.label} » : oui ou non attendu` };
    }
    case "SELECT": {
      if (text === "") return null;
      const match = attr.options.find((o) => o.toLowerCase() === text.toLowerCase());
      return match ?? { error: `« ${attr.label} » : valeur hors liste (${attr.options.join(", ")})` };
    }
    case "NUMBER": {
      if (text === "") return null;
      const n = Number(text.replace(",", "."));
      return Number.isFinite(n) ? String(n) : { error: `« ${attr.label} » : nombre attendu` };
    }
    case "TEXT":
      if (text === "") return null;
      return text.length > MAX_TEXT_LENGTH ? { error: `« ${attr.label} » : ${MAX_TEXT_LENGTH} caractères maximum` } : text;
  }
}

export type ParsedValues = { values: Map<string, string | null>; errors: Record<string, string> };

/** Lit les champs `attr_<id>` du formulaire pour les caractéristiques applicables au type. */
export function parseAttributeFields(formData: FormData, attributes: AttributeDef[], kind: ProductKind): ParsedValues {
  const result: ParsedValues = { values: new Map(), errors: {} };
  for (const attr of attributes) {
    const field = `${ATTRIBUTE_FIELD_PREFIX}${attr.id}`;
    // Hors du type de produit : valeur effacée (la caractéristique ne le concerne plus).
    const v = appliesTo(attr, kind) ? normalizeValue(attr, formData.get(field)) : null;
    if (v !== null && typeof v === "object") result.errors[field] = v.error;
    else result.values.set(attr.id, v);
  }
  return result;
}

export function formatValue(attr: Pick<AttributeDef, "type">, value: string): string {
  if (attr.type === "BOOLEAN") return value === "true" ? "Oui" : "Non";
  if (attr.type === "NUMBER") return Number(value).toLocaleString("fr-FR");
  return value;
}

/** Nettoie la liste d'options saisie (une par ligne ou séparées par des virgules). */
export function parseOptions(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(/[\n,;]/)
    .map((o) => o.trim())
    .filter((o) => o && o.length <= 60 && !seen.has(o.toLowerCase()) && seen.add(o.toLowerCase()));
}
