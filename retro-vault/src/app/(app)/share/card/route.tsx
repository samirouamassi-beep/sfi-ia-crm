import { ImageResponse } from "next/og";
import { currentUserId } from "@/lib/auth";
import { COMPLETENESS_LABELS } from "@/lib/catalog";
import { formatCents, formatPercent } from "@/lib/money";
import { loadDashboard } from "@/lib/stats";
import { gain } from "@/lib/valuation";

// Carte de partage 1080×1350 (format portrait réseaux sociaux). Satori : flexbox uniquement.
export async function GET(request: Request) {
  const userId = await currentUserId();
  if (!userId) return new Response("Non authentifié", { status: 401 });

  const d = await loadDashboard(userId);
  const { ratio } = gain(d.valueCents, d.investedCents);
  const showMoney = new URL(request.url).searchParams.get("money") !== "0";
  const date = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date());

  const stat = (label: string, value: string, color = "#f0efec") => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#16181d", borderRadius: 28, padding: "28px 32px" }}>
      <span style={{ fontSize: 26, color: "#8b8a83" }}>{label}</span>
      <span style={{ fontSize: 52, fontWeight: 700, color, marginTop: 6 }}>{value}</span>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0d0e12", color: "#f0efec", padding: 64 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>
            RETRO<span style={{ color: "#9085e9" }}>VAULT</span>
          </span>
          <span style={{ fontSize: 26, color: "#8b8a83" }}>{date}</span>
        </div>

        <span style={{ fontSize: 30, color: "#c3c2b7", marginTop: 56 }}>Ma collection</span>
        <span style={{ fontSize: 120, fontWeight: 800, lineHeight: 1.05 }}>
          {d.count} pièce{d.count > 1 ? "s" : ""}
        </span>

        <div style={{ display: "flex", gap: 24, marginTop: 40 }}>
          {showMoney && stat("Valeur estimée", formatCents(d.valueCents, { round: true }))}
          {showMoney
            ? stat("Plus-value", formatPercent(ratio), ratio == null ? "#8b8a83" : ratio >= 0 ? "#0ca30c" : "#e66767")
            : stat("Plateformes", String(d.platforms.length))}
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
          {(["LOOSE", "CIB", "SEALED"] as const).map((c) => stat(COMPLETENESS_LABELS[c].label, String(d.completeness[c])))}
        </div>

        <span style={{ fontSize: 30, color: "#c3c2b7", marginTop: 56 }}>Pièces maîtresses</span>
        <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
          {d.topPieces.slice(0, 3).map(({ item, valueCents }) => (
            <div key={item.id} style={{ display: "flex", flexDirection: "column", width: 296 }}>
              {item.product.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.product.coverUrl} alt="" width={296} height={380} style={{ borderRadius: 20, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 296, height: 380, borderRadius: 20, background: "#1f2229", display: "flex" }} />
              )}
              <span style={{ fontSize: 26, marginTop: 14, lineClamp: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                {item.product.title}
              </span>
              <span style={{ fontSize: 22, color: "#8b8a83" }}>
                {item.product.platform.shortName} · {COMPLETENESS_LABELS[item.completeness].label}
                {showMoney ? ` · ${formatCents(valueCents, { round: true })}` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1080, height: 1350, headers: { "Cache-Control": "private, no-store" } }
  );
}
