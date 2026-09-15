from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_shell_owns_persistent_desktop_navigation():
    layout = (ROOT / "src" / "app" / "layout.tsx").read_text(encoding="utf-8")
    shell = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "AppShell" in layout
    assert "position:fixed" in shell
    assert "height:100dvh" in shell


def test_navigation_has_automations_but_no_tasks():
    navigation = (ROOT / "src" / "components" / "navigation.ts").read_text(encoding="utf-8")
    mobile = (ROOT / "src" / "components" / "MobileNav.tsx").read_text(encoding="utf-8")
    assert 'id: "tasks"' not in navigation
    assert 'label: "Automações"' in navigation
    assert "MOBILE_PRIMARY_ITEMS" in mobile
    assert "MOBILE_MORE_ITEMS" in mobile


def test_projects_open_details_and_details_own_management_and_campaigns():
    projects = (ROOT / "src" / "app" / "projects" / "page.tsx").read_text(encoding="utf-8")
    detail = (ROOT / "src" / "app" / "projects" / "[projectId]" / "page.tsx").read_text(encoding="utf-8")
    assert "Abrir <ArrowUpRight" in projects
    assert "project_status" not in projects
    assert "project_status" in detail
    assert "Campanhas" in detail


def test_feature_pages_use_their_dedicated_shared_panels():
    reports = (ROOT / "src" / "app" / "reports" / "page.tsx").read_text(encoding="utf-8")
    onboarding = (ROOT / "src" / "app" / "onboarding" / "page.tsx").read_text(encoding="utf-8")
    terminal = (ROOT / "src" / "app" / "terminal" / "page.tsx").read_text(encoding="utf-8")
    assert "ReportPanel" in reports
    assert "GovernancePanel" in onboarding
    assert "TerminalPanel" in terminal


def test_legacy_campaigns_route_redirects_to_instagram_project_tab():
    campaigns = (ROOT / "src" / "app" / "campaigns" / "page.tsx").read_text(encoding="utf-8")
    assert 'redirect("/projects/instagram-content-operations#campaigns")' in campaigns


def test_finance_route_stays_inside_binc_and_next_uses_proxy_convention():
    finance = (ROOT / "src" / "app" / "finance" / "page.tsx").read_text(encoding="utf-8")
    proxy = ROOT / "src" / "proxy.ts"
    assert "github.com" not in finance
    assert proxy.exists()
    assert "export function proxy" in proxy.read_text(encoding="utf-8")
