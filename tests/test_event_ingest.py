from pathlib import Path

import pytest

from control_plane_server import ingest_telegram_event
from test_event_store import event


def test_ingest_requires_server_to_server_token(tmp_path: Path):
    with pytest.raises(PermissionError, match="não autorizado"):
        ingest_telegram_event(event(), "Bearer wrong", "expected", tmp_path / "events.jsonl")


def test_ingest_returns_idempotent_result_for_authorized_gateway(tmp_path: Path):
    result = ingest_telegram_event(event(), "Bearer expected", "expected", tmp_path / "events.jsonl")

    assert result == (202, {"accepted": True, "duplicate": False, "event_id": "evt-1"})
