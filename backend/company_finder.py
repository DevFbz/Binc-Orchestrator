"""Public business discovery through Google Places API (New).

The control plane owns this integration so the API key never reaches the browser.
Only public business fields returned by the provider are exposed to the UI.
"""
from __future__ import annotations

import json
import os
from collections.abc import Callable
from urllib.request import Request, urlopen

GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
GOOGLE_PLACES_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.googleMapsUri",
        "places.businessStatus",
        "places.primaryType",
        "places.types",
        "nextPageToken",
    ]
)

BR_STATES = {
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
}


class CompanyFinderConfigurationError(RuntimeError):
    """Raised when the provider cannot run because configuration is missing."""


class CompanyFinderUpstreamError(RuntimeError):
    """Raised when the external provider returns invalid/unavailable data."""


def _text(value: object) -> str:
    if isinstance(value, dict):
        value = value.get("text", "")
    return value.strip() if isinstance(value, str) else ""


def validate_search_request(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("payload inválido")

    niche = payload.get("niche")
    state = payload.get("state")
    city = payload.get("city")
    if not isinstance(niche, str) or not niche.strip():
        raise ValueError("nicho é obrigatório")
    if not isinstance(state, str) or state.strip().upper() not in BR_STATES:
        raise ValueError("estado brasileiro inválido")
    if not isinstance(city, str) or not city.strip():
        raise ValueError("cidade é obrigatória")

    niche = niche.strip()
    city = city.strip()
    if len(niche) > 120:
        raise ValueError("nicho excede 120 caracteres")
    if len(city) > 100:
        raise ValueError("cidade excede 100 caracteres")

    page_size = payload.get("page_size", 20)
    max_pages = payload.get("max_pages", 3)
    if type(page_size) is not int or not 1 <= page_size <= 20:
        raise ValueError("page_size deve estar entre 1 e 20")
    if type(max_pages) is not int or not 1 <= max_pages <= 3:
        raise ValueError("max_pages deve estar entre 1 e 3")

    page_token = payload.get("page_token")
    if page_token is not None and (not isinstance(page_token, str) or not page_token.strip()):
        raise ValueError("page_token inválido")

    return {
        "niche": niche,
        "state": state.strip().upper(),
        "city": city,
        "page_size": page_size,
        "max_pages": max_pages,
        "page_token": page_token.strip() if isinstance(page_token, str) else None,
    }


def build_text_search_query(niche: str, state: str, city: str) -> str:
    return f"{niche}, {city} - {state}, Brasil"


def normalize_places_response(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise CompanyFinderUpstreamError("resposta inválida do Google Places")

    companies = []
    for place in payload.get("places", []):
        if not isinstance(place, dict):
            continue
        place_id = _text(place.get("id"))
        name = _text(place.get("displayName"))
        if not place_id or not name:
            continue
        companies.append(
            {
                "place_id": place_id,
                "name": name,
                "address": _text(place.get("formattedAddress")),
                "phone": _text(place.get("nationalPhoneNumber")) or _text(place.get("internationalPhoneNumber")),
                "website": _text(place.get("websiteUri")),
                "maps_url": _text(place.get("googleMapsUri")),
                "business_status": _text(place.get("businessStatus")),
                "primary_type": _text(place.get("primaryType")),
                "types": [item for item in place.get("types", []) if isinstance(item, str)],
                "source": "Google Places API",
            }
        )
    return {"companies": companies, "next_page_token": _text(payload.get("nextPageToken")) or None}


def _request_page(payload: dict, api_key: str, *, opener: Callable = urlopen) -> dict:
    request = Request(
        GOOGLE_PLACES_SEARCH_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
        },
        method="POST",
    )
    try:
        with opener(request, timeout=20) as response:
            if response.status >= 400:
                raise CompanyFinderUpstreamError(f"Google Places respondeu HTTP {response.status}")
            return json.loads(response.read().decode("utf-8"))
    except CompanyFinderUpstreamError:
        raise
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise CompanyFinderUpstreamError("não foi possível consultar o Google Places") from exc


def search_companies(payload: dict, *, api_key: str | None = None, opener: Callable = urlopen) -> dict:
    request = validate_search_request(payload)
    provider_key = (api_key or os.environ.get("GOOGLE_PLACES_API_KEY", "")).strip()
    if not provider_key:
        raise CompanyFinderConfigurationError("GOOGLE_PLACES_API_KEY não configurada")

    query = build_text_search_query(request["niche"], request["state"], request["city"])
    page_token = request["page_token"]
    companies = []
    seen = set()
    pages_scanned = 0
    next_page_token = None

    for _ in range(request["max_pages"]):
        body = {"textQuery": query, "pageSize": request["page_size"]}
        if page_token:
            body["pageToken"] = page_token
        normalized = normalize_places_response(_request_page(body, provider_key, opener=opener))
        pages_scanned += 1
        for company in normalized["companies"]:
            key = company["place_id"] or f"{company['name']}|{company['address']}"
            if key not in seen:
                seen.add(key)
                companies.append(company)
        next_page_token = normalized["next_page_token"]
        if not next_page_token:
            break
        page_token = next_page_token

    return {
        "ok": True,
        "query": query,
        "location": {"city": request["city"], "state": request["state"]},
        "companies": companies,
        "companies_count": len(companies),
        "pages_scanned": pages_scanned,
        "next_page_token": next_page_token,
        "has_more": bool(next_page_token),
        "source": "Google Places API",
        "notice": "Contatos são dados públicos de empresas retornados pela fonte. Verifique antes de abordar e não envie mensagens automaticamente.",
    }
