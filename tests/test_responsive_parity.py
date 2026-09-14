from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_web_and_mobile_use_one_navigation_contract():
    navigation = ROOT / "src" / "components" / "navigation.ts"
    mobile_nav = (ROOT / "src" / "components" / "MobileNav.tsx").read_text(encoding="utf-8")
    home = (ROOT / "src" / "app" / "page.tsx").read_text(encoding="utf-8")
    assert navigation.exists()
    assert "NAV_ITEMS" in mobile_nav
    assert "NAV_ITEMS" in home


def test_desktop_sidebar_stays_visible_while_content_scrolls():
    css = (ROOT / "src" / "app" / "page.module.css").read_text(encoding="utf-8")
    assert "position:sticky" in css
    assert "height:100dvh" in css


def test_reports_are_available_in_the_shell_without_open_report_route():
    home = (ROOT / "src" / "app" / "page.tsx").read_text(encoding="utf-8")
    report_panel = (ROOT / "src" / "components" / "ReportPanel.tsx").read_text(encoding="utf-8")
    assert "href=\"/reports\"" not in home
    assert "ReportPanel" in home
    assert "Aplicar filtros" in report_panel
    assert "Exportar CSV" in report_panel


def test_governance_uses_one_shared_panel_with_mobile_actions():
    home = (ROOT / "src" / "app" / "page.tsx").read_text(encoding="utf-8")
    component = ROOT / "src" / "components" / "GovernancePanel.tsx"
    assert component.exists()
    content = component.read_text(encoding="utf-8")
    assert "GovernancePanel" in home
    assert "Novo membro" in content
    assert "Suspender" in content
    assert "workspace_id" in content


def test_terminal_uses_one_shared_panel_with_filters_and_composer():
    home = (ROOT / "src" / "app" / "page.tsx").read_text(encoding="utf-8")
    component = ROOT / "src" / "components" / "TerminalPanel.tsx"
    assert component.exists()
    content = component.read_text(encoding="utf-8")
    assert "TerminalPanel" in home
    assert "Buscar eventos" in content
    assert "Enviar pelo Hermes" in content


def test_projects_route_exposes_the_same_project_status_control():
    projects = (ROOT / "src" / "app" / "projects" / "page.tsx").read_text(encoding="utf-8")
    assert "project_status" in projects
    assert "Ativar" in projects
    assert "Desativar" in projects


def test_finance_route_does_not_redirect_to_external_repository():
    finance = (ROOT / "src" / "app" / "finance" / "page.tsx").read_text(encoding="utf-8")
    assert "redirect(\"https://github.com" not in finance


def test_project_detail_exposes_the_same_project_status_control():
    detail = (ROOT / "src" / "app" / "projects" / "[projectId]" / "page.tsx").read_text(encoding="utf-8")
    assert "project_status" in detail
    assert "Ativar" in detail
    assert "Desativar" in detail


def test_next16_uses_proxy_convention():
    proxy = ROOT / "src" / "proxy.ts"
    middleware = ROOT / "src" / "middleware.ts"
    assert proxy.exists()
    assert not middleware.exists()
    assert "export function proxy" in proxy.read_text(encoding="utf-8")
