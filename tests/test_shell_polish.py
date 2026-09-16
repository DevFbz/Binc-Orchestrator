from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def test_sidebar_is_fixed_and_collapsible():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "sidebarCollapsed" in shell
    assert "aria-label={sidebarCollapsed ? \"Expandir menu\" : \"Recolher menu\"}" in shell
    assert "position:fixed" in css
    assert "collapsed" in css
    assert "<span>{sidebarCollapsed ? \"Expandir menu\" : \"Recolher menu\"}</span>" in shell
    assert ".brandRow{display:grid" in css
    assert ".collapsed .collapseButton{position:static" in css
    assert "position:absolute;top:20px;right:12px" not in css


def test_collapsed_sidebar_does_not_scroll_as_a_second_page():
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "overflow:hidden" in css
    assert ".collapsed .scope" in css
    assert "display:none" in css
