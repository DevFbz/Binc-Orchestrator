from pathlib import Path

from control_plane_server import overview_for_tenants


def test_overview_is_owned_by_orchestrator():
    tenants = [{"tenant_id": "cliente-a", "name": "Cliente A", "active": True}]
    campaigns = [{"tenant_id": "cliente-a", "status": "PUBLISHED"}]

    result = overview_for_tenants(tenants, campaigns)

    assert result["totals"] == {"tenants": 1, "campaigns": 1, "published": 1}
    assert result["tenants"][0]["campaigns_by_status"] == {"PUBLISHED": 1}
