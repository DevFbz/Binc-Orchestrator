#!/usr/bin/env python3
"""Binc Orchestrator control plane.

Owns project/finance routes and proxies Instagram read routes internally.
"""
from __future__ import annotations

import json
import os
from collections import Counter
from datetime import date, datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

from control_plane_auth import is_authorized
from finance import summarize_period
from finance_commands import create_financial_entry
from finance_setup import create_account, create_category, create_recurrence, scoped_setup
from finance_setup_store import load_setup, mutate_setup
from event_store import append_telegram_event, read_recent_events
from finance_store import load_entries, save_entry
from audit_log import append_audit, read_recent
from campaign_matcher import identify_campaigns
from job_actions import apply_job_action
from job_registry import list_jobs, save_jobs, summarize_jobs
from message_composer import dispatch_admin_message
from media_composer import dispatch_admin_media
from member_registry import create_member, list_workspace_members, load_members, save_members, update_member_status
from onboarding import onboarding_checklist
from observability import summarize_health, summarize_metrics
from project_registry import list_projects, save_projects, update_project_status
from rate_limiter import RateLimiter
from rbac import can_perform_action
from report_engine import build_overview_report
from report_export import report_to_csv
from report_pdf import report_to_pdf
from tenant_registry import list_tenants

ROOT = Path(__file__).resolve().parents[1]
FINANCE_ENTRIES = ROOT / "data" / "finance" / "entries.jsonl"
FINANCE_SETUP = ROOT / "data" / "finance" / "setup.json"
TELEGRAM_EVENTS = ROOT / "data" / "events" / "telegram.jsonl"
MESSAGE_OUTBOX = ROOT / "data" / "outbox" / "telegram-admin.jsonl"
PRIVATE_MEDIA = ROOT / "data" / "private-media"
AUDIT_LOG = ROOT / "data" / "audit.jsonl"
WORKSPACES = ROOT / "data" / "workspaces.json"
MEMBERS = ROOT / "data" / "members.json"
INSTAGRAM_URL = os.environ.get("INSTAGRAM_STUDIO_URL", "http://127.0.0.1:8787")
COFRINIA_BRIDGE_URL = os.environ.get("COFRINIA_BRIDGE_URL", "http://127.0.0.1:8790")
CONTROL_PLANE_ACTOR = "control-plane-admin"
CONTROL_PLANE_ROLE = os.environ.get("CONTROL_PLANE_ROLE", "global_admin")
MUTATION_LIMITER = RateLimiter(limit=30, window_seconds=60)


def cofrinia_health_status(base_url: str = COFRINIA_BRIDGE_URL, *, opener=urlopen) -> dict[str, str]:
    request = Request(f"{base_url.rstrip('/')}/health", headers={"Accept": "application/json"})
    try:
        with opener(request, timeout=5) as response:
            if response.status >= 400:
                return {"service": "cofrinia-hermes-bridge", "status": "degraded"}
            payload = json.loads(response.read().decode("utf-8"))
            if payload.get("status") != "ok":
                return {"service": "cofrinia-hermes-bridge", "status": "degraded"}
            return {"service": "cofrinia-hermes-bridge", "status": "operational"}
    except (OSError, ValueError, json.JSONDecodeError):
        return {"service": "cofrinia-hermes-bridge", "status": "failed"}


def ingest_telegram_event(payload: dict, authorization: str | None, expected_token: str, path: Path = TELEGRAM_EVENTS) -> tuple[int, dict]:
    if not is_authorized(authorization, expected_token):
        raise PermissionError("não autorizado")
    result = append_telegram_event(path, payload)
    return 202, result


