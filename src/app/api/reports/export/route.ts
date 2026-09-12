import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  const token = process.env.HERMES_CONTROL_PLANE_TOKEN;
  if (!baseUrl) return NextResponse.json({ ok: false, code: "control_plane_not_configured" }, { status: 503 });
  const query = new URL(request.url).search;
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/reports/export${query}`, { headers: { Accept: "text/csv", ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}) }, cache: "no-store" });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": response.headers.get("Content-Type") || "text/csv; charset=utf-8", "Content-Disposition": response.headers.get("Content-Disposition") || "attachment; filename=\"binc-report.csv\"", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
