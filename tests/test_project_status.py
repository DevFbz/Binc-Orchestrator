import pytest

from project_registry import update_project_status


def test_project_status_requires_confirmation():
    projects = [{"project_id": "p1", "name": "Projeto", "status": "operational", "tenant_scope": "private"}]
    with pytest.raises(PermissionError):
        update_project_status(projects, project_id="p1", status="disabled", confirm=False)


def test_project_can_be_enabled_and_disabled():
    projects = [{"project_id": "p1", "name": "Projeto", "status": "operational", "tenant_scope": "private"}]
    disabled = update_project_status(projects, project_id="p1", status="disabled", confirm=True)
    assert disabled["status"] == "disabled"
    enabled = update_project_status(projects, project_id="p1", status="operational", confirm=True)
    assert enabled["status"] == "operational"


def test_unknown_project_is_rejected():
    with pytest.raises(ValueError, match="projeto"):
        update_project_status([], project_id="missing", status="disabled", confirm=True)
