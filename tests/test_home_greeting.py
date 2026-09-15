from pathlib import Path


def test_home_has_time_aware_personal_greeting():
    page = (Path(__file__).parents[1] / "src" / "app" / "page.tsx").read_text(encoding="utf-8")
    assert "getGreeting" in page
    assert "Breno" in page
    assert "America/Sao_Paulo" in page
