from project_registry import DEFAULT_REGISTRY, list_projects


def test_official_project_catalog_has_one_finance_project_and_binc_erp():
    projects = list_projects(DEFAULT_REGISTRY)
    ids = [project["project_id"] for project in projects]

    assert ids == ["instagram-content-operations", "cofrinia-finance", "binc-erp"]
    assert sum(project["project_id"] == "cofrinia-finance" for project in projects) == 1
    assert next(project for project in projects if project["project_id"] == "binc-erp")["status"] == "preparation"
    assert "personal-finance-assistant" not in ids
