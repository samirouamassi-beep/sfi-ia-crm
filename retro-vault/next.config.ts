import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lit ses polices standard (fichiers .afm) sur le disque : à charger tel quel, hors bundle.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Formulaire d'ajout : jusqu'à 4 photos de 8 Mo (cf. MAX_PHOTO_BYTES) + marge multipart.
    serverActions: { bodySizeLimit: "35mb" },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
