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
    prenom: champ(formData, "prenom") ?? "",
    societe: champ(formData, "societe") ?? "",
    fonction: champ(formData, "fonction"),
    email: champ(formData, "email"),
    telephone: champ(formData, "telephone"),
    linkedin: champ(formData, "linkedin"),
    source: champ(formData, "source"),
    statut: champ(formData, "statut") ?? "Nouveau",
    fondateurReferent: champ(formData, "fondateurReferent"),
    notes: champ(formData, "notes"),
  };
}

export async function creerProspect(formData: FormData) {
  await prisma.prospect.create({ data: donnees(formData) });
  revalidatePath("/prospects");
  redirect("/prospects");
}

export async function modifierProspect(id: string, formData: FormData) {
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  const data = donnees(formData);
  // Le statut "Converti" n'est pose que par la conversion : il ne se modifie pas a la main.
  if (prospect?.convertiLe) data.statut = "Converti";
  else if (data.statut === "Converti") data.statut = prospect?.statut ?? "Nouveau";
  await prisma.prospect.update({ where: { id }, data });
  revalidatePath("/prospects");
  redirect("/prospects");
}

export async function supprimerProspect(id: string) {
  await prisma.prospect.delete({ where: { id } });
  revalidatePath("/prospects");
  redirect("/prospects");
}

/**
 * Conversion (equivalent du "Convert Lead" Salesforce) : le prospect devient un contact,
 * rattache a un compte existant ou nouveau, avec en option une opportunite.
 */
export async function convertirProspect(id: string, formData: FormData) {
  const prospect = await prisma.prospect.findUnique({ where: { id } });
  if (!prospect) redirect("/prospects");
  if (prospect.convertiLe && prospect.compteId) redirect(`/comptes/${prospect.compteId}`);

  const compteExistantId = champ(formData, "compteExistantId");
  const nomCompte = champ(formData, "nomCompte") ?? prospect.societe;
  const creerOpportunite = formData.get("creerOpportunite") === "on";

  const compteId = await prisma.$transaction(async (tx) => {
    let compte = compteExistantId
      ? await tx.compte.findUnique({ where: { id: compteExistantId } })
      : await tx.compte.findUnique({ where: { nom: nomCompte } });
    if (!compte) {
      compte = await tx.compte.create({
        data: {
          nom: nomCompte,
          categorie: champ(formData, "categorie") ?? "Prospect",
          statutRelation: "Premier contact",
          priorite: champ(formData, "priorite") ?? "Moyenne",
          fondateurReferent: prospect.fondateurReferent,
          contactPrincipal: `${prospect.nom} ${prospect.prenom}`,
          origineRelation: prospect.source,
        },
      });
    }

    const contact = await tx.contact.create({
      data: {
        nom: prospect.nom,
        prenom: prospect.prenom,
        compteId: compte.id,
        fonction: prospect.fonction,
        email: prospect.email,
        telephone: prospect.telephone,
        linkedin: prospect.linkedin,
        fondateurReferent: prospect.fondateurReferent,
        notes: prospect.notes,
      },
    });

    let opportuniteId: string | null = null;
    if (creerOpportunite) {
      const opportunite = await tx.opportunite.create({
        data: {
          intitule: champ(formData, "intitule") ?? `${compte.nom} — nouvelle opportunité`,
          compteId: compte.id,
          typeOffre: champ(formData, "typeOffre") ?? "Régie",
          montant: Number(champ(formData, "montant") ?? 0),
          etape: champ(formData, "etape") ?? "Identifié",
          fondateurReferent: prospect.fondateurReferent,
        },
      });
      opportuniteId = opportunite.id;
    }

    await tx.prospect.update({
      where: { id },
      data: {
        statut: "Converti",
        convertiLe: new Date(),
        compteId: compte.id,
        contactId: contact.id,
        opportuniteId,
      },
    });
    return compte.id;
  });

  revalidatePath("/prospects");
  revalidatePath("/comptes");
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  redirect(`/comptes/${compteId}`);
}
