import pytest

from onboarding import onboarding_checklist, validate_workspace
from rbac import can_access_project


def test_onboarding_checklist_identifies_missing_setup():
    workspace = {"workspace_id": "client-a", "name": "Client A", "projects": [], "integrations": []}
    result = onboarding_checklist(workspace)

    assert result["complete"] is False
    assert "project" in result["missing"]
    assert "integration" in result["missing"]


def test_workspace_validation_requires_isolation_fields():
    assert validate_workspace({"workspace_id": "client-a", "name": "Client A", "owner_id": "u1"}) is True
    with pytest.raises(ValueError):
        validate_workspace({"name": "Sem ID"})


def test_project_access_isolated_by_workspace_and_role():
    project = {"project_id": "instagram", "workspace_id": "client-a"}
    assert can_access_project("global_admin", "client-b", project) is True
    assert can_access_project("workspace_admin", "client-a", project) is True
    assert can_access_project("workspace_admin", "client-b", project) is False
    assert can_access_project("reader", "client-a", project) is True
