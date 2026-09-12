from project_registry import DEFAULT_REGISTRY, list_projects


def test_official_project_catalog_has_one_finance_project():
    projects = list_projects(DEFAULT_REGISTRY)
    ids = [project["project_id"] for project in projects]

    assert ids == ["instagram-content-operations", "cofrinia-finance"]
    assert "personal-finance-assistant" not in ids
