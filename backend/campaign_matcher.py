"""Conservative campaign candidates for the read-only terminal."""
from __future__ import annotations

import re
import unicodedata

_STOPWORDS = {"a", "ao", "de", "do", "da", "e", "em", "o", "os", "as", "um", "uma", "para", "por", "com", "que", "quero", "post", "campanha"}


def _tokens(value: object) -> set[str]:
    text = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().casefold()
    return {token for token in re.findall(r"[a-z0-9]+", text) if token not in _STOPWORDS and len(token) > 1}


def _campaign_text(campaign: dict) -> str:
    snapshot = campaign.get("product_snapshot") or {}
    return " ".join(str(campaign.get(key, "")) for key in ("campaign_id", "caption", "prompt", "alt_text")) + " " + str(snapshot.get("name", ""))


def identify_campaigns(event: dict, campaigns: list[dict], limit: int = 5) -> list[dict]:
    text = str(event.get("text") or "")
    event_tokens = _tokens(text)
    scored = []
    for campaign in campaigns:
        campaign_id = str(campaign.get("campaign_id") or "")
        confidence = 1.0 if campaign_id and campaign_id.casefold() in text.casefold() else 0.0
        if not confidence and event_tokens:
            campaign_tokens = _tokens(_campaign_text(campaign))
            confidence = len(event_tokens & campaign_tokens) / len(event_tokens)
        if confidence > 0:
            scored.append({"campaign_id": campaign_id, "tenant_id": campaign.get("tenant_id"), "confidence": round(min(confidence, 1.0), 3), "selected": False})
    scored.sort(key=lambda item: (-item["confidence"], item["campaign_id"]))
    scored = scored[:limit]
    if scored and scored[0]["confidence"] >= 0.7 and (len(scored) == 1 or scored[0]["confidence"] - scored[1]["confidence"] >= 0.2):
        scored[0]["selected"] = True
    return scored
