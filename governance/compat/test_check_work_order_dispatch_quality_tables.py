#!/usr/bin/env python3
"""
Focused tests for check_work_order_dispatch_quality_tables.py

GFS-PY T1: verifies the pure table-parsing helpers extracted from the
dispatch-quality monolith remain behavior-identical after extraction.
"""

from __future__ import annotations

import pytest

from check_work_order_dispatch_quality_tables import (
    _clean_manifest_path,
    _extract_section,
    _normalize_table_key,
    _parse_any_markdown_tables,
    _parse_markdown_tables,
    _row_value,
    _section_tables,
    _truthy_cell,
)


# ---------------------------------------------------------------------------
# _extract_section
# ---------------------------------------------------------------------------

SAMPLE_DOC = """\
## Purpose

Some purpose text.

## Source Verification Block

| Claimed item | Source file | Disposition |
| --- | --- | --- |
| thing | path/to/file.py | ACCEPT |

## Claim Boundary

End matter.
"""


def test_extract_section_returns_matching_section():
    result = _extract_section(SAMPLE_DOC, "Source Verification Block")
    assert "Claimed item" in result
    assert "ACCEPT" in result


def test_extract_section_returns_empty_for_missing():
    result = _extract_section(SAMPLE_DOC, "Nonexistent Section")
    assert result == ""


def test_extract_section_case_insensitive():
    result = _extract_section(SAMPLE_DOC, "source verification block")
    assert "Claimed item" in result


def test_extract_section_does_not_bleed_into_next():
    result = _extract_section(SAMPLE_DOC, "Purpose")
    assert "Claim Boundary" not in result


# ---------------------------------------------------------------------------
# _parse_markdown_tables (Source Verification table parser)
# ---------------------------------------------------------------------------

SV_TABLE_TEXT = """\
## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Disposition |
| --- | --- | --- | --- | --- |
| The monolith defines X | governance/compat/foo.py | line 42 | `_foo` | ACCEPT |
| Another claim | governance/compat/bar.py | line 99 | `_bar` | REJECT |
"""


def test_parse_markdown_tables_finds_sv_rows():
    rows = _parse_markdown_tables(SV_TABLE_TEXT)
    assert len(rows) == 2


def test_parse_markdown_tables_row_values():
    rows = _parse_markdown_tables(SV_TABLE_TEXT)
    assert rows[0]["Claimed item"] == "The monolith defines X"
    assert rows[0]["Disposition"] == "ACCEPT"
    assert rows[1]["Disposition"] == "REJECT"


def test_parse_markdown_tables_skips_non_sv_tables():
    text = """\
| Field | Value |
| --- | --- |
| foo | bar |
"""
    rows = _parse_markdown_tables(text)
    assert rows == []


def test_parse_markdown_tables_handles_extra_cells_in_sv_table():
    # Source Verification tables with 6+ columns should merge middle cells
    text = """\
| Claimed item | Source file | Verified line/section | Verified path or symbol | Source fact type | Disposition |
| --- | --- | --- | --- | --- | --- |
| claim | file.py | line 10 | `sym` | EXISTS | ACCEPT |
"""
    rows = _parse_markdown_tables(text)
    assert len(rows) == 1
    assert rows[0]["Disposition"] == "ACCEPT"


# ---------------------------------------------------------------------------
# _parse_any_markdown_tables
# ---------------------------------------------------------------------------

MULTI_TABLE_TEXT = """\
| A | B |
| --- | --- |
| a1 | b1 |
| a2 | b2 |

Some prose.

| X | Y | Z |
| --- | --- | --- |
| x1 | y1 | z1 |
"""


def test_parse_any_markdown_tables_finds_all_tables():
    tables = _parse_any_markdown_tables(MULTI_TABLE_TEXT)
    assert len(tables) == 2


def test_parse_any_markdown_tables_row_count():
    tables = _parse_any_markdown_tables(MULTI_TABLE_TEXT)
    assert len(tables[0]) == 2
    assert len(tables[1]) == 1


def test_parse_any_markdown_tables_column_values():
    tables = _parse_any_markdown_tables(MULTI_TABLE_TEXT)
    assert tables[0][0]["A"] == "a1"
    assert tables[1][0]["Z"] == "z1"


