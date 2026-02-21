"""
test_dsl.py

Tests for policy_dsl: DSLExecutor (safe condition parser).
"""

import pytest
from policy_dsl.dsl_executor import DSLExecutor, _safe_parse_value


class TestSafeParseValue:
    """Test the value parser."""

    def test_integer(self):
        assert _safe_parse_value("42") == 42

    def test_float(self):
        assert _safe_parse_value("3.14") == 3.14

    def test_string(self):
        assert _safe_parse_value('"hello"') == "hello"

    def test_boolean_true(self):
        assert _safe_parse_value("True") is True

    def test_boolean_false(self):
        assert _safe_parse_value("False") is False

    def test_plain_string(self):
        assert _safe_parse_value("CRITICAL") == "CRITICAL"


class TestDSLExecutor:
    """Test condition evaluation."""

    def setup_method(self):
        self.executor = DSLExecutor()

    def test_greater_than(self):
        assert self.executor.evaluate_condition(
            "risk_score > 75", {"risk_score": 80}
        ) is True

    def test_greater_than_false(self):
        assert self.executor.evaluate_condition(
            "risk_score > 75", {"risk_score": 50}
        ) is False

    def test_less_than(self):
        assert self.executor.evaluate_condition(
            "score < 50", {"score": 30}
        ) is True

    def test_equal_string(self):
        assert self.executor.evaluate_condition(
            'violation == "PROMPT_INJECTION"', {"violation": "PROMPT_INJECTION"}
        ) is True

    def test_equal_string_false(self):
        assert self.executor.evaluate_condition(
            'violation == "PROMPT_INJECTION"', {"violation": "OTHER"}
        ) is False

    def test_not_equal(self):
        assert self.executor.evaluate_condition(
            'status != "APPROVED"', {"status": "REJECTED"}
        ) is True

    def test_greater_equal(self):
        assert self.executor.evaluate_condition(
            "score >= 80", {"score": 80}
        ) is True

    def test_less_equal(self):
        assert self.executor.evaluate_condition(
            "score <= 80", {"score": 80}
        ) is True

    def test_boolean_comparison(self):
        assert self.executor.evaluate_condition(
            "override_used == true", {"override_used": True}
        ) is True

    def test_missing_variable(self):
        # Variable not in context → False
        assert self.executor.evaluate_condition(
            "missing_var > 10", {"other": 20}
        ) is False

    def test_invalid_condition(self):
        # Malformed condition → False
        assert self.executor.evaluate_condition(
            "not a valid condition", {"x": 1}
        ) is False

    def test_type_mismatch(self):
        # String vs number comparison → TypeError → False
        assert self.executor.evaluate_condition(
            "name > 10", {"name": "hello"}
        ) is False
