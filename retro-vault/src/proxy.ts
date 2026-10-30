import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, readToken } from "@/lib/session";

// Next.js 16 : "middleware" s'appelle désormais "proxy".
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = readToken(request.cookies.get(COOKIE_NAME)?.value) !== null;

  if (pathname === "/login") {
    return authenticated ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!authenticated) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Publics : assets Next, PWA (manifeste, SW, icônes, page hors ligne), photos locales,
  // et la route cron qui s'authentifie elle-même par CRON_SECRET.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|pwa-icon|offline|uploads|api/prices/refresh).*)",
  ],
};
