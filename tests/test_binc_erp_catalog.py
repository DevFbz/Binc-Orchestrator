from pathlib import Path

from project_registry import list_projects


def test_binc_erp_is_cataloged_with_honest_preparation_state():
    projects = list_projects(Path(__file__).parents[1] / "data" / "projects.json")
    project = next(item for item in projects if item["project_id"] == "binc-erp")
    assert project["repository"] == "https://github.com/DevFbz/binc-atualizado"
    assert project["status"] == "preparation"
    assert project["integration_state"] == "repository_only"
    assert "security_review_required" in project["capabilities"]
