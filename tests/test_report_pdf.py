import re
import unicodedata

from report_pdf import report_to_pdf


def test_report_pdf_has_valid_header_and_safe_labels():
    report = {"period": {"start": "2026-09-01", "end": "2026-09-30"}, "sources": ["project_registry"], "sections": {"projects": {"total": 2}, "campaigns": {"published": 1}, "finance": {"balance_cents": 2500}}}
    pdf = report_to_pdf(report)
    assert pdf.startswith(b"%PDF-1.4")
    text = pdf.decode("latin-1")
    assert "Binc OS" in text
    assert "2026-09-01" in text
    assert "project_registry" in text
