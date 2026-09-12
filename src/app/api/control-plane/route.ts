import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authHeaders() {
  const token = process.env.HERMES_CONTROL_PLANE_TOKEN;
  return {
    Accept: "application/json",
    ...(token ? { Authorization: ["Bearer", token].join(" ") } : {}),
  };
}

function secureJson(payload: unknown, init: ResponseInit = {}) {
  return new NextResponse(JSON.stringify(payload), { ...init, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...init.headers } });
}

async function readJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, { headers: authHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

export async function GET() {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) return secureJson({ ok: false, code: "control_plane_not_configured", message: "Configure HERMES_CONTROL_PLANE_URL na Vercel." }, { status: 503 });
  try {
    const [overview, tenants, campaigns, projects, jobs, report, health, metrics, audit, onboarding, events] = await Promise.all([
      readJson(baseUrl, "/api/admin/overview"),
      readJson(baseUrl, "/api/tenants"),
      readJson(baseUrl, "/api/campaigns"),
      readJson(baseUrl, "/api/projects"),
      readJson(baseUrl, "/api/jobs"),
      readJson(baseUrl, "/api/reports/overview"),
      readJson(baseUrl, "/api/system/health"),
      readJson(baseUrl, "/api/system/metrics"),
      readJson(baseUrl, "/api/audit/recent"),
      readJson(baseUrl, "/api/onboarding"),
      readJson(baseUrl, "/api/events/telegram?workspace_id=magu-moto-pecas-filho&limit=100"),
    ]);
    return secureJson({ ok: true, overview, tenants, campaigns, projects, jobs, report, health, metrics, audit, onboarding, telegramEvents: events });
  } catch (error) {
    return secureJson({ ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao consultar o control plane." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const baseUrl = process.env.HERMES_CONTROL_PLANE_URL;
  if (!baseUrl) return secureJson({ ok: false, code: "control_plane_not_configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  try {
    if (body.kind === "admin_message") {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/terminal/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ conversation_id: body.conversation_id, text: body.text, idempotency_key: body.idempotency_key, confirm: body.confirm === true }),
        cache: "no-store",
      });
      return secureJson(await response.json(), { status: response.status });
    }
    if (body.kind === "admin_media") {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/terminal/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ conversation_id: body.conversation_id, text: body.text, idempotency_key: body.idempotency_key, filename: body.filename, mime_type: body.mime_type, content_base64: body.content_base64, confirm: body.confirm === true }),
        cache: "no-store",
      });
      return secureJson(await response.json(), { status: response.status });
    }
    if (body.kind === "member_create") {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ member_id: body.member_id, workspace_id: body.workspace_id, role: body.role, confirm: body.confirm === true }),
        cache: "no-store",
      });
      return secureJson(await response.json(), { status: response.status });
    }
    const action = String(body.action || "");
    const jobId = String(body.job_id || "");
    if (!jobId || !["pause", "resume", "run"].includes(action)) return secureJson({ ok: false, code: "invalid_job_action" }, { status: 400 });
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/jobs/${encodeURIComponent(jobId)}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ actor_id: body.actor_id || "web-admin", confirm: body.confirm === true }),
      cache: "no-store",
    });
    return secureJson(await response.json(), { status: response.status });
  } catch (error) {
    return secureJson({ ok: false, code: "control_plane_unavailable", message: error instanceof Error ? error.message : "Falha ao executar ação." }, { status: 502 });
  }
}
