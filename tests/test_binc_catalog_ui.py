from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_binc_erp_is_cataloged_with_honest_preparation_state():
    projects = (ROOT / "data" / "projects.json").read_text(encoding="utf-8")
    assert '"project_id": "binc-erp"' in projects
    assert '"status": "preparation"' in projects
    assert "repository_only" in projects
    assert "security_review_required" in projects


def test_dashboard_has_readable_body_type_and_elevation():
    css = (ROOT / "src" / "app" / "page.module.css").read_text(encoding="utf-8")
    assert "font-size:15px" in css or "font-size:16px" in css
    assert "box-shadow" in css


def test_sidebar_has_fixed_geometry_and_collapse_control():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "sidebarCollapsed" in shell
    assert "position:fixed" in css
    assert "--sidebar-width" in css
