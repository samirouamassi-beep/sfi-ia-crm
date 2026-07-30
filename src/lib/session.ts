import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "sfiia_session";
const DUREE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function secret(): string {
  const s = process.env.APP_SESSION_SECRET;
  if (!s) throw new Error("APP_SESSION_SECRET manquant");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function creerToken(): string {
  const expiresAt = Date.now() + DUREE_MS;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function tokenValide(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const attendu = sign(payload);
  if (attendu.length !== signature.length) return false;
  if (!timingSafeEqual(Buffer.from(attendu), Buffer.from(signature))) return false;
  return Number(payload) > Date.now();
}

export function motDePasseValide(motDePasse: string): boolean {
  const attendu = process.env.APP_PASSWORD;
  if (!attendu) throw new Error("APP_PASSWORD manquant");
  const a = Buffer.from(motDePasse);
  const b = Buffer.from(attendu);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { COOKIE_NAME };
