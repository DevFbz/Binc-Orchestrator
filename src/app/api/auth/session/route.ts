import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authEnabled, readSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return NextResponse.json({ enabled: authEnabled(), authenticated: Boolean(session), session });
}
