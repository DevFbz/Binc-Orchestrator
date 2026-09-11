from observability import summarize_health


def test_health_summary_counts_service_states():
    result = summarize_health([
        {"service": "binc-control-plane", "status": "operational"},
        {"service": "instagram-studio", "status": "operational"},
        {"service": "telegram", "status": "degraded"},
    ])

    assert result == {"total": 3, "operational": 2, "degraded": 1, "failed": 0}


def test_health_summary_handles_failed_service():
    result = summarize_health([{"service": "instagram", "status": "failed"}])
    assert result["failed"] == 1
