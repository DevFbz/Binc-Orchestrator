import pytest

from rbac import can_perform_action


def test_rbac_action_matrix_is_server_side():
    assert can_perform_action("global_admin", "send_telegram") is True
    assert can_perform_action("workspace_admin", "send_telegram") is True
    assert can_perform_action("reviewer", "send_telegram") is False
    assert can_perform_action("reader", "read_terminal") is True
    assert can_perform_action("reader", "create_financial_entry") is False


def test_unknown_role_is_denied():
    assert can_perform_action("operator", "send_telegram") is False
