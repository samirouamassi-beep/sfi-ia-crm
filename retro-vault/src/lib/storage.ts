// Photos des exemplaires : Supabase Storage (API REST) si configuré,
// sinon écriture locale dans public/uploads (développement uniquement).

import "server-only";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
]);

const supabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key, bucket: process.env.SUPABASE_BUCKET ?? "item-photos" } : null;
};

/** En-têtes d'authentification : `apikey` est requis par les nouvelles clés secrètes
 * (sb_secret_…), `Authorization` par les anciennes clés service_role (JWT). */
const authHeaders = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });

export class PhotoError extends Error {}

export async function uploadPhoto(userId: string, itemId: string, file: File): Promise<{ storagePath: string; url: string }> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new PhotoError(`Format non supporté (${file.type || "inconnu"}) : JPEG, PNG, WebP ou HEIC.`);
  if (file.size > MAX_PHOTO_BYTES) throw new PhotoError("Photo trop lourde (8 Mo maximum).");

  const storagePath = `${userId}/${itemId}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const sb = supabase();

  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${storagePath}`, {
      method: "POST",
      headers: { ...authHeaders(sb.key), "Content-Type": file.type, "x-upsert": "false" },
      body: bytes,
    });
    if (!res.ok) throw new PhotoError(`Envoi de la photo impossible (Supabase ${res.status}).`);
    return { storagePath, url: `${sb.url}/storage/v1/object/public/${sb.bucket}/${storagePath}` };
  }

  if (process.env.NODE_ENV === "production") {
    throw new PhotoError("Stockage des photos non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  const target = path.join(process.cwd(), "public", "uploads", storagePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return { storagePath, url: `/uploads/${storagePath}` };
}

export async function deletePhoto(storagePath: string): Promise<void> {
  const sb = supabase();
  if (sb) {
    await fetch(`${sb.url}/storage/v1/object/${sb.bucket}`, {
      method: "DELETE",
      headers: { ...authHeaders(sb.key), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [storagePath] }),
    });
    return;
  }
  await unlink(path.join(process.cwd(), "public", "uploads", storagePath)).catch(() => {});
}
