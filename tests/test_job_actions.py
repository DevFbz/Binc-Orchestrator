import pytest

from job_actions import apply_job_action


def job(status="active"):
    return {"job_id": "j1", "project_id": "p1", "status": status, "approval_required": True}


def test_pause_and_resume_job():
    paused = apply_job_action(job(), "pause", actor_id="admin", confirm=False)
    assert paused["status"] == "paused"
    resumed = apply_job_action(paused, "resume", actor_id="admin", confirm=False)
    assert resumed["status"] == "active"
    assert [event["action"] for event in resumed["audit"]] == ["pause", "resume"]


def test_run_now_requires_explicit_confirmation():
    with pytest.raises(PermissionError):
        apply_job_action(job(), "run_now", actor_id="admin", confirm=False)

    result = apply_job_action(job(), "run_now", actor_id="admin", confirm=True)
    assert result["last_manual_run_by"] == "admin"
    assert result["audit"][-1]["action"] == "run_now"


def test_invalid_transition_is_rejected():
    with pytest.raises(ValueError):
        apply_job_action(job("paused"), "pause", actor_id="admin", confirm=False)
