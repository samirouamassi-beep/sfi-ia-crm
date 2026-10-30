"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production uniquement, pour ne pas gêner le HMR). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/** À la déconnexion : purge des pages mises en cache (appareil partagé). */
export async function clearPageCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("pages-")).map((k) => caches.delete(k)));
}
