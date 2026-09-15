from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_primary_navigation_has_no_tasks_or_parallel_campaigns_route():
    navigation = (ROOT / "src" / "components" / "navigation.ts").read_text(encoding="utf-8")
    assert 'id: "tasks"' not in navigation
    assert 'href: "/jobs"' in navigation
    assert 'href: "/projects"' in navigation
    assert 'href: "/reports"' in navigation
    assert 'href: "/terminal"' in navigation


def test_layout_uses_one_application_shell():
    layout = (ROOT / "src" / "app" / "layout.tsx").read_text(encoding="utf-8")
    assert "AppShell" in layout


def test_project_list_has_open_action_and_detail_owns_campaigns():
    projects = (ROOT / "src" / "app" / "projects" / "page.tsx").read_text(encoding="utf-8")
    detail = (ROOT / "src" / "app" / "projects" / "[projectId]" / "page.tsx").read_text(encoding="utf-8")
    assert "Abrir <ArrowUpRight" in projects
    assert "Campanhas" in detail
    assert 'href="/campaigns"' not in projects


def test_legacy_campaigns_route_redirects_to_instagram_project_tab():
    campaigns = (ROOT / "src" / "app" / "campaigns" / "page.tsx").read_text(encoding="utf-8")
    assert 'redirect("/projects/instagram-content-operations#campaigns")' in campaigns
