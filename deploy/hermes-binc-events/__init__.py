"""Non-blocking Hermes hook that mirrors authorized Instagram Telegram turns to Binc."""
from __future__ import annotations

import hashlib
import json
import os
import threading
import urllib.request
from datetime import datetime, timezone

_WORKSPACE_ID = "magu-moto-pecas-filho"
_PROJECT_ID = "instagram-content-operations"


def _event_id(prefix: str, session_id: str, turn_id: str | None, text: str) -> str:
    raw = f"{prefix}|{session_id}|{turn_id or ''}|{text}"
    return f"{prefix}-{hashlib.sha256(raw.encode('utf-8')).hexdigest()[:32]}"


def build_event(*, direction: str, actor_type: str, session_id: str, sender_id: str, text: str, turn_id: str | None, delivery_status: str) -> dict:
    return {
        "event_id": _event_id("telegram-in" if direction == "inbound" else "telegram-out", session_id, turn_id, text),
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "channel": "telegram",
        "direction": direction,
        "actor_type": actor_type,
        "workspace_id": _WORKSPACE_ID,
        "tenant_id": _WORKSPACE_ID,
        "project_id": _PROJECT_ID,
        "conversation_id": session_id,
        "external_user_ref": sender_id,
        "message_type": "text",
        "text": text,
        "media_ref": None,
        "campaign_id": None,
        "intent": None,
        "delivery_status": delivery_status,
        "correlation_id": session_id,
    }


def _post(event: dict) -> None:
    url = os.environ.get("BINC_EVENT_INGEST_URL", "http://127.0.0.1:8791/api/events/telegram")
    token = os.environ.get("HERMES_EVENT_INGEST_TOKEN", "")
    if not token:
        return
    request = urllib.request.Request(
        url,
        data=json.dumps(event, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=5):
            pass
    except (OSError, ValueError):
        return


def _send_async(event: dict) -> None:
    threading.Thread(target=_post, args=(event,), daemon=True, name="binc-event-ingest").start()


def on_pre_llm_call(user_message: str, session_id: str, platform: str, sender_id: str | None = None, turn_id: str | None = None, **kwargs) -> None:
    del kwargs
    if platform != "telegram" or not user_message or not session_id:
        return
    _send_async(build_event(direction="inbound", actor_type="user", session_id=session_id, sender_id=sender_id or "unknown", text=user_message[:12000], turn_id=turn_id, delivery_status="received"))


def on_post_llm_call(user_message: str, assistant_response: str, session_id: str, platform: str, turn_id: str | None = None, **kwargs) -> None:
    del user_message, kwargs
    if platform != "telegram" or not assistant_response or not session_id:
        return
    _send_async(build_event(direction="outbound", actor_type="hermes", session_id=session_id, sender_id="unknown", text=assistant_response[:12000], turn_id=turn_id, delivery_status="unknown"))


def register(ctx):
    ctx.register_hook("pre_llm_call", on_pre_llm_call)
    ctx.register_hook("post_llm_call", on_post_llm_call)
