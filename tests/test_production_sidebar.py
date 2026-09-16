from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_production_sidebar_matches_dark_reference_structure():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert 'href="/settings"' in shell
    assert "Configurações" in shell
    assert "position:fixed" in css
    assert "--sidebar-width:250px" in css
    assert ".sidebar::after" in css
    assert ".collapseButton{position:absolute" in css
    assert "border-radius:50%" in css
    assert "#111820" in css
    assert "#18232D" in css
    assert "#0B1117" in css
    assert "#FF6B1A" in css
    assert "#16232b" not in css
