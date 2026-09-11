"""Append-only audit events for the Binc control plane."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path


def append_audit(path: Path, *, actor_id: str, project_id: str, action: str, result: str, details: dict | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    event = {"timestamp": datetime.now(timezone.utc).isoformat(), "actor_id": actor_id, "project_id": project_id, "action": action, "result": result, "details": details or {}}
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")


def read_recent(path: Path, limit: int = 50) -> list[dict]:
    if not path.exists():
        return []
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return rows[-limit:]
