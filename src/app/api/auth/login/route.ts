import { NextResponse } from "next/server";
import { authEnabled, createSession, SESSION_COOKIE, verifyCredentials } from "@/lib/auth";

export async function POST(request: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: false, code: "auth_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || "");
  const password = String(body.password || "");
  if (!verifyCredentials(email, password)) return NextResponse.json({ ok: false, code: "invalid_credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSession(email), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
  return response;
}
