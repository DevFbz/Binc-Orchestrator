from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_production_sidebar_uses_blue_dark_reference_structure():
    shell = (ROOT / "src" / "components" / "AppShell.tsx").read_text(encoding="utf-8")
    css = (ROOT / "src" / "components" / "AppShell.module.css").read_text(encoding="utf-8")
    assert 'href="/settings"' in shell
    assert "Configurações" in shell
    assert "--sidebar-width:250px" in css
    assert "position:fixed" in css
    assert ".sidebar::after" in css
    assert ".collapseButton{position:absolute" in css
    assert "border-radius:50%" in css
    assert "linear-gradient(180deg,#111820 0%,#18232D 100%)" in css
    assert "background:#18232D" in css
    assert "#0B1117" in css
    assert "#FF6B1A" in css
    assert "#ae4bd2" not in css
