"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { COOKIE_NAME, SESSION_MAX_AGE_S, createToken, passwordMatches } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

/** V0 mono-collectionneur : le mot de passe ouvre le compte du propriétaire (OWNER_EMAIL). */
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password || !passwordMatches(password)) return { error: "Mot de passe incorrect." };

  const email = process.env.OWNER_EMAIL ?? "owner@retrovault.local";
  const user = await prisma.user.upsert({ where: { email }, create: { email }, update: {} });

  (await cookies()).set(COOKIE_NAME, createToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/login");
}
