"""Private image validation and dispatch through Hermes."""
from __future__ import annotations

import base64
import binascii
import hashlib
import json
import subprocess
from pathlib import Path
from typing import Any, Callable

HERMES_BIN = "/home/hermes/.local/bin/hermes"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
_ALLOWED = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}


def validate_image_attachment(filename: str, mime_type: str, content: bytes) -> dict[str, object]:
    if not isinstance(filename, str) or not filename.strip():
        raise ValueError("nome do arquivo obrigatório")
    extension = Path(filename).suffix.casefold()
    if extension not in _ALLOWED or mime_type != _ALLOWED[extension]:
        raise ValueError("tipo de imagem não permitido")
    if not isinstance(content, bytes) or not content or len(content) > MAX_IMAGE_BYTES:
        raise ValueError("tamanho de imagem inválido")
    signatures = {
        ".jpg": content.startswith(b"\xff\xd8\xff"),
        ".jpeg": content.startswith(b"\xff\xd8\xff"),
        ".png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        ".webp": content.startswith(b"RIFF") and content[8:12] == b"WEBP",
    }
    if not signatures[extension]:
        raise ValueError("assinatura da imagem inválida")
    return {"extension": extension, "safe_name": f"attachment{extension}", "size": len(content), "mime_type": mime_type}


def _decode(payload: dict[str, Any]) -> tuple[dict[str, object], bytes]:
    try:
        content = base64.b64decode(str(payload["content_base64"]), validate=True)
    except (KeyError, ValueError, binascii.Error) as exc:
        raise ValueError("conteúdo da imagem inválido") from exc
    return validate_image_attachment(str(payload.get("filename", "")), str(payload.get("mime_type", "")), content), content


def dispatch_admin_media(payload: dict[str, Any], events: list[dict[str, Any]], outbox: Path, media_root: Path, *, runner: Callable[..., Any] = subprocess.run) -> dict[str, Any]:
    if payload.get("confirm") is not True:
        raise PermissionError("envio administrativo exige confirmação explícita")
    conversation_id = payload.get("conversation_id")
    idempotency_key = payload.get("idempotency_key")
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversa obrigatória")
    if not isinstance(idempotency_key, str) or not idempotency_key.strip():
        raise ValueError("idempotency_key obrigatório")
    previous = next((item for item in _read_records(outbox) if item.get("idempotency_key") == idempotency_key), None)
    if previous and previous.get("status") in {"sent", "unknown"}:
        return {"accepted": previous.get("status") == "sent", "duplicate": True, "status": previous["status"], "idempotency_key": idempotency_key, "media_ref": previous.get("media_ref")}
    target_event = next((item for item in events if item.get("conversation_id") == conversation_id and item.get("project_id") == "instagram-content-operations"), None)
    if not target_event or not target_event.get("external_user_ref") or target_event.get("external_user_ref") == "unknown":
        raise ValueError("conversa sem destinatário válido")
    info, content = _decode(payload)
    stem = hashlib.sha256(idempotency_key.encode("utf-8")).hexdigest()[:32]
    media_root.mkdir(parents=True, exist_ok=True)
    path = media_root / f"{stem}{info['extension']}"
    path.write_bytes(content)
    path.chmod(0o600)
    caption = str(payload.get("text") or "").strip()
    message = f"{caption}\nMEDIA:{path}" if caption else f"MEDIA:{path}"
    command = [HERMES_BIN, "send", "--to", f"telegram:{target_event['external_user_ref']}", "--json", message]
    try:
        result = runner(command, capture_output=True, text=True, timeout=30)
        response = json.loads(result.stdout or "{}")
        status = "sent" if result.returncode == 0 and response.get("success") is True else "failed"
    except subprocess.TimeoutExpired:
        status = "unknown"
    except (OSError, ValueError, json.JSONDecodeError):
        status = "failed"
    media_ref = f"private-media/{stem}{info['extension']}"
    record = {"idempotency_key": idempotency_key, "conversation_id": conversation_id, "status": status, "media_ref": media_ref}
    outbox.parent.mkdir(parents=True, exist_ok=True)
    with outbox.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    if status != "unknown":
        path.unlink(missing_ok=True)
    return {"accepted": status == "sent", "duplicate": False, "status": status, "idempotency_key": idempotency_key, "media_ref": media_ref}


def _read_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
