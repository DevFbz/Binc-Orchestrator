"""Explicit, auditable job actions."""
from __future__ import annotations

from datetime import datetime, timezone


def apply_job_action(job: dict, action: str, *, actor_id: str, confirm: bool) -> dict:
    if not actor_id:
        raise PermissionError("ator obrigatório")
    status = job.get("status")
    if action == "pause":
        if status != "active":
            raise ValueError("somente job ativo pode ser pausado")
        next_status = "paused"
    elif action == "resume":
        if status != "paused":
            raise ValueError("somente job pausado pode ser retomado")
        next_status = "active"
    elif action == "run_now":
        if not confirm:
            raise PermissionError("executar agora exige confirmação explícita")
        next_status = status
    else:
        raise ValueError("ação de job inválida")

    timestamp = datetime.now(timezone.utc).isoformat()
    job["status"] = next_status
    job.setdefault("audit", []).append({"timestamp": timestamp, "actor_id": actor_id, "action": action, "status": next_status})
    if action == "run_now":
        job["last_manual_run_by"] = actor_id
        job["last_manual_run_at"] = timestamp
    return job
