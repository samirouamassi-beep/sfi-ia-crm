"use server";

import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cheminRetour } from "@/lib/retour";

function champ(formData: FormData, nom: string): string | null {
  const v = formData.get(nom);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function donnees(formData: FormData) {
  const compteId = champ(formData, "compteId");
  const relancePrevueLe = champ(formData, "relancePrevueLe");
  return {
    nom: champ(formData, "nom") ?? "",
    prenom: champ(formData, "prenom") ?? "",
    compteId: compteId ?? null,
    fonction: champ(formData, "fonction"),
    roleDecision: champ(formData, "roleDecision"),
    email: champ(formData, "email"),
    telephone: champ(formData, "telephone"),
    linkedin: champ(formData, "linkedin"),
    fondateurReferent: champ(formData, "fondateurReferent"),
    priorite: champ(formData, "priorite"),
    relancePrevueLe: relancePrevueLe ? new Date(relancePrevueLe) : null,
    notes: champ(formData, "notes"),
  };
}

export async function creerContact(formData: FormData) {
  await prisma.contact.create({ data: donnees(formData) });
  revalidatePath("/contacts");
  redirect(cheminRetour(formData, "/contacts"));
}

export async function modifierContact(id: string, formData: FormData) {
  await prisma.contact.update({ where: { id }, data: donnees(formData) });
  revalidatePath("/contacts");
  redirect("/contacts");
}

export async function supprimerContact(id: string) {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
