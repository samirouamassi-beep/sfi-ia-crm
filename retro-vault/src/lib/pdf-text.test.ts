import { test } from "node:test";
import assert from "node:assert/strict";
import { pdfText } from "./pdf-text";

test("texte PDF : espaces fines, signe moins et caractères hors Latin-1", () => {
  assert.equal(pdfText("1 234,00 €"), "1 234,00 €");
  assert.equal(pdfText("−3,5 %"), "-3,5 %");
  assert.equal(pdfText("Pokémon Édition Rouge — Player’s Choice"), "Pokémon Édition Rouge — Player’s Choice");
  assert.equal(pdfText("ゼルダ"), "???");
});
