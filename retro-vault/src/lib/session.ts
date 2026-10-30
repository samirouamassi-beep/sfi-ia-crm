// Session V0 : cookie signé HMAC "userId.expiration.signature".
// Pour passer à Supabase Auth, seul getCurrentUserId() (auth.ts) est à réécrire :
// les données sont déjà rattachées à User.id (= auth.users.id).

import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE_NAME = "retrovault_session";
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 jours

function secret(): string {
  const s = process.env.APP_SESSION_SECRET;
  if (!s) throw new Error("APP_SESSION_SECRET manquant");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createToken(userId: string): string {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE_S * 1000}`;
  return `${payload}.${sign(payload)}`;
}

/** userId si le jeton est valide et non expiré, sinon null. */
export function readToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  const expected = sign(`${userId}.${expiresAt}`);
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  return Number(expiresAt) > Date.now() ? userId : null;
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD manquant");
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
