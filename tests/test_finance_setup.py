from datetime import date
from concurrent.futures import ThreadPoolExecutor

import pytest

from finance_setup import create_account, create_category, create_recurrence, scoped_setup
from finance_setup_store import load_setup, mutate_setup, save_setup


def test_category_creation_requires_confirmation_and_is_workspace_scoped():
    setup = {"categories": [], "accounts": [], "recurrences": []}

    with pytest.raises(PermissionError):
        create_category(
            setup,
            workspace_id="personal",
            name="Moradia",
            entry_type="expense",
            confirm=False,
        )

    category = create_category(
        setup,
        workspace_id="personal",
        name="Moradia",
        entry_type="expense",
        confirm=True,
    )

    assert category["workspace_id"] == "personal"
    assert category["name"] == "Moradia"
    assert category["entry_type"] == "expense"
    assert category["category_id"]
    assert setup["categories"] == [category]


def test_duplicate_category_name_is_rejected_within_workspace():
    setup = {"categories": [], "accounts": [], "recurrences": []}
    create_category(setup, workspace_id="personal", name="Moradia", entry_type="expense", confirm=True)

    with pytest.raises(ValueError, match="categoria já existe"):
        create_category(setup, workspace_id="personal", name=" moradia ", entry_type="expense", confirm=True)

    other = create_category(setup, workspace_id="empresa", name="Moradia", entry_type="expense", confirm=True)
    assert other["workspace_id"] == "empresa"


def test_account_creation_is_confirmed_and_rejects_workspace_duplicate():
    setup = {"categories": [], "accounts": [], "recurrences": []}

    with pytest.raises(PermissionError):
        create_account(setup, workspace_id="personal", name="Conta principal", account_type="checking", confirm=False)

    account = create_account(setup, workspace_id="personal", name="Conta principal", account_type="checking", confirm=True)
    assert account["workspace_id"] == "personal"
    assert account["currency"] == "BRL"
    assert account["active"] is True

    with pytest.raises(ValueError, match="conta já existe"):
        create_account(setup, workspace_id="personal", name=" conta PRINCIPAL ", account_type="checking", confirm=True)


def test_recurrence_requires_scoped_category_and_account():
    setup = {"categories": [], "accounts": [], "recurrences": []}
    category = create_category(setup, workspace_id="personal", name="Moradia", entry_type="expense", confirm=True)
    account = create_account(setup, workspace_id="personal", name="Conta principal", account_type="checking", confirm=True)

    recurrence = create_recurrence(
        setup,
        workspace_id="personal",
        entry_type="expense",
        amount_cents=150000,
        category_id=category["category_id"],
        account_id=account["account_id"],
        frequency="monthly",
        next_due_on=date(2026, 10, 5),
        description="Aluguel",
        confirm=True,
    )

    assert recurrence["workspace_id"] == "personal"
    assert recurrence["next_due_on"] == "2026-10-05"
    assert recurrence["active"] is True

    with pytest.raises(ValueError, match="categoria não pertence"):
        create_recurrence(
            setup,
            workspace_id="empresa",
            entry_type="expense",
            amount_cents=150000,
            category_id=category["category_id"],
            account_id=account["account_id"],
            frequency="monthly",
            next_due_on=date(2026, 10, 5),
            description="Aluguel",
            confirm=True,
        )


def test_finance_setup_round_trip_is_persisted_as_json(tmp_path):
    path = tmp_path / "setup.json"
    setup = {"categories": [{"category_id": "cat-1", "workspace_id": "personal"}], "accounts": [], "recurrences": []}

    save_setup(path, setup)

    assert load_setup(path) == setup
    assert load_setup(tmp_path / "missing.json") == {"categories": [], "accounts": [], "recurrences": []}


def test_scoped_setup_never_leaks_another_workspace():
    setup = {
        "categories": [
            {"category_id": "personal-cat", "workspace_id": "personal"},
            {"category_id": "business-cat", "workspace_id": "empresa"},
        ],
        "accounts": [{"account_id": "personal-account", "workspace_id": "personal"}],
        "recurrences": [{"recurrence_id": "business-rec", "workspace_id": "empresa"}],
    }

    result = scoped_setup(setup, "personal")

    assert [item["category_id"] for item in result["categories"]] == ["personal-cat"]
    assert [item["account_id"] for item in result["accounts"]] == ["personal-account"]
    assert result["recurrences"] == []


def test_concurrent_setup_mutations_do_not_lose_updates(tmp_path):
    path = tmp_path / "setup.json"

    def add_category(index: int):
        return mutate_setup(
            path,
            lambda setup: setup["categories"].append({"category_id": str(index), "workspace_id": "personal"}),
        )

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(add_category, range(24)))

    assert len(load_setup(path)["categories"]) == 24


def test_failed_audit_hook_rolls_back_setup_mutation(tmp_path):
    path = tmp_path / "setup.json"

    def add_category(setup):
        setup["categories"].append({"category_id": "category-1", "workspace_id": "personal"})
        return setup["categories"][0]

    def fail_audit(_result):
        raise OSError("audit unavailable")

    with pytest.raises(OSError, match="audit unavailable"):
        mutate_setup(path, add_category, after_save=fail_audit)

    assert load_setup(path)["categories"] == []
