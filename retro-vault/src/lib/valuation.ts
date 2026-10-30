// Valorisation d'un exemplaire à partir d'une cote (logique pure, testée dans valuation.test.ts).
//
// 1. Cote de base selon le format : Loose / CIB / Neuf scellé.
//    CIB absent mais loose + boîte seule + notice seule disponibles => somme des trois.
// 2. Ajustement selon l'état des composants : chaque composant pondère la cote selon son état
//    (note /10 prioritaire sur l'état qualitatif). Sans info d'état => coefficient 1.
// 3. Une valeur saisie à la main prime toujours sur la cote.

import type { Completeness, Grade } from "@/generated/prisma/enums";

export type PriceQuote = {
  looseCents: number | null;
  cibCents: number | null;
  sealedCents: number | null;
  boxOnlyCents?: number | null;
  manualOnlyCents?: number | null;
};

export type ItemCondition = {
  completeness: Completeness;
  boxGrade?: Grade | null;
  manualGrade?: Grade | null;
  mediaGrade?: Grade | null;
  boxScore?: number | null;
  manualScore?: number | null;
  mediaScore?: number | null;
  manualValueCents?: number | null;
};

/** Coefficient appliqué à la cote "référence" (= exemplaire en très bon état). */
export const GRADE_FACTOR: Record<Grade, number> = {
  POOR: 0.6,
  GOOD: 0.85,
  VERY_GOOD: 1,
  MINT: 1.15,
};

/** Poids de chaque composant dans la valeur d'un CIB. */
export const CIB_WEIGHTS = { box: 0.5, manual: 0.15, media: 0.35 } as const;

/** Note /10 -> coefficient, aligné sur l'échelle qualitative (10 = 1,15 ; 8 ≈ 1 ; 1 ≈ 0,56). */
export function scoreFactor(score: number): number {
  const s = Math.min(10, Math.max(1, Math.round(score)));
  return 0.5 + s * 0.065;
}

function componentFactor(grade?: Grade | null, score?: number | null): number {
  if (score != null) return scoreFactor(score);
  if (grade) return GRADE_FACTOR[grade];
  return 1;
}

export function basePriceCents(quote: PriceQuote, completeness: Completeness): number | null {
  switch (completeness) {
    case "LOOSE":
      return quote.looseCents;
    case "CIB":
      if (quote.cibCents != null) return quote.cibCents;
      if (quote.looseCents != null && quote.boxOnlyCents != null && quote.manualOnlyCents != null) {
        return quote.looseCents + quote.boxOnlyCents + quote.manualOnlyCents;
      }
      return null;
    case "SEALED":
      return quote.sealedCents;
  }
}

export function conditionFactor(c: ItemCondition): number {
  switch (c.completeness) {
    case "LOOSE":
      return componentFactor(c.mediaGrade, c.mediaScore);
    case "CIB":
      return (
        CIB_WEIGHTS.box * componentFactor(c.boxGrade, c.boxScore) +
        CIB_WEIGHTS.manual * componentFactor(c.manualGrade, c.manualScore) +
        CIB_WEIGHTS.media * componentFactor(c.mediaGrade, c.mediaScore)
      );
    case "SEALED":
      // Sur un neuf, seul l'état du blister / de la boîte compte, avec une amplitude réduite.
      return 1 + (componentFactor(c.boxGrade, c.boxScore) - 1) * 0.5;
  }
}

/** Valeur estimée en centimes, ou null si aucune cote ni valeur manuelle. */
export function estimateValueCents(c: ItemCondition, quote: PriceQuote | null): number | null {
  if (c.manualValueCents != null) return c.manualValueCents;
  if (!quote) return null;
  const base = basePriceCents(quote, c.completeness);
  if (base == null) return null;
  return Math.round(base * conditionFactor(c));
}

export function gain(valueCents: number | null, purchaseCents: number | null) {
  if (valueCents == null || purchaseCents == null) return { deltaCents: null, ratio: null };
  const deltaCents = valueCents - purchaseCents;
  return { deltaCents, ratio: purchaseCents > 0 ? deltaCents / purchaseCents : null };
}
