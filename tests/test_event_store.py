import json
from pathlib import Path

import pytest

from event_store import append_telegram_event, read_recent_events, validate_telegram_event


def event(event_id="evt-1", workspace_id="magu-moto-pecas-filho"):
    return {
        "event_id": event_id,
        "occurred_at": "2026-09-12T12:00:00Z",
        "channel": "telegram",
        "direction": "inbound",
        "actor_type": "user",
        "workspace_id": workspace_id,
        "tenant_id": "magu-moto-pecas-filho",
        "project_id": "instagram-content-operations",
        "conversation_id": "conv-1",
        "external_user_ref": "telegram-user-1",
        "message_type": "text",
        "text": "Quero postar o produto X",
        "media_ref": None,
        "campaign_id": None,
        "intent": "create_campaign",
        "delivery_status": "received",
        "correlation_id": "corr-1",
    }


def test_validates_and_persists_telegram_event_once(tmp_path: Path):
    path = tmp_path / "events.jsonl"

    first = append_telegram_event(path, event())
    duplicate = append_telegram_event(path, event())

    assert first == {"accepted": True, "duplicate": False, "event_id": "evt-1"}
    assert duplicate == {"accepted": True, "duplicate": True, "event_id": "evt-1"}
    assert len(read_recent_events(path)) == 1
    assert json.loads(path.read_text(encoding="utf-8").splitlines()[0])["workspace_id"] == "magu-moto-pecas-filho"


def test_rejects_finance_event_in_instagram_terminal():
    payload = event()
    payload["project_id"] = "cofrinia-finance"

    with pytest.raises(ValueError, match="projeto não permitido"):
        validate_telegram_event(payload)


def test_rejects_cross_workspace_tenant_reference():
    payload = event(workspace_id="workspace-a")
    payload["tenant_id"] = "workspace-b"

    with pytest.raises(ValueError, match="escopo"):
        validate_telegram_event(payload)


def test_rejects_missing_text_and_media():
    payload = event()
    payload["text"] = None
    payload["media_ref"] = None

    with pytest.raises(ValueError, match="texto ou mídia"):
        validate_telegram_event(payload)
