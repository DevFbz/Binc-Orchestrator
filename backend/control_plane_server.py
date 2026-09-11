#!/usr/bin/env python3
"""Binc Orchestrator control plane.

Owns project/finance routes and proxies Instagram read routes internally.
"""
from __future__ import annotations

import json
import os
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

from control_plane_auth import is_authorized
from finance import summarize_period
from finance_store import load_entries
from project_registry import list_projects

ROOT = Path(__file__).resolve().parents[1]
FINANCE_ENTRIES = ROOT / "data" / "finance" / "entries.jsonl"
INSTAGRAM_URL = os.environ.get("INSTAGRAM_STUDIO_URL", "http://127.0.0.1:8787")


def route_description(path: str, *, today: date | None = None):
    routes = {
        "/api/projects": "project_registry",
        "/api/finance/summary": "finance",
        "/api/campaigns": "instagram_proxy",
        "/api/tenants": "instagram_proxy",
        "/api/admin/overview": "instagram_proxy",
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
            if path == "/api/finance/summary":
                self.send_json(_finance_summary(query))
                return
            if route_description(path) == "instagram_proxy":
                target = f"{INSTAGRAM_URL.rstrip('/')}{self.path}"
                request = Request(target, headers={"Authorization": self.headers.get("Authorization", ""), "Accept": "application/json"})
                with urlopen(request, timeout=20) as response:
                    self.send_json(json.loads(response.read().decode("utf-8")), response.status)
                return
        except Exception as exc:
            self.send_json({"error": "upstream_unavailable", "detail": str(exc)}, 502)
            return
        self.send_json({"error": "not_found"}, 404)

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    port = int(os.environ.get("BINC_CONTROL_PLANE_PORT", "8790"))
    print(f"Binc Orchestrator control plane: http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
