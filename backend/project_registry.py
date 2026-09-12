"""Registry of independent projects orchestrated by Hermes."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = ROOT / "data" / "projects.json"
REQUIRED = {"project_id", "name", "status", "tenant_scope"}
PROJECT_STATUSES = {"operational", "disabled"}


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


def save_projects(path: Path, projects: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps({"projects": projects}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def update_project_status(projects: list[dict], *, project_id: str, status: str, confirm: bool) -> dict:
    if not confirm:
        raise PermissionError("alteração de projeto exige confirmação explícita")
    if status not in PROJECT_STATUSES:
        raise ValueError("status de projeto inválido")
    for project in projects:
        if project.get("project_id") == project_id:
            project["status"] = status
            return project
    raise ValueError("projeto não encontrado")
