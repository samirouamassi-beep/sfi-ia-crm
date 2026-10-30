import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME, readToken } from "./session";

/** Identifiant du collectionneur connecté ; redirige vers /login sinon. */
export async function requireUserId(): Promise<string> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const userId = readToken(token);
  if (!userId) redirect("/login");
  return userId;
}

/** Variante pour les route handlers : null au lieu d'une redirection. */
export async function currentUserId(): Promise<string | null> {
  return readToken((await cookies()).get(COOKIE_NAME)?.value);
}
