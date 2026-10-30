import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

/** Icônes PWA générées (PNG) : manette stylisée sur fond du thème. */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Taille non supportée", { status: 404 });
  const maskable = new URL(request.url).searchParams.has("maskable");
  const pad = maskable ? size * 0.2 : size * 0.1; // zone de sécurité des icônes "maskable"
  const inner = size - pad * 2;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0e12" }}>
        <div
          style={{
            width: inner,
            height: inner * 0.62,
            borderRadius: inner * 0.2,
            background: "linear-gradient(135deg, #9085e9, #6250d6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `0 ${inner * 0.14}px`,
          }}
        >
          <div style={{ display: "flex", position: "relative", width: inner * 0.24, height: inner * 0.24 }}>
            <div style={{ position: "absolute", left: inner * 0.08, top: 0, width: inner * 0.08, height: inner * 0.24, background: "#0d0e12", borderRadius: inner * 0.015 }} />
            <div style={{ position: "absolute", left: 0, top: inner * 0.08, width: inner * 0.24, height: inner * 0.08, background: "#0d0e12", borderRadius: inner * 0.015 }} />
          </div>
          <div style={{ display: "flex", gap: inner * 0.05 }}>
            <div style={{ width: inner * 0.09, height: inner * 0.09, borderRadius: 999, background: "#f0efec" }} />
            <div style={{ width: inner * 0.09, height: inner * 0.09, borderRadius: 999, background: "#0d0e12", marginTop: -inner * 0.08 }} />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=604800, immutable" } }
  );
}
