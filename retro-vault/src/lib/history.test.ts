import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTimeline, computeMovers, monthEnds, PriceIndex, type Snapshot, type ValuedItem } from "./history";

const snap = (date: string, loose: number, region: Snapshot["region"] = "NTSC_U"): Snapshot => ({
  productId: "p1",
  region,
  capturedAt: new Date(date),
  looseCents: loose,
  cibCents: loose * 3,
  sealedCents: null,
});

const index = new PriceIndex([snap("2026-03-01", 3000), snap("2026-01-01", 1000), snap("2026-02-01", 2000)]);

const item: ValuedItem = {
  id: "i1",
  productId: "p1",
  region: "PAL",
  completeness: "LOOSE",
  acquiredAt: new Date("2026-01-15"),
  createdAt: new Date("2026-06-01"),
  purchaseCents: 1500,
};

test("cote à date : dernière cote antérieure, repli NTSC-U", () => {
  assert.equal(index.quoteAt("p1", "PAL", new Date("2026-02-15"))?.looseCents, 2000);
  assert.equal(index.quoteAt("p1", "NTSC_U", new Date("2025-12-31")), null);
  const withPal = new PriceIndex([snap("2026-01-01", 1000), snap("2026-01-01", 1800, "PAL")]);
  assert.equal(withPal.quoteAt("p1", "PAL", new Date("2026-02-01"))?.looseCents, 1800);
});

test("fins de mois", () => {
  const d = monthEnds(new Date(2026, 0, 10), new Date(2026, 2, 5));
  assert.deepEqual(d.map((x) => [x.getMonth(), x.getDate()]), [[0, 31], [1, 28], [2, 5]]);
});

test("courbe valeur / investissement", () => {
  const points = buildTimeline([item], index, [new Date("2026-01-10"), new Date("2026-02-10"), new Date("2026-03-10")]);
  assert.deepEqual(
    points.map((p) => [p.valueCents, p.investedCents]),
    [[0, 0], [2000, 1500], [3000, 1500]]
  );
});

test("plus fortes variations", () => {
  const movers = computeMovers([item], index, new Date("2026-01-20"), new Date("2026-03-20"));
  assert.equal(movers.length, 1);
  assert.equal(movers[0].deltaCents, 2000);
  assert.equal(movers[0].ratio, 2);
  assert.equal(computeMovers([{ ...item, manualValueCents: 1 }], index, new Date("2026-01-20"), new Date()).length, 0);
});
