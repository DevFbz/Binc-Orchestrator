"""Registry and summaries for Binc Orchestrator jobs."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JOBS = ROOT / "data" / "jobs.json"
REQUIRED = {"job_id", "project_id", "status", "approval_required"}


def list_jobs(path: Path = DEFAULT_JOBS) -> list[dict]:
    if not path.exists():
        return []
    jobs = json.loads(path.read_text(encoding="utf-8")).get("jobs", [])
    for job in jobs:
        missing = REQUIRED.difference(job)
        if missing:
            raise ValueError(f"job inválido: faltam {sorted(missing)}")
        if job["status"] not in {"active", "paused", "failed", "completed"}:
            raise ValueError(f"job inválido: status {job['status']}")
    return jobs


def summarize_jobs(jobs: list[dict]) -> dict:
    return {
        "total": len(jobs),
        "active": sum(job["status"] == "active" for job in jobs),
        "paused": sum(job["status"] == "paused" for job in jobs),
        "approval_required": sum(bool(job["approval_required"]) for job in jobs),
    }
