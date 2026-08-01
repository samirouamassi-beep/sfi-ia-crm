"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

const EXTENSIONS_AUTORISEES = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
];

function extensionAutorisee(nom: string): boolean {
  const nomMin = nom.toLowerCase();
  return EXTENSIONS_AUTORISEES.some((ext) => nomMin.endsWith(ext));
}

async function televerser(fichier: FormDataEntryValue | null) {
  if (!(fichier instanceof File) || fichier.size === 0) {
    throw new Error("Aucun fichier selectionne.");
  }
  if (!extensionAutorisee(fichier.name)) {
    throw new Error(
      "Format non autorise (PDF, Word, PowerPoint, Excel ou image uniquement)."
    );
  }
  const resultat = await put(`rh/${randomUUID()}-${fichier.name}`, fichier, {
    access: "private",
  });
  return { nom: fichier.name, url: resultat.url };
}

export async function ajouterDocumentFondateur(fondateurId: string, formData: FormData) {
  const document = await televerser(formData.get("fichier"));
  await prisma.document.create({ data: { ...document, fondateurId } });
  revalidatePath(`/rh/fondateurs/${fondateurId}`);
  revalidatePath("/rh");
}

export async function ajouterDocumentRessource(ressourceId: string, formData: FormData) {
  const document = await televerser(formData.get("fichier"));
  await prisma.document.create({ data: { ...document, ressourceId } });
  revalidatePath(`/rh/ressources/${ressourceId}`);
  revalidatePath("/rh");
}

export async function supprimerDocument(id: string, retourPath: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (document) {
    await del(document.url).catch(() => {});
  }
  await prisma.document.delete({ where: { id } });
  revalidatePath(retourPath);
  revalidatePath("/rh");
}
