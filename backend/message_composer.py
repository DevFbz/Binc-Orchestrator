"""Validated, idempotent administrative text dispatch through Hermes CLI."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any, Callable

HERMES_BIN = "/home/hermes/.local/bin/hermes"


def _read_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def dispatch_admin_message(payload: dict[str, Any], events: list[dict[str, Any]], outbox: Path, *, runner: Callable[..., Any] = subprocess.run) -> dict[str, Any]:
    if payload.get("confirm") is not True:
        raise PermissionError("envio administrativo exige confirmação explícita")
    conversation_id = payload.get("conversation_id")
    text = payload.get("text")
    idempotency_key = payload.get("idempotency_key")
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversa obrigatória")
    if not isinstance(text, str) or not text.strip() or len(text) > 4000:
        raise ValueError("mensagem inválida")
    if not isinstance(idempotency_key, str) or not idempotency_key.strip():
        raise ValueError("idempotency_key obrigatório")
    previous = next((item for item in _read_records(outbox) if item.get("idempotency_key") == idempotency_key), None)
    if previous and previous.get("status") in {"sent", "unknown"}:
        return {"accepted": previous.get("status") == "sent", "duplicate": True, "status": previous["status"], "idempotency_key": idempotency_key}
    target_event = next((item for item in events if item.get("conversation_id") == conversation_id and item.get("project_id") == "instagram-content-operations"), None)
    if not target_event or not target_event.get("external_user_ref") or target_event.get("external_user_ref") == "unknown":
        raise ValueError("conversa sem destinatário válido")
    command = [HERMES_BIN, "send", "--to", f"telegram:{target_event['external_user_ref']}", "--json", text.strip()]
    try:
        result = runner(command, capture_output=True, text=True, timeout=30)
        response = json.loads(result.stdout or "{}")
        status = "sent" if result.returncode == 0 and response.get("success") is True else "failed"
    except subprocess.TimeoutExpired:
        status = "unknown"
    except (OSError, ValueError, json.JSONDecodeError):
        status = "failed"
    record = {"idempotency_key": idempotency_key, "conversation_id": conversation_id, "status": status}
    outbox.parent.mkdir(parents=True, exist_ok=True)
    with outbox.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    return {"accepted": status == "sent", "duplicate": False, "status": status, "idempotency_key": idempotency_key}
