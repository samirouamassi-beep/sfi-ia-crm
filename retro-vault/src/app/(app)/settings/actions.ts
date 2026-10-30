"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { provider, refreshAllPrices } from "@/lib/pricing";
import { importRows, parseImportFile, type ImportReport } from "@/lib/transfer";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportState = { report?: ImportReport; error?: string } | undefined;

export async function importCollection(_state: ImportState, formData: FormData): Promise<ImportState> {
  const userId = await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez un fichier CSV ou JSON." };
  if (file.size > MAX_IMPORT_BYTES) return { error: "Fichier trop volumineux (5 Mo maximum)." };

  let rows: unknown[];
  try {
    rows = parseImportFile(file.name, await file.text());
  } catch (e) {
    return { error: e instanceof SyntaxError ? "JSON invalide." : (e as Error).message };
  }
  if (rows.length === 0) return { error: "Aucune ligne à importer." };

  const report = await importRows(userId, rows);
  if (report.imported > 0) {
    after(() => refreshAllPrices({ userId }).catch((e) => console.error("[cotation]", e)));
    revalidatePath("/", "layout");
  }
  return { report };
}

export type RefreshState = { message: string } | undefined;

export async function refreshMyPrices(): Promise<RefreshState> {
  const userId = await requireUserId();
  if (!provider.configured()) return { message: "Aucune source de cotation configurée (PRICECHARTING_TOKEN)." };
  after(() => refreshAllPrices({ userId }).catch((e) => console.error("[cotation]", e)));
  return { message: "Actualisation lancée en arrière-plan : les cotes seront à jour d'ici quelques minutes." };
}
