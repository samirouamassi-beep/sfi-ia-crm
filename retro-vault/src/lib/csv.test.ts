import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, toCsv } from "./csv";

test("aller-retour CSV avec guillemets, virgules et retours ligne", () => {
  const csv = toCsv(["title", "notes"], [["Zelda, A Link to the Past", 'Boîte "Player\'s Choice"\nnotice FR']]);
  assert.deepEqual(parseCsv(csv), [{ title: "Zelda, A Link to the Past", notes: 'Boîte "Player\'s Choice"\nnotice FR' }]);
});

test("séparateur point-virgule (Excel FR) et BOM", () => {
  assert.deepEqual(parseCsv("﻿Title;Purchase_EUR\nSonic;12,5\n\n"), [{ title: "Sonic", purchase_eur: "12,5" }]);
});

test("neutralise les formules mais pas les nombres négatifs", () => {
  assert.equal(toCsv(["a", "b"], [["=HYPERLINK(1)", -5]]), "a,b\r\n'=HYPERLINK(1),-5\r\n");
});
