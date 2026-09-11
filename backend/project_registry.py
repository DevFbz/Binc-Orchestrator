"""Registry of independent projects orchestrated by Hermes."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).parent
DEFAULT_REGISTRY = ROOT / "data" / "projects.json"
REQUIRED = {"project_id", "name", "status", "tenant_scope"}


def list_projects(path: Path = DEFAULT_REGISTRY) -> list[dict]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    projects = payload.get("projects", [])
    for project in projects:
        missing = REQUIRED.difference(project)
        if missing:
            raise ValueError(f"projeto inválido: faltam {sorted(missing)}")
    return projects
