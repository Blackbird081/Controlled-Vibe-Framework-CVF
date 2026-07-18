#!/usr/bin/env python3
"""
CVF Dispatch Quality - Markdown Table Parsing Helpers

Pure markdown-table parsing utilities extracted from the dispatch-quality
monolith as GFS-PY T1. These functions are behavior-identical to the
originals; no validation logic, failure messages, or thresholds were moved.

Extracted functions:
  _extract_section          - extract a heading-delimited section from text
  _parse_markdown_tables    - parse Source Verification tables from text
  _parse_any_markdown_tables - parse all markdown tables from text
  _normalize_table_key      - normalize a table key for lookup
  _row_value                - look up a value from a table row by column name
  _section_tables           - extract and parse tables within a named section
  _truthy_cell              - test whether a table cell is truthy
  _clean_manifest_path      - clean a manifest path cell value
"""

from __future__ import annotations

import re


def _extract_section(text: str, heading_fragment: str) -> str:
    pattern = re.compile(
        rf"^##\s+.*{re.escape(heading_fragment)}.*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE | re.IGNORECASE,
    )
    match = pattern.search(text)
    return match.group(1) if match else ""


def _parse_markdown_tables(text: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    lines = text.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        if "|" not in line or "Claimed item" not in line or "Source file" not in line:
            index += 1
            continue
        headers = [cell.strip() for cell in line.strip().strip("|").split("|")]
        index += 1
        if index < len(lines) and re.match(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$", lines[index]):
            index += 1
        while index < len(lines) and "|" in lines[index]:
            raw_cells = [cell.strip() for cell in lines[index].strip().strip("|").split("|")]
            is_source_verification_table = all(
                column in headers
                for column in (
                    "Claimed item",
                    "Source file",
                    "Verified line/section",
                    "Verified path or symbol",
                    "Disposition",
                )
            )
            if len(raw_cells) > len(headers) and is_source_verification_table and len(raw_cells) >= 6:
                raw_cells = [
                    raw_cells[0],
                    raw_cells[1],
                    raw_cells[2],
                    " | ".join(raw_cells[3 : len(raw_cells) - 2]),
                    raw_cells[-2],
                    raw_cells[-1],
                ]
            if len(raw_cells) >= len(headers):
                rows.append(dict(zip(headers, raw_cells)))
            index += 1
        continue
    return rows


def _parse_any_markdown_tables(text: str) -> list[list[dict[str, str]]]:
    tables: list[list[dict[str, str]]] = []
    lines = text.splitlines()
    index = 0
    while index + 1 < len(lines):
        header_line = lines[index].strip()
        separator_line = lines[index + 1].strip()
        if not header_line.startswith("|") or "|" not in header_line:
            index += 1
            continue
        if not re.match(r"^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$", separator_line):
            index += 1
            continue
        headers = [cell.strip() for cell in header_line.strip("|").split("|")]
        table_rows: list[dict[str, str]] = []
        index += 2
        while index < len(lines) and lines[index].strip().startswith("|"):
            cells = [cell.strip() for cell in lines[index].strip().strip("|").split("|")]
            if len(cells) < len(headers):
                cells.extend([""] * (len(headers) - len(cells)))
            table_rows.append(dict(zip(headers, cells[: len(headers)])))
            index += 1
        if table_rows:
            tables.append(table_rows)
    return tables


def _normalize_table_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _row_value(row: dict[str, str], *names: str) -> str:
    normalized = {_normalize_table_key(key): value for key, value in row.items()}
    for name in names:
        value = normalized.get(_normalize_table_key(name))
        if value is not None:
            return value.strip()
    return ""


def _section_tables(text: str, heading_fragment: str) -> list[list[dict[str, str]]]:
    section = _extract_section(text, heading_fragment)
    return _parse_any_markdown_tables(section)


def _truthy_cell(value: str) -> bool:
    normalized = value.strip().strip("`").lower()
    return normalized in {"yes", "y", "true", "required", "must", "handoff"}


def _clean_manifest_path(value: str) -> str:
    return value.strip().strip("`").replace("\\", "/").rstrip(".,;:")
