import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

// Sert les CV (stockes en "private" sur Vercel Blob) aux utilisateurs deja
// authentifies par le proxy applicatif (src/proxy.ts couvre aussi /api/*).
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const nom = request.nextUrl.searchParams.get("nom");
  if (!url) {
    return new NextResponse("Parametre url manquant", { status: 400 });
  }

  let pathname: string;
  try {
    pathname = new URL(url).pathname.replace(/^\//, "");
  } catch {
    return new NextResponse("URL invalide", { status: 400 });
  }
  if (!pathname.startsWith("cv/")) {
    return new NextResponse("Acces refuse", { status: 403 });
  }

  try {
    const blob = await get(url, { access: "private" });
    if (!blob || blob.statusCode !== 200) {
      return new NextResponse("Fichier introuvable", { status: 404 });
    }
    const nomFichier = nom ? nom.replace(/"/g, "") : undefined;
    return new NextResponse(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType,
        "Content-Disposition": nomFichier
          ? `inline; filename="${nomFichier}"`
          : blob.blob.contentDisposition,
      },
    });
  } catch {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }
}
