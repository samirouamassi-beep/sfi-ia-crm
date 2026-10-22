"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nombre, texte } from "@/lib/formulaire";

function donnees(formData: FormData) {
  return {
    nom: texte(formData, "nom") ?? "",
    email: texte(formData, "email"),
    role: texte(formData, "role") ?? "Consultant",
    tauxJournalier: nombre(formData, "tauxJournalier"),
    capaciteJours: nombre(formData, "capaciteJours", 5),
    actif: formData.get("actif") !== "off",
  };
}

export async function creerMembre(formData: FormData) {
  await prisma.membre.create({ data: donnees(formData) });
  revalidatePath("/", "layout");
  redirect("/equipe");
}

export async function modifierMembre(id: string, formData: FormData) {
  await prisma.membre.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/", "layout");
  redirect("/equipe");
}
