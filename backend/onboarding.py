"""Workspace onboarding validation and checklist."""
from __future__ import annotations

REQUIRED = {"workspace_id", "name", "owner_id"}


def validate_workspace(workspace: dict) -> bool:
    missing = REQUIRED.difference(workspace)
    if missing:
        raise ValueError(f"workspace inválido: faltam {sorted(missing)}")
    if not workspace["workspace_id"].strip():
        raise ValueError("workspace_id vazio")
    return True


def onboarding_checklist(workspace: dict) -> dict:
    missing = []
    if not workspace.get("projects"):
        missing.append("project")
    if not workspace.get("integrations"):
        missing.append("integration")
    if not workspace.get("members"):
        missing.append("member")
    if not workspace.get("approval_policy"):
        missing.append("approval_policy")
    return {"workspace_id": workspace.get("workspace_id"), "complete": not missing, "missing": missing}
