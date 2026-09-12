"""Workspace-scoped RBAC policy."""
from __future__ import annotations

ROLES = {"global_admin", "workspace_admin", "reviewer", "reader"}

_ACTIONS = {
    "global_admin": {"read_terminal", "send_telegram", "create_financial_entry", "manage_jobs", "manage_onboarding"},
    "workspace_admin": {"read_terminal", "send_telegram", "create_financial_entry", "manage_jobs", "manage_onboarding"},
    "reviewer": {"read_terminal"},
    "reader": {"read_terminal"},
}


def can_perform_action(role: str, action: str) -> bool:
    return action in _ACTIONS.get(role, set())


def can_access_project(role: str, actor_workspace_id: str, project: dict) -> bool:
    if role not in ROLES:
        return False
    if role == "global_admin":
        return True
    return actor_workspace_id == project.get("workspace_id")
