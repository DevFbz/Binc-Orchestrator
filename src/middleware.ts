import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const enabled = process.env.BINC_AUTH_ENABLED === "true";
  if (!enabled) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/_next") || pathname === "/favicon.ico") return NextResponse.next();
  if (request.cookies.get("binc_session")?.value) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
