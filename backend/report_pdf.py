"""Dependency-free PDF summary generator for executive reports."""
from __future__ import annotations

import re
import unicodedata


def _plain(value: object) -> str:
    return unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")


def _escape(value: object) -> str:
    return _plain(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")[:180]


def _lines(report: dict) -> list[str]:
    period = report.get("period", {})
    sections = report.get("sections", {})
    projects = sections.get("projects", {})
    campaigns = sections.get("campaigns", {})
    finance = sections.get("finance", {})
    jobs = sections.get("jobs", {}).get("summary", {})
    lines = [
        "Binc OS - Relatorio executivo",
        f"Periodo: {period.get('start', '')} ate {period.get('end', '')}",
        "",
        "Fontes:",
        *[f"- {source}" for source in report.get("sources", [])],
        "",
        "Metricas:",
        f"Projetos: {projects.get('total', 0)}",
        f"Jobs totais: {jobs.get('total', 0)} | ativos: {jobs.get('active', 0)} | pausados: {jobs.get('paused', 0)}",
        f"Campanhas: {campaigns.get('total', 0)} | publicadas: {campaigns.get('published', 0)}",
        f"Saldo financeiro (centavos): {finance.get('balance_cents', 0)}",
        "",
        "Limitacoes:",
        *[f"- {item}" for item in report.get("limitations", [])],
    ]
    return lines[:45]


def report_to_pdf(report: dict) -> bytes:
    stream_lines = ["BT", "/F1 12 Tf", "50 790 Td"]
    for index, line in enumerate(_lines(report)):
        if index:
            stream_lines.append("0 -16 Td")
        stream_lines.append(f"({_escape(line)}) Tj")
    stream_lines.append("ET")
    stream = "\n".join(stream_lines).encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(len(output))
        output.extend(f"{number} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode("ascii"))
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("ascii"))
    return bytes(output)
