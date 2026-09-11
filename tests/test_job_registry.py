from pathlib import Path

from job_registry import list_jobs, summarize_jobs


def test_job_registry_groups_jobs_by_project(tmp_path: Path):
    path = tmp_path / "jobs.json"
    path.write_text('{"jobs": [{"job_id": "j1", "project_id": "instagram-content-operations", "status": "active", "approval_required": true}, {"job_id": "j2", "project_id": "personal-finance-assistant", "status": "paused", "approval_required": false}]}', encoding="utf-8")

    jobs = list_jobs(path)
    summary = summarize_jobs(jobs)

    assert len(jobs) == 2
    assert summary == {"total": 2, "active": 1, "paused": 1, "approval_required": 1}


def test_invalid_job_is_rejected(tmp_path: Path):
    path = tmp_path / "jobs.json"
    path.write_text('{"jobs": [{"job_id": "missing status"}]}', encoding="utf-8")

    try:
        list_jobs(path)
    except ValueError as exc:
        assert "job" in str(exc).lower()
    else:
        raise AssertionError("job inválido deveria falhar")
