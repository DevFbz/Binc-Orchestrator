import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function readJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: {
      Accept: "application/json",
      ...(process.env.HERMES_CONTROL_PLANE_TOKEN ? { Authorization: `Bearer ${process.env.HERMES_CONTROL_PLANE_TOKEN}` } : {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

export async function GET() {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, code: "control_plane_not_configured", message: "Configure HERMES_CONTROL_PLANE_URL na Vercel." },
      { status: 503 },
    );
  }

  try {
    const [overview, tenants, campaigns, projects, finance] = await Promise.all([
      readJson(baseUrl, "/api/admin/overview"),
      readJson(baseUrl, "/api/tenants"),
      readJson(baseUrl, "/api/campaigns"),
      readJson(baseUrl, "/api/projects"),
      readJson(baseUrl, "/api/finance/summary?workspace_id=personal"),
    ]);
    return NextResponse.json({ ok: true, overview, tenants, campaigns, projects, finance });
  } catch (error) {
    return NextResponse.json(
      { ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao consultar o control plane." },
      { status: 502 },
    );
  }
}