def route_description(path: str, *, today: date | None = None):
    routes = {
        "/api/projects": "project_registry",
        "/api/projects/status": "project_registry",
        "/api/jobs": "job_registry",
        "/api/reports/overview": "report_engine",
        "/api/reports/export": "report_engine",
        "/api/system/health": "observability",
        "/api/system/metrics": "observability",
        "/api/audit/recent": "audit",
        "/api/onboarding": "onboarding",
        "/api/members": "member_registry",
        "/api/events/telegram": "telegram_events",
        "/api/terminal/messages": "telegram_admin_send",
        "/api/terminal/media": "telegram_admin_media",
        "/api/finance/summary": "finance",
        "/api/finance/setup": "finance_setup",
        "/api/finance/categories": "finance_setup",
        "/api/finance/accounts": "finance_setup",
        "/api/finance/recurrences": "finance_setup",
        "/api/campaigns": "instagram_proxy",
        "/api/tenants": "tenant_registry",
        "/api/admin/overview": "orchestrator_overview",
    }
    if path == "/api/finance/summary" and today is not None:
        return today.replace(day=1).isoformat(), today.isoformat()
    return routes.get(path)


def _finance_summary(query: dict[str, list[str]]) -> dict:
    today = date.today()
    workspace = query.get("workspace_id", ["personal"])[0]
    start = date.fromisoformat(query.get("start", [today.replace(day=1).isoformat()])[0])
    end = date.fromisoformat(query.get("end", [today.isoformat()])[0])
    return {"workspace_id": workspace, "start": start.isoformat(), "end": end.isoformat(), "summary": summarize_period(load_entries(FINANCE_ENTRIES), workspace, start, end)}


def apply_finance_setup_mutation(setup: dict, body: dict) -> tuple[str, dict]:
    try:
        return _apply_finance_setup_mutation(setup, body)
    except (KeyError, TypeError):
        raise ValueError("configuração financeira inválida") from None


def _required_string(body: dict, key: str) -> str:
    value = body[key]
    if not isinstance(value, str) or not value.strip():
        raise ValueError("configuração financeira inválida")
    return value.strip()


def _required_positive_int(body: dict, key: str) -> int:
    value = body[key]
    if type(value) is not int or value <= 0:
        raise ValueError("configuração financeira inválida")
    return value


def _apply_finance_setup_mutation(setup: dict, body: dict) -> tuple[str, dict]:
    common = {
        "workspace_id": _required_string(body, "workspace_id"),
        "confirm": body.get("confirm") is True,
    }
    kind = body.get("kind")
    if kind == "finance_category":
        return "category", create_category(
            setup,
            **common,
            name=_required_string(body, "name"),
            entry_type=_required_string(body, "entry_type"),
        )
    if kind == "finance_account":
        return "account", create_account(
            setup,
            **common,
            name=_required_string(body, "name"),
            account_type=_required_string(body, "account_type"),
        )
    if kind == "finance_recurrence":
        return "recurrence", create_recurrence(
            setup,
            **common,
            entry_type=_required_string(body, "entry_type"),
            amount_cents=_required_positive_int(body, "amount_cents"),
            category_id=_required_string(body, "category_id"),
            account_id=_required_string(body, "account_id"),
            frequency=_required_string(body, "frequency"),
            next_due_on=date.fromisoformat(_required_string(body, "next_due_on")),
            description=_required_string(body, "description"),
        )
    raise ValueError("tipo de configuração financeira inválido")


def overview_for_tenants(tenants: list[dict], campaigns: list[dict]) -> dict:
    rows = []
    published = 0
    for tenant in tenants:
        relevant = [item for item in campaigns if item.get("tenant_id") == tenant["tenant_id"]]
        statuses = Counter(item.get("status", "UNKNOWN") for item in relevant)
        published += statuses.get("PUBLISHED", 0)
        rows.append({"tenant_id": tenant["tenant_id"], "name": tenant["name"], "active": tenant.get("active", False), "campaigns_by_status": dict(statuses), "campaigns_total": len(relevant)})
    return {"totals": {"tenants": len(tenants), "campaigns": len(campaigns), "published": published}, "tenants": rows}


def _instagram_get(path: str, authorization: str) -> dict:
    request = Request(f"{INSTAGRAM_URL.rstrip('/')}{path}", headers={"Authorization": authorization, "Accept": "application/json"})
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


