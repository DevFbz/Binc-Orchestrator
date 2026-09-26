import json
from urllib.parse import parse_qs, urlparse

import pytest
import company_finder

from company_finder import (
    build_text_search_query,
    normalize_nominatim_niche,
    normalize_places_response,
    search_companies,
    validate_search_request,
)


def test_validate_search_request_requires_niche_city_and_brazilian_state():
    assert validate_search_request({"niche": " clínicas ", "state": "sp", "city": " São Paulo "}) == {
        "niche": "clínicas",
        "state": "SP",
        "city": "São Paulo",
        "page_size": 20,
        "max_pages": 3,
        "page_token": None,
    }

    with pytest.raises(ValueError, match="nicho"):
        validate_search_request({"niche": "", "state": "SP", "city": "Campinas"})
    with pytest.raises(ValueError, match="estado"):
        validate_search_request({"niche": "clínicas", "state": "XX", "city": "Campinas"})
    with pytest.raises(ValueError, match="cidade"):
        validate_search_request({"niche": "clínicas", "state": "SP", "city": ""})


def test_build_text_search_query_is_specific_to_the_selected_location():
    assert build_text_search_query("salões de beleza", "SP", "Campinas") == "salões de beleza, Campinas - SP, Brasil"


def test_normalize_nominatim_niche_handles_common_plural_business_terms():
    assert normalize_nominatim_niche("padarias") == "padaria"
    assert normalize_nominatim_niche("salões de beleza") == "salão de beleza"
    assert normalize_nominatim_niche("clínicas") == "clínica"


def test_normalize_places_response_keeps_public_business_contact_fields():
    payload = {
        "places": [
            {
                "id": "places/123",
                "displayName": {"text": "Studio Binc"},
                "formattedAddress": "Rua A, 10, Campinas - SP",
                "nationalPhoneNumber": "(19) 99999-0000",
                "websiteUri": "https://studiobinc.example",
                "googleMapsUri": "https://maps.google.com/?cid=123",
                "businessStatus": "OPERATIONAL",
                "primaryType": "beauty_salon",
            }
        ],
        "nextPageToken": "next-page",
    }

    result = normalize_places_response(payload)

    assert result["next_page_token"] == "next-page"
    assert result["companies"] == [
        {
            "place_id": "places/123",
            "name": "Studio Binc",
            "address": "Rua A, 10, Campinas - SP",
            "phone": "(19) 99999-0000",
            "website": "https://studiobinc.example",
            "maps_url": "https://maps.google.com/?cid=123",
            "business_status": "OPERATIONAL",
            "primary_type": "beauty_salon",
            "types": [],
            "source": "Google Places API",
        }
    ]


def test_search_companies_scans_available_pages_and_deduplicates_places():
    responses = iter(
        [
            {"places": [{"id": "places/1", "displayName": {"text": "A"}}], "nextPageToken": "page-2"},
            {"places": [{"id": "places/1", "displayName": {"text": "A"}}, {"id": "places/2", "displayName": {"text": "B"}}]},
        ]
    )
    requests = []

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload
            self.status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return json.dumps(self.payload).encode("utf-8")

    def opener(request, timeout):
        requests.append({"url": request.full_url, "body": json.loads(request.data.decode("utf-8")), "timeout": timeout})
        return FakeResponse(next(responses))

    result = search_companies(
        {"niche": "clínicas", "state": "SP", "city": "Campinas", "max_pages": 3},
        api_key="test-key",
        opener=opener,
    )

    assert result["query"] == "clínicas, Campinas - SP, Brasil"
    assert result["pages_scanned"] == 2
    assert result["companies_count"] == 2
    assert [company["place_id"] for company in result["companies"]] == ["places/1", "places/2"]
    assert requests[1]["body"]["pageToken"] == "page-2"
    assert requests[0]["body"]["pageSize"] == 20


def test_search_companies_supports_free_openstreetmap_provider_without_google_key():
    requests = []

    class FakeResponse:
        status = 200

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return json.dumps(
                [
                    {
                        "osm_type": "node",
                        "osm_id": 42,
                        "display_name": "Clínica Binc, Campinas - SP, Brasil",
                        "namedetails": {"name": "Clínica Binc"},
                        "lat": "-22.90",
                        "lon": "-47.06",
                        "type": "clinic",
                        "extratags": {"contact:phone": "+55 19 99999-0000", "website": "https://binc.example"},
                    }
                ]
            ).encode("utf-8")

    def opener(request, timeout):
        requests.append({"url": request.full_url, "headers": dict(request.headers), "timeout": timeout})
        return FakeResponse()

    result = search_companies(
        {"niche": "clínicas", "state": "SP", "city": "Campinas", "provider": "openstreetmap"},
        opener=opener,
    )

    query = parse_qs(urlparse(requests[0]["url"]).query)
    assert result["source"] == "OpenStreetMap Nominatim"
    assert result["companies_count"] == 1
    assert result["companies"][0]["phone"] == "+55 19 99999-0000"
    assert result["companies"][0]["website"] == "https://binc.example"
    assert query["countrycodes"] == ["br"]
    assert query["extratags"] == ["1"]
    assert requests[0]["headers"]["User-agent"].startswith("Binc-Orchestrator/")


def test_nominatim_requests_are_throttled_to_one_per_second(monkeypatch):
    clock = iter([100.0, 100.0, 100.2, 101.3])
    sleeps = []
    monkeypatch.setattr(company_finder.time, "monotonic", lambda: next(clock))
    monkeypatch.setattr(company_finder.time, "sleep", sleeps.append)
    monkeypatch.setattr(company_finder, "_NOMINATIM_LAST_REQUEST", 0.0)

    company_finder._wait_for_nominatim_slot()
    company_finder._wait_for_nominatim_slot()

    assert sleeps == [pytest.approx(0.85)]
