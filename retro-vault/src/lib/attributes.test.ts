import { test } from "node:test";
import assert from "node:assert/strict";
import { appliesTo, normalizeValue, parseAttributeFields, parseOptions, type AttributeDef } from "./attributes";

const notice: AttributeDef = { id: "a1", label: "Avec notice", type: "BOOLEAN", options: [], kinds: [] };
const edition: AttributeDef = { id: "a2", label: "Édition", type: "SELECT", options: ["Standard", "Collector"], kinds: ["GAME"] };
const pads: AttributeDef = { id: "a3", label: "Manettes", type: "NUMBER", options: [], kinds: ["CONSOLE"] };

test("case à cocher : coché, décoché, import oui/non", () => {
  assert.equal(normalizeValue(notice, "on"), "true");
  assert.equal(normalizeValue(notice, null), null);
  assert.equal(normalizeValue(notice, "Oui"), "true");
  assert.equal(normalizeValue(notice, "non"), null);
  assert.deepEqual(normalizeValue(notice, "peut-être"), { error: "« Avec notice » : oui ou non attendu" });
});

test("liste de choix insensible à la casse, valeur hors liste refusée", () => {
  assert.equal(normalizeValue(edition, "collector"), "Collector");
  assert.ok(typeof normalizeValue(edition, "Limitée") === "object");
});

test("nombre au format français", () => {
  assert.equal(normalizeValue(pads, "2"), "2");
  assert.equal(normalizeValue(pads, "1,5"), "1.5");
  assert.ok(typeof normalizeValue(pads, "deux") === "object");
});

test("seules les caractéristiques du type de produit sont lues", () => {
  assert.equal(appliesTo(notice, "CONSOLE"), true);
  assert.equal(appliesTo(edition, "CONSOLE"), false);
  const fd = new FormData();
  fd.set("attr_a1", "on");
  fd.set("attr_a2", "Collector");
  fd.set("attr_a3", "abc");
  const { values, errors } = parseAttributeFields(fd, [notice, edition, pads], "GAME");
  assert.deepEqual([...values], [["a1", "true"], ["a2", "Collector"], ["a3", null]]);
  assert.deepEqual(errors, {});
});

test("options : une par ligne ou séparées par des virgules, sans doublon", () => {
  assert.deepEqual(parseOptions("Standard, Collector\ncollector\n\n Platinum "), ["Standard", "Collector", "Platinum"]);
});
