from datetime import date

from control_plane_server import route_description


def test_route_description_separates_project_and_finance_domains():
    assert route_description("/api/projects") == "project_registry"
    assert route_description("/api/finance/summary") == "finance"
    assert route_description("/api/campaigns") == "instagram_proxy"
    assert route_description("/unknown") is None


def test_period_defaults_are_current_month():
    start, end = route_description("/api/finance/summary", today=date(2026, 9, 10))
    assert start == "2026-09-01"
    assert end == "2026-09-10"
