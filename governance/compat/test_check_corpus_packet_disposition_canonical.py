"""Tests for check_corpus_packet_disposition_canonical.py (NR-11)."""
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("check_corpus_packet_disposition_canonical.py")
SPEC = importlib.util.spec_from_file_location("check_corpus_packet_disposition_canonical", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)

APPLICABLE_PATH = "docs/audits/CVF_TEST_READINESS_PACKET.md"
ARCHIVE_PATH = "docs/audits/archive/CVF_OLD_PACKET.md"
NON_APPLICABLE_PATH = "docs/reference/CVF_REF.md"

# --- Valid: DEFER rows have dispositionAlias and rawDisposition ---
VALID_DEFER_WITH_ALIAS = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias | rawDisposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | DEFER | §2 row 1 | ACCEPT_DEFERRED | DEFER |
| `file_b.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 2 |  |  |
"""

# --- Valid: ACCEPT_SUMMARY_ONLY row with correct alias ---
VALID_ACCEPT_SUMMARY_ONLY_WITH_ALIAS = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias | rawDisposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_SHALLOW | GOVERNANCE | owner.ts | ACCEPT_SUMMARY_ONLY | §2 row 1 | ACCEPT_DEFERRED | ACCEPT_SUMMARY_ONLY |
"""

# --- Valid: no DEFER or ACCEPT_SUMMARY_ONLY rows — NR-11 does not trigger ---
NO_DEFERRED_ROWS = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 |
| `file_b.md` | READ_DEEP | GOVERNANCE | owner.ts | REJECT | §2 row 2 |
"""

# --- Valid: no classification ledger at all ---
NO_LEDGER = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

No ledger table here.
"""

# --- Fail: DEFER row without dispositionAlias column ---
DEFER_WITHOUT_ALIAS_COLUMN = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | DEFER | §2 row 1 |
"""

# --- Fail: DEFER row with wrong dispositionAlias value ---
DEFER_WRONG_ALIAS = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias | rawDisposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | DEFER | §2 row 1 | DEFERRED | DEFER |
"""

# --- Fail: ACCEPT_SUMMARY_ONLY row without dispositionAlias column ---
ACCEPT_SUMMARY_NO_ALIAS_COLUMN = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_SHALLOW | GOVERNANCE | owner.ts | ACCEPT_SUMMARY_ONLY | §2 row 1 |
"""

# --- Fail: dispositionAlias present but rawDisposition column missing ---
ALIAS_WITHOUT_RAW_COLUMN = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias |
| --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | DEFER | §2 row 1 | ACCEPT_DEFERRED |
"""

# --- Fail: dispositionAlias correct but rawDisposition empty ---
ALIAS_WITH_EMPTY_RAW = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias | rawDisposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | DEFER | §2 row 1 | ACCEPT_DEFERRED |  |
"""

# --- Fail: non-deferred row has wrong alias value ---
ACCEPT_WITH_WRONG_ALIAS = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | dispositionAlias | rawDisposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 | SOME_WRONG_ALIAS |  |
"""

NON_APPLICABLE_CONTENT = """\
# CVF Some Reference

## Purpose

This is a reference document.
"""


def _types(issues: list[dict]) -> list[str]:
    return [issue["type"] for issue in issues]


def _messages(issues: list[dict]) -> list[str]:
    return [issue["message"] for issue in issues]


# === Applicability tests ===

def test_non_applicable_content_skipped() -> None:
    assert not MODULE._is_applicable("docs/audits/CVF_TEST_REFERENCE.md", NON_APPLICABLE_CONTENT)


def test_archive_path_skipped() -> None:
    assert not MODULE._is_applicable(ARCHIVE_PATH, VALID_DEFER_WITH_ALIAS)


def test_non_applicable_prefix_skipped() -> None:
    assert not MODULE._is_applicable(NON_APPLICABLE_PATH, VALID_DEFER_WITH_ALIAS)


def test_applicable_via_readiness_packet_filename_for_baseline() -> None:
    content = "docType: baseline\n## Corpus Intelligence Classification\nsome content"
    assert MODULE._is_applicable("docs/audits/CVF_TEST_READINESS_PACKET_2026-06-02.md", content)


# === Pass cases ===

def test_valid_defer_with_alias_passes() -> None:
    assert MODULE.validate_disposition_canonical(APPLICABLE_PATH, VALID_DEFER_WITH_ALIAS) == []


def test_valid_accept_summary_only_with_alias_passes() -> None:
    assert MODULE.validate_disposition_canonical(APPLICABLE_PATH, VALID_ACCEPT_SUMMARY_ONLY_WITH_ALIAS) == []


def test_no_deferred_rows_passes() -> None:
    """No DEFER/ACCEPT_SUMMARY_ONLY rows — NR-11 does not apply."""
    assert MODULE.validate_disposition_canonical(APPLICABLE_PATH, NO_DEFERRED_ROWS) == []


def test_no_ledger_passes() -> None:
    """No classification ledger — no violations."""
    assert MODULE.validate_disposition_canonical(APPLICABLE_PATH, NO_LEDGER) == []


# === Fail cases ===

def test_defer_without_alias_column_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, DEFER_WITHOUT_ALIAS_COLUMN)
    assert any("disposition_alias_column_missing" in t for t in _types(issues))


def test_defer_wrong_alias_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, DEFER_WRONG_ALIAS)
    assert any("disposition_alias_wrong_value" in t for t in _types(issues))


def test_accept_summary_only_without_alias_column_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, ACCEPT_SUMMARY_NO_ALIAS_COLUMN)
    assert any("disposition_alias_column_missing" in t for t in _types(issues))


def test_alias_without_raw_disposition_column_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, ALIAS_WITHOUT_RAW_COLUMN)
    assert any("raw_disposition_column_missing" in t for t in _types(issues))


def test_alias_with_empty_raw_disposition_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, ALIAS_WITH_EMPTY_RAW)
    assert any("raw_disposition_empty" in t for t in _types(issues))


def test_non_deferred_row_with_wrong_alias_fails() -> None:
    issues = MODULE.validate_disposition_canonical(APPLICABLE_PATH, ACCEPT_WITH_WRONG_ALIAS)
    assert any("disposition_alias_wrong_value" in t for t in _types(issues))


# === Range / worktree handling ===

def test_deleted_path_not_checked() -> None:
    changed: dict[str, list[str]] = {APPLICABLE_PATH: ["D"]}
    report = MODULE._classify(changed)
    assert report["violations"] == []
    assert report["checkedPaths"] == []
