from datetime import date

import pytest

from finance_commands import create_financial_entry


def test_financial_entry_requires_explicit_confirmation():
    with pytest.raises(PermissionError):
        create_financial_entry([], workspace_id="personal", entry_type="expense", amount_cents=1200, category="casa", occurred_on=date(2026, 9, 11), description="Conta", confirm=False)


def test_confirmed_financial_entry_is_created():
    entries = []
    accounts = [{"account_id": "account-1", "workspace_id": "personal"}]
    result = create_financial_entry(entries, workspace_id="personal", entry_type="income", amount_cents=5000, category="freela", account_id="account-1", accounts=accounts, occurred_on=date(2026, 9, 11), description="Serviço", confirm=True)

    assert result["workspace_id"] == "personal"
    assert result["amount_cents"] == 5000
    assert result["account_id"] == "account-1"
    assert len(entries) == 1


def test_financial_entry_rejects_account_from_another_workspace():
    accounts = [{"account_id": "business-account", "workspace_id": "empresa"}]

    with pytest.raises(ValueError, match="conta não pertence"):
        create_financial_entry([], workspace_id="personal", entry_type="expense", amount_cents=1200, category="casa", account_id="business-account", accounts=accounts, occurred_on=date(2026, 9, 11), description="Conta", confirm=True)
