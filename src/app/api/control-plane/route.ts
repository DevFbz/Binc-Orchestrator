import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authHeaders() {
  const token = process.env.HERMES_CONTROL_PLANE_TOKEN;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}),
  };
}

async function readJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { headers: authHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

export async function GET() {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) return NextResponse.json({ ok: false, code: "control_plane_not_configured", message: "Configure HERMES_CONTROL_PLANE_URL na Vercel." }, { status: 503 });
  try {
    const [overview, tenants, campaigns, projects, jobs, report, health, audit, onboarding, events] = await Promise.all([
      readJson(baseUrl, "/api/admin/overview"),
      readJson(baseUrl, "/api/tenants"),
      readJson(baseUrl, "/api/campaigns"),
      readJson(baseUrl, "/api/projects"),
      readJson(baseUrl, "/api/jobs"),
      readJson(baseUrl, "/api/reports/overview"),
      readJson(baseUrl, "/api/system/health"),
      readJson(baseUrl, "/api/audit/recent"),
      readJson(baseUrl, "/api/onboarding"),
      readJson(baseUrl, "/api/events/telegram?workspace_id=magu-moto-pecas-filho&limit=100"),
    ]);
    return NextResponse.json({ ok: true, overview, tenants, campaigns, projects, jobs, report, health, audit, onboarding, telegramEvents: events });
  } catch (error) {
    return NextResponse.json({ ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao consultar o control plane." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) return NextResponse.json({ ok: false, code: "control_plane_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.kind === "admin_message") {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/terminal/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ conversation_id: body.conversation_id, text: body.text, idempotency_key: body.idempotency_key, confirm: body.confirm === true }),
        cache: "no-store",
      });
      return NextResponse.json(await response.json(), { status: response.status });
    }
    const action = String(body.action || "");
    const jobId = String(body.job_id || "");
    if (!jobId || !["pause", "resume", "run"].includes(action)) return NextResponse.json({ ok: false, code: "invalid_job_action" }, { status: 400 });
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/jobs/${encodeURIComponent(jobId)}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ actor_id: body.actor_id || "web-admin", confirm: body.confirm === true }),
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    return NextResponse.json({ ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao executar ação." }, { status: 502 });
  }
}
