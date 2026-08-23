#!/usr/bin/env python3
"""
CVF Active Continuity Read-Budget Helper

Pure constants, parsing, validation, budget, and wording functions for the
active continuity read-budget rules defined in
`docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md`.

This module owns no repository traversal beyond direct path/byte reads, no
report assembly, and no CLI. `check_active_session_state.py` retains the
checker CLI, exit codes, and report integration and imports this module.
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any


READ_BUDGET_STANDARD_PATH = "docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md"
READ_BUDGET_MIGRATION_PATH = "governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json"

CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_LINES = 60
CVF_ACTIVE_CONTINUITY_BOOTSTRAP_MAX_BYTES = 4096
CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES = 120
CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES = 20480
CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_LINES = 220
CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_BYTES = 32768
CVF_ACTIVE_CONTINUITY_MAX_REQUIRED_FIRST_READS = 12
CVF_ACTIVE_CONTINUITY_FULL_STATE_ADVISORY_BYTES = 131072

READ_BUDGET_MIGRATION_REQUIRED_TOP_FIELDS = {
    "schemaVersion",
    "status",
    "expiresOn",
    "removalAction",
    "entries",
}
READ_BUDGET_MIGRATION_REQUIRED_ENTRY_FIELDS = {
    "path",
    "sha256",
    "lineCount",
    "byteCount",
    "approvedMaxLines",
    "approvedMaxBytes",
    "targetMaxLines",
    "targetMaxBytes",
    "enabled",
}
READ_BUDGET_MIGRATION_STATUS_LITERAL = "ACTIVE_MIGRATION_DEBT"
READ_BUDGET_MIGRATION_REMOVAL_ACTION_LITERAL = "REMOVE_ROW_IN_T2_AFTER_SURFACE_COMPACTION"
EXPIRES_ON_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")

UNCONDITIONAL_TRIGGER_WORDS = ("always", "by default", "every session", "unconditionally", "not optional", "mandatory")
IMPERATIVE_READ_PHRASES = ("read the", "must read", "required to read", "you must read", "reading the")
FULL_SCOPE_WORDS = ("full", "entire", "whole", "complete")
CONTINUITY_TARGET_WORDS = ("state", "history", "aggregate", "handoff", "handoffs")
NEGATION_EXCEPTION_PHRASES = ("not optional",)
SENTENCE_SCOPED_QUALIFIER_PHRASES = ("only when", "only if")

_SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.!?\n])")
_CLAUSE_SPLIT_PATTERN = re.compile(
    r";|,?\s+\bbut\b|,?\s+\byet\b|,\s+(?:and\s+)?"
    r"(?=(?:always|unconditionally|every session|read(?:ing)?|you must|must read|required to read|"
    r"(?:the\s+)?(?:full|entire|whole|complete)\s+(?:state|history|aggregate|handoffs?))\b)"
    r"(?=[^.;]*(?:state|history|aggregate|handoffs?)\b)"
    r"|\s+and\s+"
    r"(?=(?:always|unconditionally|every session|read(?:ing)?|you must|must read|required to read|"
    r"(?:the\s+)?(?:full|entire|whole|complete)\s+(?:state|history|aggregate|handoffs?))\b)"
)
_NEGATED_READ_PATTERN = re.compile(
    r"\b(?:do not|don't|never|avoid|not)\b[^.;]{0,160}\b(?:read|reading|load|loading)\b"
    r"|\bwithout\s+(?:ever\s+)?(?:read|reading|load|loading)\b"
    r"|\b(?:read|reading|load|loading)\b[^.;]{0,48}\bnot\s+"
    r"(?:required|needed|allowed|recommended|necessary)\b"
)
_NEGATION_PARENTHETICAL_PATTERN = re.compile(
    r"\b(?:do not|don't|never|avoid|not)\s*,[^,.;]{0,80},\s*"
    r"(?=(?:read|reading|load|loading)\b)"
)


def file_lines_bytes(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    text = data.decode("utf-8", errors="replace")
    return len(text.splitlines()), len(data)


def load_read_budget_migration(repo_root: Path) -> tuple[Any, str | None]:
    migration_path = repo_root / READ_BUDGET_MIGRATION_PATH
    if not migration_path.exists():
        return None, f"{READ_BUDGET_MIGRATION_PATH} is missing"
    try:
        parsed = json.loads(migration_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, f"{READ_BUDGET_MIGRATION_PATH} invalid JSON: {exc}"
    if not isinstance(parsed, dict):
        return None, f"{READ_BUDGET_MIGRATION_PATH} top-level value must be a JSON object"
    return parsed, None


def migration_row_for_path(migration: dict[str, Any] | None, rel_path: str) -> dict[str, Any] | None:
    if not migration:
        return None
    entries = migration.get("entries")
    if not isinstance(entries, list):
        return None
    for entry in entries:
        if isinstance(entry, dict) and entry.get("path") == rel_path and entry.get("enabled") is True:
            return entry
    return None


def strict_int(value: Any) -> int | None:
    """Return value as int, rejecting bool (a bool subclasses int in Python)."""
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def surface_target_budget(is_root_handoff: bool) -> tuple[int, int]:
    return (
        (CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_LINES, CVF_ACTIVE_CONTINUITY_HANDOFF_MAX_BYTES)
        if is_root_handoff
        else (CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_LINES, CVF_ACTIVE_CONTINUITY_FRONT_DOOR_MAX_BYTES)
    )


def _validate_migration_top_level(
    migration: dict[str, Any], today: dt.date, *, enforce_expiry: bool
) -> list[str]:
    violations: list[str] = []
    top_fields = set(migration.keys())
    for label, delta in (
        ("missing required top-level fields", READ_BUDGET_MIGRATION_REQUIRED_TOP_FIELDS - top_fields),
        ("has unknown top-level fields", top_fields - READ_BUDGET_MIGRATION_REQUIRED_TOP_FIELDS),
    ):
        if delta:
            violations.append(f"{READ_BUDGET_MIGRATION_PATH} {label}: {sorted(delta)}")

    if migration.get("schemaVersion") != "1.0":
        violations.append(f"{READ_BUDGET_MIGRATION_PATH} schemaVersion must equal '1.0'")
    if migration.get("status") != READ_BUDGET_MIGRATION_STATUS_LITERAL:
        violations.append(f"{READ_BUDGET_MIGRATION_PATH} status must equal {READ_BUDGET_MIGRATION_STATUS_LITERAL!r}")
    if migration.get("removalAction") != READ_BUDGET_MIGRATION_REMOVAL_ACTION_LITERAL:
        violations.append(
            f"{READ_BUDGET_MIGRATION_PATH} removalAction must equal {READ_BUDGET_MIGRATION_REMOVAL_ACTION_LITERAL!r}"
        )

    expires_on = migration.get("expiresOn")
    if not isinstance(expires_on, str) or not EXPIRES_ON_PATTERN.match(expires_on):
        violations.append(f"{READ_BUDGET_MIGRATION_PATH} expiresOn must match YYYY-MM-DD")
    else:
        try:
            expires_date = dt.date.fromisoformat(expires_on)
        except ValueError:
            violations.append(f"{READ_BUDGET_MIGRATION_PATH} expiresOn must be a valid ISO date")
        else:
            if enforce_expiry and expires_date < today:
                violations.append(
                    f"{READ_BUDGET_MIGRATION_PATH} expiresOn {expires_on} is expired as of {today.isoformat()}"
                )
    return violations


def _validate_migration_entry(
    repo_root: Path, index: int, entry: Any, seen_paths: set[str]
) -> list[str]:
    violations: list[str] = []
    label = f"{READ_BUDGET_MIGRATION_PATH} entries[{index}]"
    if not isinstance(entry, dict):
        return [f"{label} must be an object"]

    entry_fields = set(entry.keys())
    for msg, delta in (
        ("missing required fields", READ_BUDGET_MIGRATION_REQUIRED_ENTRY_FIELDS - entry_fields),
        ("has unknown fields", entry_fields - READ_BUDGET_MIGRATION_REQUIRED_ENTRY_FIELDS),
    ):
        if delta:
            violations.append(f"{label} {msg}: {sorted(delta)}")

    entry_path = entry.get("path")
    if not isinstance(entry_path, str) or not entry_path:
        violations.append(f"{label} path must be a non-empty string")
        return violations

    if entry_path in seen_paths:
        violations.append(f"{READ_BUDGET_MIGRATION_PATH} duplicate path: {entry_path}")
    seen_paths.add(entry_path)

    is_root_handoff = is_handoff_path(entry_path) and (repo_root / entry_path).parent == repo_root
    if not (entry_path == "CVF_SESSION_MEMORY.md" or is_root_handoff):
        violations.append(f"{label} path {entry_path!r} is not a recognized front-door/handoff continuity surface")
        return violations

    abs_path = repo_root / entry_path
    if not abs_path.exists():
        return violations + [f"{label} path does not exist: {entry_path}"]

    actual_lines, actual_bytes = file_lines_bytes(abs_path)
    actual_hash = hashlib.sha256(abs_path.read_bytes()).hexdigest()

    if entry.get("sha256") != actual_hash:
        violations.append(f"{label} sha256 does not match current file content for {entry_path}")
    for field, actual in (("lineCount", actual_lines), ("byteCount", actual_bytes)):
        if strict_int(entry.get(field)) != actual:
            violations.append(f"{label} {field} {entry.get(field)!r} does not match current {actual} for {entry_path}")

    approved_max_lines = strict_int(entry.get("approvedMaxLines"))
    approved_max_bytes = strict_int(entry.get("approvedMaxBytes"))
    if approved_max_lines != actual_lines:
        violations.append(
            f"{label} approvedMaxLines must be a strict integer exactly equal to current "
            f"lineCount {actual_lines} for {entry_path}"
        )
    if approved_max_bytes != actual_bytes:
        violations.append(
            f"{label} approvedMaxBytes must be a strict integer exactly equal to current "
            f"byteCount {actual_bytes} for {entry_path}"
        )

    target_max_lines, target_max_bytes = surface_target_budget(is_root_handoff)
    if entry.get("targetMaxLines") != target_max_lines:
        violations.append(f"{label} targetMaxLines must equal canonical budget {target_max_lines} for {entry_path}")
    if entry.get("targetMaxBytes") != target_max_bytes:
        violations.append(f"{label} targetMaxBytes must equal canonical budget {target_max_bytes} for {entry_path}")

    enabled = entry.get("enabled")
    if enabled is not True and enabled is not False:
        violations.append(f"{label} enabled must be a boolean for {entry_path}")
    elif enabled is True:
        surface_lines, surface_bytes = surface_target_budget(is_root_handoff)
        if actual_lines <= surface_lines and actual_bytes <= surface_bytes:
            violations.append(
                f"{label} carries a migration waiver for {entry_path} but the surface is already "
                "within its canonical budget; remove the row instead of retaining it"
            )

    return violations


def validate_read_budget_migration_registry(
    repo_root: Path, migration: dict[str, Any] | None, load_error: str | None, today: dt.date
) -> list[str]:
    if load_error:
        return [load_error]
    if migration is None:
        return []
    if not isinstance(migration, dict):
        return [f"{READ_BUDGET_MIGRATION_PATH} top-level value must be a JSON object"]

    entries = migration.get("entries")
    # Expiry constrains active migration debt, not an empty registry. Keep
    # schema/date validation fail-closed, and enforce the date whenever the
    # entries value is malformed or carries one or more debt rows.
    violations = _validate_migration_top_level(
        migration,
        today,
        enforce_expiry=not isinstance(entries, list) or bool(entries),
    )

    if not isinstance(entries, list):
        return violations + [f"{READ_BUDGET_MIGRATION_PATH} entries must be a list"]

    seen_paths: set[str] = set()
    for index, entry in enumerate(entries):
        violations.extend(_validate_migration_entry(repo_root, index, entry, seen_paths))
    return violations


def check_surface_read_budget(
    repo_root: Path,
    rel_path: str,
    max_lines: int,
    max_bytes: int,
    migration: dict[str, Any] | None,
) -> list[str]:
    abs_path = repo_root / rel_path
    if not abs_path.exists():
        return []
    actual_lines, actual_bytes = file_lines_bytes(abs_path)
    if actual_lines <= max_lines and actual_bytes <= max_bytes:
        return []

    row = migration_row_for_path(migration, rel_path)
    if row is not None:
        actual_hash = hashlib.sha256(abs_path.read_bytes()).hexdigest()
        if (
            row.get("sha256") == actual_hash
            and row.get("lineCount") == actual_lines
            and row.get("byteCount") == actual_bytes
            and strict_int(row.get("approvedMaxLines")) == actual_lines
            and strict_int(row.get("approvedMaxBytes")) == actual_bytes
        ):
            return []

    return [
        f"{rel_path} exceeds read-budget ({actual_lines} lines / {actual_bytes} bytes vs "
        f"max {max_lines} lines / {max_bytes} bytes) with no matching enabled migration-debt row"
    ]


def check_required_first_reads_budget(raw_required_first_reads: Any) -> list[str]:
    if not isinstance(raw_required_first_reads, list):
        return []
    violations: list[str] = []
    raw_count = len(raw_required_first_reads)
    if raw_count > CVF_ACTIVE_CONTINUITY_MAX_REQUIRED_FIRST_READS:
        violations.append(
            f"requiredFirstReads has {raw_count} raw entries, exceeding the canonical "
            f"cap of {CVF_ACTIVE_CONTINUITY_MAX_REQUIRED_FIRST_READS}"
        )
    for index, item in enumerate(raw_required_first_reads):
        if not isinstance(item, str) or not item.strip():
            violations.append(f"requiredFirstReads[{index}] must be a non-empty string path")
    return violations


def _clause_is_negated(clause: str) -> bool:
    if any(exception in clause for exception in NEGATION_EXCEPTION_PHRASES):
        return False
    if any(phrase in clause for phrase in SENTENCE_SCOPED_QUALIFIER_PHRASES):
        return True
    return bool(_NEGATED_READ_PATTERN.search(clause))


def _clause_has_unconditional_full_read_claim(clause: str) -> bool:
    """A clause claims unconditional full read via a hedge word (always, by
    default, ...) or a bare imperative command (read the full state), always
    combined with a full-scope word and a continuity-target word."""
    has_scope = any(word in clause for word in FULL_SCOPE_WORDS)
    has_target = any(word in clause for word in CONTINUITY_TARGET_WORDS)
    if not (has_scope and has_target):
        return False
    has_trigger = any(word in clause for word in UNCONDITIONAL_TRIGGER_WORDS)
    has_imperative = any(phrase in clause for phrase in IMPERATIVE_READ_PHRASES)
    return has_trigger or has_imperative


def _split_clauses(sentence: str) -> list[str]:
    normalized = _NEGATION_PARENTHETICAL_PATTERN.sub(
        lambda match: match.group(0).replace(",", " "), sentence
    )
    return [part.strip() for part in _CLAUSE_SPLIT_PATTERN.split(normalized) if part.strip()]


def check_unconditional_full_read_wording(rel_path: str, text: str) -> list[str]:
    for sentence in _SENTENCE_SPLIT_PATTERN.split(text):
        stripped = sentence.strip()
        if not stripped:
            continue
        lower = stripped.lower()
        for clause in _split_clauses(lower):
            if _clause_is_negated(clause):
                continue
            if _clause_has_unconditional_full_read_claim(clause):
                return [
                    f"{rel_path} contains unconditional full-state/history read wording in: "
                    f"{stripped[:160]!r}; use progressive/targeted-lookup wording instead"
                ]
    return []


def check_read_budget_standard_and_migration_exist(repo_root: Path) -> list[str]:
    violations: list[str] = []
    if not (repo_root / READ_BUDGET_STANDARD_PATH).exists():
        violations.append(f"{READ_BUDGET_STANDARD_PATH} is missing")
    if not (repo_root / READ_BUDGET_MIGRATION_PATH).exists():
        violations.append(f"{READ_BUDGET_MIGRATION_PATH} is missing")
    return violations


def check_full_state_aggregate_advisory(repo_root: Path, state_path_rel: str) -> list[str]:
    state_path = repo_root / state_path_rel
    if not state_path.exists():
        return []
    size = state_path.stat().st_size
    if size > CVF_ACTIVE_CONTINUITY_FULL_STATE_ADVISORY_BYTES:
        return [
            f"ADVISORY: {state_path_rel} aggregate is {size} bytes, exceeding the "
            f"{CVF_ACTIVE_CONTINUITY_FULL_STATE_ADVISORY_BYTES}-byte full-state advisory threshold; "
            "T2 owns aggregate schema/content migration, this is advisory only"
        ]
    return []


def is_handoff_path(path: str) -> bool:
    return Path(path).name.startswith("AGENT_HANDOFF") and Path(path).suffix == ".md"
