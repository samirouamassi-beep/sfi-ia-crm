"use client";

/** Ouvre la boîte d'impression du navigateur : « Enregistrer au format PDF ». */
export function BoutonImprimer() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 print:hidden"
    >
      Imprimer / enregistrer en PDF
    </button>
  );
}
