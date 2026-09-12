from observability import summarize_metrics


def test_metrics_count_operational_events_without_exposing_content():
    result = summarize_metrics(
        [{"direction": "inbound", "delivery_status": "received"}, {"direction": "outbound", "delivery_status": "failed"}],
        [{"action": "admin_send_telegram", "result": "failed"}, {"action": "pause", "result": "success"}],
        [{"status": "active"}, {"status": "paused"}],
    )
    assert result == {"events_total": 2, "inbound_events": 1, "outbound_events": 1, "delivery_failures": 1, "audit_failures": 1, "jobs_active": 1, "jobs_paused": 1}
