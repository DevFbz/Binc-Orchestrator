from report_engine import scope_finance_summary


def test_finance_summary_is_empty_for_non_finance_project():
    summary = {"income_cents": 1000, "expense_cents": 400, "balance_cents": 600, "entries": 2}
    assert scope_finance_summary(summary, "instagram-content-operations") == {"income_cents": 0, "expense_cents": 0, "balance_cents": 0, "entries": 0}
    assert scope_finance_summary(summary, "cofrinia-finance") == summary
