import base64
from pathlib import Path

import pytest

from media_composer import dispatch_admin_media, validate_image_attachment


def event():
    return {"event_id": "evt-1", "conversation_id": "conv-1", "external_user_ref": "12345", "workspace_id": "magu-moto-pecas-filho", "project_id": "instagram-content-operations"}


def runner_ok(command, **kwargs):
    class Result:
        returncode = 0
        stdout = '{"success": true}'
        stderr = ""
    return Result()


def test_accepts_jpeg_and_rejects_wrong_signature():
    valid = validate_image_attachment("arte.jpg", "image/jpeg", b"\xff\xd8\xff" + b"x" * 10)
    assert valid["extension"] == ".jpg"
    with pytest.raises(ValueError, match="assinatura"):
        validate_image_attachment("arte.jpg", "image/jpeg", b"not-an-image")


def test_rejects_unsupported_or_oversized_files():
    with pytest.raises(ValueError, match="tipo"):
        validate_image_attachment("arte.svg", "image/svg+xml", b"<svg>")
    with pytest.raises(ValueError, match="tamanho"):
        validate_image_attachment("arte.png", "image/png", b"\x89PNG\r\n\x1a\n" + b"x" * (5 * 1024 * 1024))


def test_private_path_uses_idempotency_key():
    result = validate_image_attachment("../arte.webp", "image/webp", b"RIFF" + b"xxxx" + b"WEBP" + b"x" * 12)
    assert result["extension"] == ".webp"
    assert result["safe_name"] == "attachment.webp"


def test_confirmed_media_is_sent_and_removed_after_success(tmp_path: Path):
    payload = {"conversation_id": "conv-1", "text": "Veja a arte", "idempotency_key": "media-1", "filename": "arte.jpg", "mime_type": "image/jpeg", "content_base64": base64.b64encode(b"\xff\xd8\xff" + b"x" * 10).decode(), "confirm": True}
    result = dispatch_admin_media(payload, [event()], tmp_path / "outbox.jsonl", tmp_path / "media", runner=runner_ok)
    assert result["status"] == "sent"
    assert not list((tmp_path / "media").iterdir())
