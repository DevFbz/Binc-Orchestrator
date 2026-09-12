"""Validated, append-only Telegram event storage for the Instagram terminal."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from threading import Lock
from typing import Any

_LOCK = Lock()
_ALLOWED_DIRECTIONS = {"inbound", "outbound"}
_ALLOWED_ACTORS = {"user", "hermes", "admin_assisted"}
_ALLOWED_MESSAGE_TYPES = {"text", "image", "document", "system"}
_ALLOWED_DELIVERY = {"received", "queued", "sent", "failed", "unknown"}
_REQUIRED = {
    "event_id",
    "occurred_at",
    "channel",
    "direction",
    "actor_type",
    "workspace_id",
    "conversation_id",
    "external_user_ref",
    "message_type",
    "delivery_status",
    "correlation_id",
}


def _required_string(payload: dict[str, Any], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"campo obrigatório inválido: {key}")
    return value.strip()


def validate_telegram_event(payload: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("evento inválido")
    missing = sorted(_REQUIRED - payload.keys())
    if missing:
        raise ValueError("campos obrigatórios ausentes")
    event = dict(payload)
    for key in _REQUIRED:
        event[key] = _required_string(event, key)
    if event["channel"] != "telegram":
        raise ValueError("canal não permitido")
    if event["project_id"] != "instagram-content-operations":
        raise ValueError("projeto não permitido no terminal Instagram")
    if event["direction"] not in _ALLOWED_DIRECTIONS:
        raise ValueError("direção inválida")
    if event["actor_type"] not in _ALLOWED_ACTORS:
        raise ValueError("tipo de ator inválido")
    if event["message_type"] not in _ALLOWED_MESSAGE_TYPES:
        raise ValueError("tipo de mensagem inválido")
    if event["delivery_status"] not in _ALLOWED_DELIVERY:
        raise ValueError("estado de entrega inválido")
    try:
        datetime.fromisoformat(event["occurred_at"].replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("data do evento inválida") from exc
    tenant_id = event.get("tenant_id")
    if tenant_id is not None and (not isinstance(tenant_id, str) or not tenant_id.strip()):
        raise ValueError("escopo de tenant inválido")
    if tenant_id and tenant_id != event["workspace_id"]:
        raise ValueError("escopo de tenant incompatível com workspace")
    text = event.get("text")
    media_ref = event.get("media_ref")
    if text is not None and not isinstance(text, str):
        raise ValueError("texto inválido")
    if media_ref is not None and not isinstance(media_ref, str):
        raise ValueError("referência de mídia inválida")
    if not (isinstance(text, str) and text.strip()) and not (isinstance(media_ref, str) and media_ref.strip()):
        raise ValueError("evento precisa conter texto ou mídia")
    for key in ("project_id", "campaign_id", "intent", "text", "media_ref", "tenant_id"):
        if key in event and event[key] is not None and isinstance(event[key], str):
            event[key] = event[key].strip()
    return event


def _read_all(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def append_telegram_event(path: Path, payload: dict[str, Any]) -> dict[str, Any]:
    event = validate_telegram_event(payload)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _LOCK:
        existing = _read_all(path)
        if any(item.get("event_id") == event["event_id"] for item in existing):
            return {"accepted": True, "duplicate": True, "event_id": event["event_id"]}
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n")
            handle.flush()
        return {"accepted": True, "duplicate": False, "event_id": event["event_id"]}


def filter_telegram_events(events: list[dict[str, Any]], *, query: str = "", delivery_status: str = "", campaign_id: str = "") -> list[dict[str, Any]]:
    needle = query.strip().casefold()
    result = []
    for event in events:
        haystack = " ".join(str(event.get(key, "")) for key in ("text", "external_user_ref", "conversation_id", "campaign_id", "post_id")).casefold()
        if needle and needle not in haystack:
            continue
        if delivery_status and event.get("delivery_status") != delivery_status:
            continue
        if campaign_id and event.get("campaign_id") != campaign_id:
            continue
        result.append(event)
    return result


def read_recent_events(path: Path, limit: int = 100, *, workspace_id: str | None = None) -> list[dict[str, Any]]:
    if limit <= 0:
        return []
    rows = _read_all(path)
    if workspace_id is not None:
        rows = [row for row in rows if row.get("workspace_id") == workspace_id]
    return rows[-min(limit, 500):]
