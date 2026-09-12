from datetime import date

import pytest

from finance_commands import create_financial_entry


def test_financial_entry_requires_explicit_confirmation():
    with pytest.raises(PermissionError):
        create_financial_entry([], workspace_id="personal", entry_type="expense", amount_cents=1200, category="casa", occurred_on=date(2026, 9, 11), description="Conta", confirm=False)


def test_confirmed_financial_entry_is_created():
    entries = []
    result = create_financial_entry(entries, workspace_id="personal", entry_type="income", amount_cents=5000, category="freela", occurred_on=date(2026, 9, 11), description="Serviço", confirm=True)

    assert result["workspace_id"] == "personal"
    assert result["amount_cents"] == 5000
    assert len(entries) == 1
