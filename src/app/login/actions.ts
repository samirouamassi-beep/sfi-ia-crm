"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { creerToken, motDePasseValide, COOKIE_NAME } from "@/lib/session";

export type EtatConnexion = { erreur?: string } | undefined;

export async function seConnecter(
  _etat: EtatConnexion,
  formData: FormData
): Promise<EtatConnexion> {
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!motDePasse || !motDePasseValide(motDePasse)) {
    return { erreur: "Mot de passe incorrect." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, creerToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function seDeconnecter() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
