from pathlib import Path


HTML = (Path(__file__).parents[1] / "dashboard-binc-orchestrator-v2.html").read_text(encoding="utf-8")


def test_sidebar_reference_button_has_attached_circle_and_dynamic_direction():
    assert "right:-20px;top:31px;width:40px;height:40px" in HTML
    assert "button.querySelector('span:last-child').textContent" in HTML
    assert "background:linear-gradient(180deg,#241631 0%,#11151d 100%)" in HTML
