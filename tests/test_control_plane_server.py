from datetime import date

import pytest

from control_plane_server import apply_finance_setup_mutation, route_description


def test_route_description_separates_project_and_finance_domains():
    assert route_description("/api/projects") == "project_registry"
    assert route_description("/api/finance/summary") == "finance"
    assert route_description("/api/finance/setup") == "finance_setup"
    assert route_description("/api/finance/categories") == "finance_setup"
    assert route_description("/api/finance/accounts") == "finance_setup"
    assert route_description("/api/finance/recurrences") == "finance_setup"
    assert route_description("/api/campaigns") == "instagram_proxy"
    assert route_description("/unknown") is None


def test_period_defaults_are_current_month():
    start, end = route_description("/api/finance/summary", today=date(2026, 9, 10))
    assert start == "2026-09-01"
    assert end == "2026-09-10"


def test_finance_setup_mutation_dispatches_confirmed_category():
    setup = {"categories": [], "accounts": [], "recurrences": []}

    entity_type, entity = apply_finance_setup_mutation(
        setup,
        {
            "kind": "finance_category",
            "workspace_id": "personal",
            "name": "Moradia",
            "entry_type": "expense",
            "confirm": True,
        },
    )

    assert entity_type == "category"
    assert entity["name"] == "Moradia"


def test_finance_setup_mutation_normalizes_malformed_payload_to_value_error():
    setup = {"categories": [], "accounts": [], "recurrences": []}

    with pytest.raises(ValueError, match="configuração financeira inválida"):
        apply_finance_setup_mutation(
            setup,
            {"kind": "finance_recurrence", "workspace_id": "personal", "amount_cents": None, "confirm": True},
        )


@pytest.mark.parametrize(
    "body",
    [
        {"kind": "finance_category", "workspace_id": None, "name": None, "entry_type": "expense", "confirm": True},
        {"kind": "finance_account", "workspace_id": "personal", "name": None, "account_type": "checking", "confirm": True},
    ],
)
def test_finance_setup_mutation_rejects_null_required_strings(body):
    setup = {"categories": [], "accounts": [], "recurrences": []}

    with pytest.raises(ValueError, match="configuração financeira inválida"):
        apply_finance_setup_mutation(setup, body)


@pytest.mark.parametrize("invalid_amount", [True, 1.5, "100"])
def test_finance_setup_mutation_rejects_non_integer_amounts(invalid_amount):
    setup = {
        "categories": [{"category_id": "category-1", "workspace_id": "personal", "entry_type": "expense", "active": True}],
        "accounts": [{"account_id": "account-1", "workspace_id": "personal", "active": True}],
        "recurrences": [],
    }
    body = {
        "kind": "finance_recurrence",
        "workspace_id": "personal",
        "entry_type": "expense",
        "amount_cents": invalid_amount,
        "category_id": "category-1",
        "account_id": "account-1",
        "frequency": "monthly",
        "next_due_on": "2026-09-12",
        "description": "Conta",
        "confirm": True,
    }

    with pytest.raises(ValueError, match="configuração financeira inválida"):
        apply_finance_setup_mutation(setup, body)
