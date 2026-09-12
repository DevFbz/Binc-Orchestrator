import pytest

from member_registry import create_member


def test_member_creation_requires_confirmation():
    with pytest.raises(PermissionError):
        create_member([], member_id="operator-1", workspace_id="personal", role="reader", confirm=False)


def test_member_creation_starts_invited_and_prevents_duplicate():
    members = []
    created = create_member(members, member_id="operator-1", workspace_id="personal", role="reader", confirm=True)
    assert created["status"] == "invited"
    assert len(members) == 1
    with pytest.raises(ValueError, match="duplicado"):
        create_member(members, member_id="operator-1", workspace_id="personal", role="reader", confirm=True)
