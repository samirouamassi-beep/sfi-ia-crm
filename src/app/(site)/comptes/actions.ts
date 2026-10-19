"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function champ(formData: FormData, nom: string): string | null {
  const v = formData.get(nom);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function donnees(formData: FormData) {
  return {
    nom: champ(formData, "nom") ?? "",
    categorie: champ(formData, "categorie") ?? "",
    secteur: champ(formData, "secteur"),
    statutRelation: champ(formData, "statutRelation") ?? "",
    priorite: champ(formData, "priorite") ?? "",
    fondateurReferent: champ(formData, "fondateurReferent"),
    contactPrincipal: champ(formData, "contactPrincipal"),
    origineRelation: champ(formData, "origineRelation"),
    statutReferencement: champ(formData, "statutReferencement"),
    delaiPaiementJours: champ(formData, "delaiPaiementJours")
      ? Number(champ(formData, "delaiPaiementJours"))
      : null,
    notes: champ(formData, "notes"),
  };
}

export async function creerCompte(formData: FormData) {
  await prisma.compte.create({ data: donnees(formData) });
  revalidatePath("/comptes");
  redirect("/comptes");
}

export async function modifierCompte(id: string, formData: FormData) {
  await prisma.compte.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/comptes");
  redirect(`/comptes/${id}`);
}

export async function supprimerCompte(id: string) {
  await prisma.compte.delete({ where: { id } });
  revalidatePath("/comptes");
  redirect("/comptes");
}
