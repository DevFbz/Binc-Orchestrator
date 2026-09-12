import csv
import io

from report_export import report_to_csv


def test_report_csv_contains_period_sources_and_metrics():
    report = {"period": {"start": "2026-09-01", "end": "2026-09-30"}, "sources": ["project_registry"], "sections": {"projects": {"total": 2}, "campaigns": {"total": 4, "published": 1}, "finance": {"balance_cents": 2500}}}
    rows = list(csv.reader(io.StringIO(report_to_csv(report))))
    assert ["period", "start", "2026-09-01"] in rows
    assert ["source", "name", "project_registry"] in rows
    assert ["campaigns", "published", "1"] in rows
    assert ["finance", "balance_cents", "2500"] in rows
