from pathlib import Path

import pytest

from message_composer import dispatch_admin_message


def event():
    return {"event_id": "evt-1", "conversation_id": "conv-1", "external_user_ref": "12345", "workspace_id": "magu-moto-pecas-filho", "project_id": "instagram-content-operations"}


def runner_ok(command, **kwargs):
    class Result:
        returncode = 0
        stdout = '{"success": true}'
        stderr = ""
    return Result()


def test_message_requires_confirmation(tmp_path: Path):
    with pytest.raises(PermissionError):
        dispatch_admin_message({"conversation_id": "conv-1", "text": "Olá", "idempotency_key": "req-1", "confirm": False}, [event()], tmp_path / "outbox.jsonl", runner=runner_ok)


def test_confirmed_message_is_sent_once_and_persisted(tmp_path: Path):
    path = tmp_path / "outbox.jsonl"
    payload = {"conversation_id": "conv-1", "text": "Olá", "idempotency_key": "req-1", "confirm": True}
    first = dispatch_admin_message(payload, [event()], path, runner=runner_ok)
    second = dispatch_admin_message(payload, [event()], path, runner=runner_ok)
    assert first["status"] == "sent"
    assert second["duplicate"] is True


def test_message_rejects_unknown_conversation(tmp_path: Path):
    with pytest.raises(ValueError, match="conversa"):
        dispatch_admin_message({"conversation_id": "missing", "text": "Olá", "idempotency_key": "req-2", "confirm": True}, [event()], tmp_path / "outbox.jsonl", runner=runner_ok)
