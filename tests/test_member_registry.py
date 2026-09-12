from pathlib import Path

import pytest

from member_registry import list_workspace_members, validate_member


def test_member_requires_workspace_role_and_status():
    member = validate_member({"member_id": "admin", "workspace_id": "personal", "role": "global_admin", "status": "active"})
    assert member["workspace_id"] == "personal"
    with pytest.raises(ValueError):
        validate_member({"member_id": "x", "workspace_id": "personal", "role": "unknown", "status": "active"})


def test_member_listing_is_workspace_scoped(tmp_path: Path):
    path = tmp_path / "members.json"
    path.write_text('{"members":[{"member_id":"a","workspace_id":"one","role":"reader","status":"active"},{"member_id":"b","workspace_id":"two","role":"reader","status":"active"}]}', encoding="utf-8")
    assert [m["member_id"] for m in list_workspace_members(path, "one")] == ["a"]
