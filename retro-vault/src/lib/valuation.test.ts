import { test } from "node:test";
import assert from "node:assert/strict";
import { basePriceCents, conditionFactor, estimateValueCents, gain, scoreFactor } from "./valuation";

const quote = { looseCents: 2000, cibCents: 6000, sealedCents: 30000, boxOnlyCents: 2500, manualOnlyCents: 800 };

test("cote de base selon le format", () => {
  assert.equal(basePriceCents(quote, "LOOSE"), 2000);
  assert.equal(basePriceCents(quote, "CIB"), 6000);
  assert.equal(basePriceCents(quote, "SEALED"), 30000);
});

test("CIB reconstitué à partir des composants quand la cote CIB manque", () => {
  assert.equal(basePriceCents({ ...quote, cibCents: null }, "CIB"), 2000 + 2500 + 800);
  assert.equal(basePriceCents({ ...quote, cibCents: null, boxOnlyCents: null }, "CIB"), null);
});

test("sans information d'état, la cote est prise telle quelle", () => {
  assert.equal(conditionFactor({ completeness: "CIB" }), 1);
  assert.equal(estimateValueCents({ completeness: "CIB" }, quote), 6000);
});

test("une boîte abîmée pèse plus qu'une notice abîmée", () => {
  const badBox = estimateValueCents({ completeness: "CIB", boxGrade: "POOR" }, quote)!;
  const badManual = estimateValueCents({ completeness: "CIB", manualGrade: "POOR" }, quote)!;
  assert.ok(badBox < badManual);
  assert.equal(badBox, Math.round(6000 * (0.5 * 0.6 + 0.15 + 0.35)));
});

test("la note /10 prime sur l'état qualitatif", () => {
  const v = estimateValueCents({ completeness: "LOOSE", mediaGrade: "MINT", mediaScore: 1 }, quote);
  assert.equal(v, Math.round(2000 * scoreFactor(1)));
  assert.equal(scoreFactor(10), 1.15);
  assert.equal(scoreFactor(42), 1.15);
});

test("la valeur manuelle prime, même sans cote", () => {
  assert.equal(estimateValueCents({ completeness: "LOOSE", manualValueCents: 12345 }, null), 12345);
  assert.equal(estimateValueCents({ completeness: "LOOSE" }, null), null);
});

test("plus-value et ROI", () => {
  assert.deepEqual(gain(15000, 10000), { deltaCents: 5000, ratio: 0.5 });
  assert.deepEqual(gain(15000, 0), { deltaCents: 15000, ratio: null });
  assert.deepEqual(gain(null, 10000), { deltaCents: null, ratio: null });
});