def test_parse_any_markdown_tables_empty():
    tables = _parse_any_markdown_tables("No tables here.\n")
    assert tables == []


def test_parse_any_markdown_tables_pads_short_rows():
    text = """\
| A | B | C |
| --- | --- | --- |
| only_a |
"""
    tables = _parse_any_markdown_tables(text)
    assert len(tables) == 1
    assert tables[0][0].get("B") == "" or tables[0][0].get("B") == "only_a"


# ---------------------------------------------------------------------------
# _normalize_table_key
# ---------------------------------------------------------------------------


def test_normalize_table_key_lowercases():
    assert _normalize_table_key("Claimed Item") == "claimeditem"


def test_normalize_table_key_strips_non_alnum():
    assert _normalize_table_key("Source file/path") == "sourcefilepath"


def test_normalize_table_key_numbers_preserved():
    assert _normalize_table_key("GC-018") == "gc018"


# ---------------------------------------------------------------------------
# _row_value
# ---------------------------------------------------------------------------


def test_row_value_exact_match():
    row = {"Disposition": "ACCEPT", "Source file": "foo.py"}
    assert _row_value(row, "Disposition") == "ACCEPT"


def test_row_value_normalized_lookup():
    row = {"Disposition": "REJECT"}
    assert _row_value(row, "disposition") == "REJECT"


def test_row_value_first_name_wins():
    row = {"Field": "first", "Value": "second"}
    assert _row_value(row, "Field", "Value") == "first"


def test_row_value_fallback():
    row = {"Field": "first", "Value": "second"}
    assert _row_value(row, "Missing", "Value") == "second"


def test_row_value_missing_returns_empty():
    row = {"A": "x"}
    assert _row_value(row, "B") == ""


# ---------------------------------------------------------------------------
# _section_tables
# ---------------------------------------------------------------------------


def test_section_tables_returns_tables_in_section():
    text = """\
## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Disposition |
| --- | --- | --- | --- | --- |
| claim | file.py | 10 | `_foo` | ACCEPT |

## Other Section

| X | Y |
| --- | --- |
| x | y |
"""
    tables = _section_tables(text, "Source Verification Block")
    assert len(tables) == 1
    assert tables[0][0]["Disposition"] == "ACCEPT"


def test_section_tables_returns_empty_for_missing_section():
    result = _section_tables(SAMPLE_DOC, "Nonexistent Section")
    assert result == []


# ---------------------------------------------------------------------------
# _truthy_cell
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("value", ["yes", "YES", "Yes", "y", "Y", "true", "True", "TRUE"])
def test_truthy_cell_truthy_values(value):
    assert _truthy_cell(value) is True


@pytest.mark.parametrize("value", ["required", "REQUIRED", "must", "handoff"])
def test_truthy_cell_required_values(value):
    assert _truthy_cell(value) is True


@pytest.mark.parametrize("value", ["no", "false", "n/a", "DEFERRED", "N/A", ""])
def test_truthy_cell_falsy_values(value):
    assert _truthy_cell(value) is False


def test_truthy_cell_strips_backticks():
    assert _truthy_cell("`yes`") is True


# ---------------------------------------------------------------------------
# _clean_manifest_path
# ---------------------------------------------------------------------------


def test_clean_manifest_path_strips_backticks():
    assert _clean_manifest_path("`governance/compat/foo.py`") == "governance/compat/foo.py"


def test_clean_manifest_path_converts_backslashes():
    assert _clean_manifest_path("governance\\compat\\foo.py") == "governance/compat/foo.py"


def test_clean_manifest_path_strips_trailing_punctuation():
    assert _clean_manifest_path("governance/compat/foo.py.") == "governance/compat/foo.py"
    assert _clean_manifest_path("governance/compat/foo.py,") == "governance/compat/foo.py"


def test_clean_manifest_path_strips_whitespace():
    assert _clean_manifest_path("  governance/compat/foo.py  ") == "governance/compat/foo.py"


def test_clean_manifest_path_empty():
    assert _clean_manifest_path("") == ""
