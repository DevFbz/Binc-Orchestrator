import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authEnabled, readSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function authHeaders() {
  const token = process.env.HERMES_CONTROL_PLANE_TOKEN;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function secureJson(payload: unknown, init: ResponseInit = {}) {
  return new NextResponse(JSON.stringify(payload), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...init.headers,
    },
  });
}

async function currentRole() {
  if (!authEnabled()) return "global_admin";
  return readSession((await cookies()).get(SESSION_COOKIE)?.value)?.role || null;
}

function canSearchCompanies(role: string | null) {
  return role === "global_admin" || role === "workspace_admin";
}

export async function POST(request: Request) {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) return secureJson({ ok: false, code: "control_plane_not_configured", message: "Configure HERMES_CONTROL_PLANE_URL na Vercel." }, { status: 503 });
  const role = await currentRole();
  if (authEnabled() && !role) return secureJson({ ok: false, code: "unauthorized" }, { status: 401 });
  if (authEnabled() && !canSearchCompanies(role)) return secureJson({ ok: false, code: "forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/company-finder/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({ ok: false, code: "invalid_upstream_response" }));
    return secureJson(payload, { status: response.status });
  } catch (error) {
    return secureJson({ ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao consultar o localizador." }, { status: 502 });
  }
}
