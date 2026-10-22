import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tokenValide, COOKIE_NAME } from "@/lib/session";

// Next.js 16 a renomme "middleware" en "proxy" (meme convention, meme role).
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const authentifie = tokenValide(token);

  if (pathname === "/login") {
    if (authentifie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!authentifie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
