from report_engine import build_overview_report


def test_overview_report_declares_period_sources_and_sections():
    report = build_overview_report(
        "2026-09-01",
        "2026-09-30",
        projects=[{"project_id": "instagram", "status": "operational"}],
        jobs={"summary": {"total": 2, "active": 1, "paused": 1}},
        campaigns={"total": 4, "published": 1},
        finance={"income_cents": 10000, "expense_cents": 2500, "balance_cents": 7500, "entries": 3},
    )

    assert report["period"] == {"start": "2026-09-01", "end": "2026-09-30"}
    assert report["sources"] == ["project_registry", "job_registry", "campaign_history", "finance_ledger"]
    assert report["sections"]["projects"]["total"] == 1
    assert report["sections"]["finance"]["balance_cents"] == 7500


def test_report_rejects_invalid_period():
    try:
        build_overview_report("2026-10-01", "2026-09-30", [], {}, {}, {})
    except ValueError:
        pass
    else:
        raise AssertionError("período inválido deveria falhar")