class Handler(BaseHTTPRequestHandler):
    def send_json(self, payload: dict, status: int = 200):
        raw = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(raw)

    def send_csv(self, body: str, filename: str = "binc-report.csv"):
        raw = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def send_pdf(self, body: bytes, filename: str = "binc-report.pdf"):
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        if path == "/api/health":
            self.send_json({"ok": True, "service": "binc-orchestrator-control-plane"})
            return
        expected = os.environ.get("CONTROL_PLANE_TOKEN", "")
        if not is_authorized(self.headers.get("Authorization"), expected):
            self.send_json({"error": "unauthorized"}, 401)
            return
        try:
            if path == "/api/projects":
                self.send_json({"projects": list_projects()})
                return
            if path == "/api/jobs":
                jobs = list_jobs()
                self.send_json({"jobs": jobs, "summary": summarize_jobs(jobs)})
                return
            if path == "/api/reports/export":
                today = date.today()
                start = query.get("start", [today.replace(day=1).isoformat()])[0]
                end = query.get("end", [today.isoformat()])[0]
                campaigns = _instagram_get("/api/campaigns", self.headers.get("Authorization", "")).get("campaigns", [])
                finance = _finance_summary({"workspace_id": [query.get("workspace_id", ["personal"])[0]], "start": [start], "end": [end]})["summary"]
                jobs = list_jobs()
                report = build_overview_report(start, end, list_projects(), {"summary": summarize_jobs(jobs)}, {"total": len(campaigns), "published": sum(item.get("status") == "PUBLISHED" for item in campaigns)}, finance)
                export_format = query.get("format", ["csv"])[0].casefold()
                if export_format == "pdf":
                    self.send_pdf(report_to_pdf(report), f"binc-report-{start}-{end}.pdf")
                elif export_format == "csv":
                    self.send_csv(report_to_csv(report), f"binc-report-{start}-{end}.csv")
                else:
                    self.send_json({"error": "formato de relatório inválido"}, 400)
                return
            if path == "/api/reports/overview":
                today = date.today()
                start = query.get("start", [today.replace(day=1).isoformat()])[0]
                end = query.get("end", [today.isoformat()])[0]
                campaigns = _instagram_get("/api/campaigns", self.headers.get("Authorization", "")).get("campaigns", [])
                finance = _finance_summary({"workspace_id": [query.get("workspace_id", ["personal"])[0]], "start": [start], "end": [end]})["summary"]
                jobs = list_jobs()
                report = build_overview_report(start, end, list_projects(), {"summary": summarize_jobs(jobs)}, {"total": len(campaigns), "published": sum(item.get("status") == "PUBLISHED" for item in campaigns)}, finance)
                self.send_json(report)
                return
            if path == "/api/system/metrics":
                events = read_recent_events(TELEGRAM_EVENTS, 500)
                self.send_json({"metrics": summarize_metrics(events, read_recent(AUDIT_LOG, 200), list_jobs())})
                return
            if path == "/api/system/health":
                services = [{"service": "binc-control-plane", "status": "operational"}]
                try:
                    request = Request(f"{INSTAGRAM_URL.rstrip('/')}/api/health", headers={"Accept": "application/json"})
                    with urlopen(request, timeout=5) as response:
                        services.append({"service": "instagram-studio", "status": "operational" if response.status < 400 else "degraded"})
                except Exception:
                    services.append({"service": "instagram-studio", "status": "failed"})
                services.append(cofrinia_health_status())
                self.send_json({"services": services, "summary": summarize_health(services)})
                return
            if path == "/api/events/telegram":
                workspace = query.get("workspace_id", [""])[0] or None
                limit = min(int(query.get("limit", [100])[0]), 500)
                events = read_recent_events(TELEGRAM_EVENTS, limit, workspace_id=workspace)
                try:
                    campaigns = _instagram_get("/api/campaigns", self.headers.get("Authorization", "")).get("campaigns", [])
                    events = [{**event, "campaign_candidates": identify_campaigns(event, campaigns)} for event in events]
                except Exception:
                    events = [{**event, "campaign_candidates": []} for event in events]
                self.send_json({"events": events})
                return
            if path == "/api/audit/recent":
                limit = min(int(query.get("limit", [50])[0]), 200)
                self.send_json({"events": read_recent(AUDIT_LOG, limit)})
                return
            if path == "/api/members":
                workspace = query.get("workspace_id", [""])[0]
                if not workspace:
                    self.send_json({"error": "workspace_id obrigatório"}, 400)
                    return
                self.send_json({"workspace_id": workspace, "members": list_workspace_members(MEMBERS, workspace)})
                return
            if path == "/api/onboarding":
                workspaces = json.loads(WORKSPACES.read_text(encoding="utf-8")).get("workspaces", [])
                self.send_json({"workspaces": [{**workspace, "checklist": onboarding_checklist(workspace)} for workspace in workspaces]})
                return
            if path == "/api/finance/summary":
                self.send_json(_finance_summary(query))
                return
            if path == "/api/finance/setup":
                workspace = query.get("workspace_id", ["personal"])[0]
                self.send_json({"workspace_id": workspace, **scoped_setup(load_setup(FINANCE_SETUP), workspace)})
                return
            if path == "/api/finance/entries":
                workspace = query.get("workspace_id", ["personal"])[0]
                start = query.get("start", [""])[0]
                end = query.get("end", [""])[0]
                limit = min(int(query.get("limit", [50])[0]), 200)
                entries = [item for item in load_entries(FINANCE_ENTRIES) if item.get("workspace_id") == workspace and (not start or item.get("occurred_on", "") >= start) and (not end or item.get("occurred_on", "") <= end)]
                self.send_json({"workspace_id": workspace, "entries": list(reversed(entries[-limit:]))})
                return
            if path == "/api/tenants":
                self.send_json({"tenants": list_tenants()})
                return
            if path == "/api/admin/overview":
                campaigns = _instagram_get("/api/campaigns", self.headers.get("Authorization", "")).get("campaigns", [])
                self.send_json(overview_for_tenants(list_tenants(), campaigns))
                return
            if route_description(path) == "instagram_proxy":
                self.send_json(_instagram_get(self.path, self.headers.get("Authorization", "")))
                return
        except Exception as exc:
            self.send_json({"error": "upstream_unavailable", "detail": str(exc)}, 502)
            return
        self.send_json({"error": "not_found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        expected = os.environ.get("CONTROL_PLANE_TOKEN", "")
        client_key = self.client_address[0] if self.client_address else "unknown"
        if not MUTATION_LIMITER.allow(client_key):
            self.send_json({"error": "rate_limited", "retry_after_seconds": 60}, 429)
            return
        if parsed.path == "/api/events/telegram":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                status, result = ingest_telegram_event(body, self.headers.get("Authorization"), os.environ.get("HERMES_EVENT_INGEST_TOKEN", ""))
                append_audit(AUDIT_LOG, actor_id="hermes-gateway", project_id="instagram-content-operations", action="ingest_telegram_event", result="duplicate" if result["duplicate"] else "success", details={"event_id": result["event_id"]})
                self.send_json(result, status)
            except PermissionError as exc:
                self.send_json({"error": str(exc)}, 401)
            except (TypeError, ValueError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if not is_authorized(self.headers.get("Authorization"), expected):
            self.send_json({"error": "unauthorized"}, 401)
            return
        action_by_path = ""
        if parsed.path in {"/api/terminal/messages", "/api/terminal/media"}:
            action_by_path = "send_telegram"
        elif parsed.path == "/api/finance/entries":
            action_by_path = "create_financial_entry"
        elif parsed.path in {"/api/finance/categories", "/api/finance/accounts", "/api/finance/recurrences"}:
            action_by_path = "manage_onboarding"
        elif parsed.path == "/api/projects/status":
            action_by_path = "manage_onboarding"
        elif parsed.path in {"/api/members", "/api/members/status"}:
            action_by_path = "manage_onboarding"
        elif len(parts) == 4 and parts[:2] == ["api", "jobs"]:
            action_by_path = "manage_jobs"
        if action_by_path and not can_perform_action(CONTROL_PLANE_ROLE, action_by_path):
            self.send_json({"error": "forbidden", "code": "rbac_denied"}, 403)
            return
        if parsed.path == "/api/projects/status":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                projects = list_projects()
                updated = update_project_status(projects, project_id=str(body["project_id"]), status=str(body["status"]), confirm=body.get("confirm") is True)
                save_projects(ROOT / "data" / "projects.json", projects)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id=updated["project_id"], action="update_project_status", result="success", details={"status": updated["status"]})
                self.send_json({"ok": True, "project": updated})
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/members/status":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                members = load_members(MEMBERS)
                updated = update_member_status(members, member_id=str(body["member_id"]), workspace_id=str(body["workspace_id"]), status=str(body["status"]), confirm=body.get("confirm") is True)
                save_members(MEMBERS, members)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id="binc-orchestrator", action="update_member_status", result="success", details={"member_id": updated["member_id"], "workspace_id": updated["workspace_id"], "status": updated["status"]})
                self.send_json({"ok": True, "member": updated})
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/members":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                members = load_members(MEMBERS)
                member = create_member(members, member_id=str(body["member_id"]), workspace_id=str(body["workspace_id"]), role=str(body["role"]), confirm=body.get("confirm") is True)
                save_members(MEMBERS, members)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id="binc-orchestrator", action="create_member", result="success", details={"member_id": member["member_id"], "workspace_id": member["workspace_id"], "role": member["role"]})
                self.send_json({"ok": True, "member": member}, 201)
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/terminal/media":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                events = read_recent_events(TELEGRAM_EVENTS, 500, workspace_id="magu-moto-pecas-filho")
                result = dispatch_admin_media(body, events, MESSAGE_OUTBOX, PRIVATE_MEDIA)
                if result["status"] == "sent":
                    target = next(item for item in events if item.get("conversation_id") == body["conversation_id"])
                    outbound = {"event_id": f"admin-media-{body['idempotency_key']}", "occurred_at": datetime.now(timezone.utc).isoformat(), "channel": "telegram", "direction": "outbound", "actor_type": "admin_assisted", "workspace_id": target["workspace_id"], "tenant_id": target.get("tenant_id"), "project_id": "instagram-content-operations", "conversation_id": target["conversation_id"], "external_user_ref": target["external_user_ref"], "message_type": "image", "text": body.get("text"), "media_ref": result.get("media_ref"), "campaign_id": target.get("campaign_id"), "intent": None, "delivery_status": "sent", "correlation_id": body["idempotency_key"]}
                    append_telegram_event(TELEGRAM_EVENTS, outbound)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id="instagram-content-operations", action="admin_send_telegram_media", result=result["status"], details={"conversation_id": body.get("conversation_id"), "idempotency_key": body.get("idempotency_key"), "media_ref": result.get("media_ref")})
                self.send_json(result, 200 if result["status"] == "sent" else 502)
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/terminal/messages":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                events = read_recent_events(TELEGRAM_EVENTS, 500, workspace_id="magu-moto-pecas-filho")
                result = dispatch_admin_message(body, events, MESSAGE_OUTBOX)
                if result["status"] == "sent":
                    target = next(item for item in events if item.get("conversation_id") == body["conversation_id"])
                    outbound = {"event_id": f"admin-out-{body['idempotency_key']}", "occurred_at": datetime.now(timezone.utc).isoformat(), "channel": "telegram", "direction": "outbound", "actor_type": "admin_assisted", "workspace_id": target["workspace_id"], "tenant_id": target.get("tenant_id"), "project_id": "instagram-content-operations", "conversation_id": target["conversation_id"], "external_user_ref": target["external_user_ref"], "message_type": "text", "text": body["text"], "media_ref": None, "campaign_id": target.get("campaign_id"), "intent": None, "delivery_status": "sent", "correlation_id": body["idempotency_key"]}
                    append_telegram_event(TELEGRAM_EVENTS, outbound)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id="instagram-content-operations", action="admin_send_telegram", result=result["status"], details={"conversation_id": body.get("conversation_id"), "idempotency_key": body.get("idempotency_key")})
                self.send_json(result, 200 if result["status"] == "sent" else 502)
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if parsed.path == "/api/finance/entries":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                occurred_on = date.fromisoformat(str(body["occurred_on"]))
                entries = load_entries(FINANCE_ENTRIES)
                account_id = str(body["account_id"]) if body.get("account_id") else None
                finance_setup = load_setup(FINANCE_SETUP)
                entry = create_financial_entry(entries, workspace_id=str(body["workspace_id"]), entry_type=str(body["entry_type"]), amount_cents=int(body["amount_cents"]), category=str(body["category"]), account_id=account_id, accounts=finance_setup["accounts"], occurred_on=occurred_on, description=str(body["description"]), confirm=body.get("confirm") is True)
                save_entry(FINANCE_ENTRIES, entry)
                append_audit(AUDIT_LOG, actor_id=CONTROL_PLANE_ACTOR, project_id="cofrinia-finance", action="create_financial_entry", result="success", details={"entry_id": entry["entry_id"], "workspace_id": entry["workspace_id"]})
                self.send_json({"ok": True, "entry": entry})
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        setup_kind_by_path = {
            "/api/finance/categories": "finance_category",
            "/api/finance/accounts": "finance_account",
            "/api/finance/recurrences": "finance_recurrence",
        }
        if parsed.path in setup_kind_by_path:
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                body["kind"] = setup_kind_by_path[parsed.path]

                def audit_setup(result):
                    audit_entity_type, audit_entity = result
                    append_audit(
                        AUDIT_LOG,
                        actor_id=CONTROL_PLANE_ACTOR,
                        project_id="cofrinia-finance",
                        action=f"create_finance_{audit_entity_type}",
                        result="success",
                        details={
                            f"{audit_entity_type}_id": audit_entity[f"{audit_entity_type}_id"],
                            "workspace_id": audit_entity["workspace_id"],
                        },
                    )

                entity_type, entity = mutate_setup(
                    FINANCE_SETUP,
                    lambda setup: apply_finance_setup_mutation(setup, body),
                    after_save=audit_setup,
                )
                self.send_json({"ok": True, entity_type: entity})
            except (KeyError, TypeError, ValueError, PermissionError, json.JSONDecodeError) as exc:
                self.send_json({"error": str(exc)}, 400)
            return
        if len(parts) != 4 or parts[:2] != ["api", "jobs"] or parts[3] not in {"pause", "resume", "run"}:
            self.send_json({"error": "not_found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            actor_id = str(body.get("actor_id", "web-admin"))
            confirm = bool(body.get("confirm", False))
            action = {"pause": "pause", "resume": "resume", "run": "run_now"}[parts[3]]
            jobs = list_jobs()
            job = next(item for item in jobs if item["job_id"] == parts[2])
            from job_actions import apply_job_action
            updated = apply_job_action(job, action, actor_id=actor_id, confirm=confirm)
            save_jobs(jobs)
            append_audit(AUDIT_LOG, actor_id=actor_id, project_id=job["project_id"], action=action, result="success", details={"job_id": job["job_id"]})
            self.send_json({"ok": True, "job": updated})
        except StopIteration:
            self.send_json({"error": "job_not_found"}, 404)
        except (ValueError, PermissionError, json.JSONDecodeError) as exc:
            self.send_json({"error": str(exc)}, 400)

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    port = int(os.environ.get("BINC_CONTROL_PLANE_PORT", "8790"))
    print(f"Binc Orchestrator control plane: http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
