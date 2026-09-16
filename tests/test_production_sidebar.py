from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_production_sidebar_keeps_previous_geometry_with_new_dark_colors():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert "href=\"/settings\"" not in shell
    assert "Configurações" not in shell
    assert "--sidebar-width:244px" in css
    assert "position:fixed" in css
    assert ".sidebar::after" not in css
    assert "#111820" in css
    assert "#18232D" in css
    assert "#0B1117" in css
    assert "#FF6B1A" in css
