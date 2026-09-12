from datetime import datetime, timezone

from report_scheduler import build_schedule, is_due, schedule_key


def test_schedule_is_paused_until_explicit_activation():
    item = build_schedule("weekly", "personal", "cofrinia-finance", "telegram")
    assert item["status"] == "paused"
    assert item["approval_required"] is True
    assert item["delivery_channel"] == "telegram"


def test_schedule_due_and_idempotency_key_are_deterministic():
    due = datetime(2026, 9, 12, 12, tzinfo=timezone.utc)
    assert is_due("2026-09-12T11:00:00+00:00", due) is True
    assert is_due("2026-09-12T13:00:00+00:00", due) is False
    assert schedule_key("weekly", "personal", "2026-W37") == "weekly|personal|2026-W37"
