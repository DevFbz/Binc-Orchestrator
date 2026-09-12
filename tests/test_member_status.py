import pytest

from member_registry import update_member_status


def test_member_status_change_requires_confirmation():
    members = [{"member_id": "operator-1", "workspace_id": "personal", "role": "reader", "status": "invited"}]
    with pytest.raises(PermissionError):
        update_member_status(members, member_id="operator-1", workspace_id="personal", status="active", confirm=False)


def test_member_status_change_is_workspace_scoped():
    members = [{"member_id": "operator-1", "workspace_id": "personal", "role": "reader", "status": "invited"}]
    updated = update_member_status(members, member_id="operator-1", workspace_id="personal", status="active", confirm=True)
    assert updated["status"] == "active"
    with pytest.raises(ValueError, match="membro"):
        update_member_status(members, member_id="operator-1", workspace_id="other", status="suspended", confirm=True)
