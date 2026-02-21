"""
dsl_executor.py

Safe DSL Condition Executor
----------------------------

Purpose:
- Evaluate DSL conditions safely (NO eval())
- Support comparison operators: >, <, >=, <=, ==, !=
- Support string and numeric comparisons

Author: Governance Engine
"""

import ast
import operator
import re


# Safe operator mapping
OPERATORS = {
    ">": operator.gt,
    "<": operator.lt,
    ">=": operator.ge,
    "<=": operator.le,
    "==": operator.eq,
    "!=": operator.ne,
}

# Regex for simple conditions: variable op value
CONDITION_PATTERN = re.compile(
    r"^\s*(\w+)\s*(>=|<=|!=|==|>|<)\s*(.+)\s*$"
)


def _safe_parse_value(raw: str):
    """Parse a string/number value safely using ast.literal_eval."""
    raw = raw.strip().strip('"').strip("'")
    try:
        return ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return raw


class DSLExecutor:

    def evaluate_condition(self, condition: str, context: dict) -> bool:
        """
        Safely evaluate a DSL condition like:
          'risk_score > 75'
          'status == "CRITICAL"'
          'touches_design_system == True'
        """
        match = CONDITION_PATTERN.match(condition)
        if not match:
            return False

        var_name, op_str, raw_value = match.groups()

        if var_name not in context:
            return False

        ctx_value = context[var_name]
        cmp_value = _safe_parse_value(raw_value)
        op_func = OPERATORS.get(op_str)

        if op_func is None:
            return False

        try:
            return op_func(ctx_value, cmp_value)
        except TypeError:
            return False

    def execute(self, rules: list, context: dict) -> list:
        """Execute all rules against context, return triggered actions."""

        triggered_actions = []

        for rule in rules:
            condition = rule.get("condition", "")
            if self.evaluate_condition(condition, context):
                triggered_actions.append(rule["action"])

        return triggered_actions