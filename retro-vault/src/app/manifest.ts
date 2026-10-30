import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "RetroGame Vault",
    short_name: "Retro Vault",
    description: "Votre collection de jeux vidéo rétro, valorisée et suivie.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0e12",
    theme_color: "#0d0e12",
    categories: ["entertainment", "finance", "lifestyle"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png" },
      { src: "/pwa-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ajouter un jeu", url: "/collection/new" },
      { name: "Ma collection", url: "/collection" },
    ],
  };
}
