"""Safe CSV export for executive report summaries."""
from __future__ import annotations

import csv
import io


def report_to_csv(report: dict) -> str:
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(["section", "metric", "value"])
    period = report.get("period", {})
    writer.writerow(["period", "start", period.get("start", "")])
    writer.writerow(["period", "end", period.get("end", "")])
    for source in report.get("sources", []):
        writer.writerow(["source", "name", source])
    sections = report.get("sections", {})
    projects = sections.get("projects", {})
    campaigns = sections.get("campaigns", {})
    finance = sections.get("finance", {})
    job_summary = sections.get("jobs", {}).get("summary", {})
    metrics = {
        "projects": {"total": projects.get("total", 0)},
        "jobs": {key: job_summary.get(key, 0) for key in ("total", "active", "paused")},
        "campaigns": {key: campaigns.get(key, 0) for key in ("total", "published")},
        "finance": {key: finance.get(key, 0) for key in ("income_cents", "expense_cents", "balance_cents", "entries")},
    }
    for section, values in metrics.items():
        for metric, value in values.items():
            writer.writerow([section, metric, value])
    for limitation in report.get("limitations", []):
        writer.writerow(["limitation", "text", limitation])
    return output.getvalue()
