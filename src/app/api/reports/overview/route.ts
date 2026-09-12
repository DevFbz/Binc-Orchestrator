import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  const token = process.env.HERMES_CONTROL_PLANE_TOKEN;
  if (!baseUrl) return NextResponse.json({ ok: false, code: "control_plane_not_configured" }, { status: 503 });
  const query = new URL(request.url).search;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reports/overview${query}`, { headers: { Accept: "application/json", ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}) }, cache: "no-store" });
  return NextResponse.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
