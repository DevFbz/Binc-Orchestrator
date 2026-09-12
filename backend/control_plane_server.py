#!/usr/bin/env python3
"""Binc Orchestrator control plane.

Owns project/finance routes and proxies Instagram read routes internally.
"""
from __future__ import annotations

import json
import os
from collections import Counter
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

from control_plane_auth import is_authorized
from finance import summarize_period
from finance_commands import create_financial_entry
from finance_store import load_entries, save_entry
from audit_log import append_audit, read_recent
from job_actions import apply_job_action
from job_registry import list_jobs, save_jobs, summarize_jobs
from onboarding import onboarding_checklist
from observability import summarize_health
from project_registry import list_projects
from report_engine import build_overview_report
from tenant_registry import list_tenants

ROOT = Path(__file__).resolve().parents[1]
FINANCE_ENTRIES = ROOT / "data" / "finance" / "entries.jsonl"
AUDIT_LOG = ROOT / "data" / "audit.jsonl"
WORKSPACES = ROOT / "data" / "workspaces.json"
INSTAGRAM_URL = os.environ.get("INSTAGRAM_STUDIO_URL", "http://127.0.0.1:8787")


def route_description(path: str, *, today: date | None = None):
    routes = {
        "/api/projects": "project_registry",
        "/api/jobs": "job_registry",
        "/api/reports/overview": "report_engine",
        "/api/system/health": "observability",
        "/api/audit/recent": "audit",
        "/api/onboarding": "onboarding",
        "/api/finance/summary": "finance",
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
        self.end_headers()
        self.wfile.write(raw)

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
            if path == "/api/system/health":
                services = [{"service": "binc-control-plane", "status": "operational"}]
                try:
                    request = Request(f"{INSTAGRAM_URL.rstrip('/')}/api/health", headers={"Accept": "application/json"})
                    with urlopen(request, timeout=5) as response:
                        services.append({"service": "instagram-studio", "status": "operational" if response.status < 400 else "degraded"})
                except Exception:
                    services.append({"service": "instagram-studio", "status": "failed"})
                self.send_json({"services": services, "summary": summarize_health(services)})
                return
            if path == "/api/audit/recent":
                limit = min(int(query.get("limit", [50])[0]), 200)
                self.send_json({"events": read_recent(AUDIT_LOG, limit)})
                return
            if path == "/api/onboarding":
                workspaces = json.loads(WORKSPACES.read_text(encoding="utf-8")).get("workspaces", [])
                self.send_json({"workspaces": [{**workspace, "checklist": onboarding_checklist(workspace)} for workspace in workspaces]})
                return
            if path == "/api/finance/summary":
                self.send_json(_finance_summary(query))
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
        if not is_authorized(self.headers.get("Authorization"), expected):
            self.send_json({"error": "unauthorized"}, 401)
            return
        if self.path.startswith("/api/finance/entries"):
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
                occurred_on = date.fromisoformat(str(body["occurred_on"]))
                entries = load_entries(FINANCE_ENTRIES)
                entry = create_financial_entry(entries, workspace_id=str(body["workspace_id"]), entry_type=str(body["entry_type"]), amount_cents=int(body["amount_cents"]), category=str(body["category"]), occurred_on=occurred_on, description=str(body["description"]), confirm=body.get("confirm") is True)
                save_entry(FINANCE_ENTRIES, entry)
                append_audit(AUDIT_LOG, actor_id=str(body.get("actor_id", "web-admin")), project_id="personal-finance-assistant", action="create_financial_entry", result="success", details={"entry_id": entry["entry_id"], "workspace_id": entry["workspace_id"]})
                self.send_json({"ok": True, "entry": entry})
            except (KeyError, ValueError, PermissionError, json.JSONDecodeError) as exc:
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
