from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_sidebar_is_fixed_and_collapsible():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "sidebarCollapsed" in shell
    assert "aria-label={sidebarCollapsed ? \"Expandir menu\" : \"Recolher menu\"}" in shell
    assert "position:fixed" in css
    assert "collapsed" in css


def test_panel_uses_rounded_ui_font():
    globals_css = (ROOT / "src" / "app" / "globals.css").read_text(encoding="utf-8")
    assert "Nunito Sans" in globals_css
    assert "Roboto" not in globals_css
