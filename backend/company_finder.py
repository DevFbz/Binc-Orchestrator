"""Public business discovery through Google Places API (New).

The control plane owns this integration so the API key never reaches the browser.
Only public business fields returned by the provider are exposed to the UI.
"""
from __future__ import annotations

import json
import os
from collections.abc import Callable
from urllib.parse import urlencode
from urllib.request import Request, urlopen

GOOGLE_PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
OSM_USER_AGENT = "Binc-Orchestrator/1.0 (local business prospecting)"
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
    provider = payload.get("provider")
    if provider is not None and provider not in {"google", "openstreetmap"}:
        raise ValueError("provider inválido")

    request = {
        "niche": niche,
        "state": state.strip().upper(),
        "city": city,
        "page_size": page_size,
        "max_pages": max_pages,
        "page_token": page_token.strip() if isinstance(page_token, str) else None,
    }
    if provider is not None:
        request["provider"] = provider
    return request


def build_text_search_query(niche: str, state: str, city: str) -> str:
    return f"{niche}, {city} - {state}, Brasil"


def normalize_nominatim_niche(niche: str) -> str:
    aliases = {
        "academias": "academia",
        "clínicas": "clínica",
        "dentistas": "dentista",
        "imobiliárias": "imobiliária",
        "padarias": "padaria",
        "pet shops": "pet shop",
        "restaurantes": "restaurante",
        "salões de beleza": "salão de beleza",
    }
    value = niche.strip()
    lowered = value.casefold()
    if lowered in aliases:
        return aliases[lowered]
    if lowered.endswith("ões"):
        return f"{value[:-3]}ão"
    if lowered.endswith("s") and not lowered.endswith("ss"):
        return value[:-1]
    return value


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


def normalize_nominatim_response(payload: object) -> list[dict]:
    if not isinstance(payload, list):
        raise CompanyFinderUpstreamError("resposta inválida do OpenStreetMap")

    companies = []
    for place in payload:
        if not isinstance(place, dict):
            continue
        osm_type = _text(place.get("osm_type")).lower()
        osm_id = _text(place.get("osm_id"))
        display_name = _text(place.get("display_name"))
        extra = place.get("extratags") if isinstance(place.get("extratags"), dict) else {}
        namedetails = place.get("namedetails") if isinstance(place.get("namedetails"), dict) else {}
        name = _text(namedetails.get("name")) or (display_name.split(",", 1)[0].strip() if display_name else "")
        if not name:
            continue
        place_id = f"osm:{osm_type}:{osm_id}" if osm_type and osm_id else f"osm:{name}|{display_name}"
        maps_url = f"https://www.openstreetmap.org/{osm_type}/{osm_id}" if osm_type and osm_id else ""
        companies.append(
            {
                "place_id": place_id,
                "name": name,
                "address": display_name,
                "phone": _text(extra.get("contact:phone")) or _text(extra.get("phone")),
                "website": _text(extra.get("contact:website")) or _text(extra.get("website")),
                "maps_url": maps_url,
                "business_status": "",
                "primary_type": _text(place.get("type")),
                "types": [],
                "source": "OpenStreetMap Nominatim",
            }
        )
    return companies


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


def _request_nominatim(query: str, page_size: int, *, opener: Callable = urlopen) -> list[dict]:
    params = urlencode(
        {
            "q": query,
            "format": "jsonv2",
            "addressdetails": "1",
            "extratags": "1",
            "namedetails": "1",
            "dedupe": "1",
            "limit": str(page_size),
            "countrycodes": "br",
        }
    )
    request = Request(
        f"{NOMINATIM_SEARCH_URL}?{params}",
        headers={"Accept": "application/json", "Accept-Language": "pt-BR", "User-Agent": OSM_USER_AGENT},
    )
    try:
        with opener(request, timeout=20) as response:
            if response.status >= 400:
                raise CompanyFinderUpstreamError(f"OpenStreetMap respondeu HTTP {response.status}")
            payload = json.loads(response.read().decode("utf-8"))
            return payload if isinstance(payload, list) else []
    except CompanyFinderUpstreamError:
        raise
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        raise CompanyFinderUpstreamError("não foi possível consultar o OpenStreetMap") from exc


def search_openstreetmap(request: dict, *, opener: Callable = urlopen) -> dict:
    query = build_text_search_query(normalize_nominatim_niche(request["niche"]), request["state"], request["city"])
    companies = []
    seen = set()
    for company in normalize_nominatim_response(_request_nominatim(query, request["page_size"], opener=opener)):
        if company["place_id"] not in seen:
            seen.add(company["place_id"])
            companies.append(company)
    return {
        "ok": True,
        "query": query,
        "location": {"city": request["city"], "state": request["state"]},
        "companies": companies,
        "companies_count": len(companies),
        "pages_scanned": 1,
        "next_page_token": None,
        "has_more": False,
        "source": "OpenStreetMap Nominatim",
        "notice": "Modo gratuito via OpenStreetMap. A cobertura e os telefones/sites dependem do cadastro público; confirme os dados antes de abordar.",
    }


def search_companies(payload: dict, *, api_key: str | None = None, opener: Callable = urlopen) -> dict:
    request = validate_search_request(payload)
    provider_key = (api_key or os.environ.get("GOOGLE_PLACES_API_KEY", "")).strip()
    if request.get("provider") == "openstreetmap" or (request.get("provider") is None and not provider_key):
        return search_openstreetmap(request, opener=opener)
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
