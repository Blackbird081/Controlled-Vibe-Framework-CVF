"""Focused tests for check_external_agent_absorption_table.py."""

from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name(
    "check_external_agent_absorption_table.py"
)
SPEC = importlib.util.spec_from_file_location("check_external_agent_absorption_table", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


VALID_TABLE = """
## Required Absorption Table

| External item ID | External claim summary | Source basis | CVF verification surface | CVF disposition | Owner artifact | Next action | Claim boundary |
|---|---|---|---|---|---|---|---|
| E01 | Claim | external packet | CVF standard | ADAPT | review | none | no runtime |
"""


def test_external_return_absorption_review_requires_table() -> None:
    text = """
# Packet

Status: CLOSED_PASS_BOUNDED

## Purpose

Absorb external return material.
"""

    violations = MODULE.check_text(
        "docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_2026-06-18.md",
        text,
    )

    assert violations
    assert "missing `## Required Absorption Table`" in violations[0]


def test_valid_required_absorption_table_passes() -> None:
    text = f"""
# Packet

Status: CLOSED_PASS_BOUNDED

{VALID_TABLE}
"""

    assert (
        MODULE.check_text(
            "docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_2026-06-18.md",
            text,
        )
        == []
    )


def test_missing_required_column_fails() -> None:
    text = """
# Packet

Status: CLOSED_PASS_BOUNDED

## Required Absorption Table

| External item ID | External claim summary | Source basis | CVF verification surface | CVF disposition | Owner artifact | Next action |
|---|---|---|---|---|---|---|
| E01 | Claim | external packet | CVF standard | ADAPT | review | none |
"""

    violations = MODULE.check_text(
        "docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_2026-06-18.md",
        text,
    )

    assert violations == [
        "docs/reviews/CVF_EARC_T3A_EXTERNAL_RETURN_ABSORPTION_PILOT_2026-06-18.md: "
        "`## Required Absorption Table` missing columns: Claim boundary"
    ]


def test_explicit_required_marker_works_on_generic_review_path() -> None:
    text = f"""
# Packet

Status: COMPLETE_PENDING_REVIEW

External absorption review: REQUIRED

{VALID_TABLE}
"""

    assert MODULE.check_text("docs/reviews/CVF_GENERIC_REVIEW_2026-06-18.md", text) == []


def test_completion_review_phrase_does_not_trigger() -> None:
    text = """
# Completion

Status: CLOSED_PASS_BOUNDED

This completion describes the external-return absorption checker and its tests.
"""

    assert (
        MODULE.check_text(
            "docs/reviews/CVF_EARC_T3B_ABSORPTION_TABLE_CHECKER_COMPLETION_2026-06-18.md",
            text,
        )
        == []
    )
