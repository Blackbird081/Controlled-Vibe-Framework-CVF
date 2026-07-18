"""Tests for check_corpus_packet_source_hash.py (NR-04)."""
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("check_corpus_packet_source_hash.py")
SPEC = importlib.util.spec_from_file_location("check_corpus_packet_source_hash", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)

APPLICABLE_PATH = "docs/audits/CVF_TEST_READINESS_PACKET.md"
NON_APPLICABLE_PATH = "docs/reference/CVF_SOME_REFERENCE.md"
ARCHIVE_PATH = "docs/audits/archive/CVF_OLD_PACKET.md"

# --- Minimal valid readiness packet with sourceHash ---
VALID_WITH_SOURCE_HASH = """\
# CVF Test Corpus Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

## Corpus Intelligence Classification

- Classification task class: TEST
- Classification ledger: see table below

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | sourceHash |
| --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| `file_b.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 2 | abc123def456abc123def456abc123def456abc123def456abc123def456abc1 |
"""

# --- Valid packet using manifest proxy exception ---
VALID_WITH_PROXY = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

manifestHashProxy: true
manifestProxyException: Per-file hashes cannot be computed for this corpus because the source archive is read-only. Coverage limitation: individual file drift is not detectable.

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 |
"""

# --- Packet with sourceHash column but empty value in a row ---
MISSING_HASH_IN_ROW = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | sourceHash |
| --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 | e3b0c44298fc1c149afbf4c8996fb924 |
| `file_b.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 2 |  |
"""

# --- Packet without sourceHash column at all ---
MISSING_HASH_COLUMN = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 |
"""

# --- Packet with proxy but incomplete manifestProxyException ---
PROXY_MISSING_EXCEPTION = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

manifestHashProxy: true
manifestProxyException: short

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 |
"""

# --- Packet with proxy but no manifestProxyException at all ---
PROXY_NO_EXCEPTION = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

manifestHashProxy: true

## Corpus Intelligence Classification

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 |
"""

# --- Non-applicable: reference doc (no classification task class marker) ---
NON_APPLICABLE_CONTENT = """\
# CVF Some Reference

## Purpose

This is a reference document.
"""

# --- Applicable but no classification ledger table ---
NO_LEDGER_TABLE = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

No ledger table here.
"""

# --- sourceHash with placeholder value ---
PLACEHOLDER_HASH = """\
# CVF Test Readiness Packet

docType: audit

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer | sourceHash |
| --- | --- | --- | --- | --- | --- | --- |
| `file_a.md` | READ_DEEP | GOVERNANCE | owner.ts | ACCEPT | §2 row 1 | tbd |
"""


def _messages(issues: list[dict]) -> list[str]:
    return [issue["message"] for issue in issues]


def _types(issues: list[dict]) -> list[str]:
    return [issue["type"] for issue in issues]


# === Applicability tests ===

def test_non_applicable_content_skipped() -> None:
    assert not MODULE._is_applicable("docs/audits/CVF_TEST_REFERENCE.md", NON_APPLICABLE_CONTENT)


def test_archive_path_skipped() -> None:
    assert not MODULE._is_applicable(ARCHIVE_PATH, VALID_WITH_SOURCE_HASH)


def test_non_applicable_prefix_skipped() -> None:
    assert not MODULE._is_applicable(NON_APPLICABLE_PATH, VALID_WITH_SOURCE_HASH)


def test_applicable_via_doctype_audit_marker() -> None:
    assert MODULE._is_applicable(APPLICABLE_PATH, VALID_WITH_SOURCE_HASH)


def test_applicable_via_doctype_audit_only() -> None:
    content = "docType: audit\n## Corpus Intelligence Classification\nsome content"
    assert MODULE._is_applicable(APPLICABLE_PATH, content)


def test_applicable_via_readiness_packet_filename_for_baseline() -> None:
    content = "docType: baseline\n## Corpus Intelligence Classification\nsome content"
    assert MODULE._is_applicable("docs/audits/CVF_TEST_READINESS_PACKET_2026-06-02.md", content)


def test_review_doc_not_applicable() -> None:
    """docType: review docs must NOT be flagged even if they mention classification."""
    content = "docType: review\n- Classification task class: GOVERNANCE_TOOLING_REVIEW\ncorpus intelligence readiness packets are described here"
    assert not MODULE._is_applicable(APPLICABLE_PATH, content)


# === Pass cases ===

def test_valid_with_source_hash_passes() -> None:
    assert MODULE.validate_source_hash(APPLICABLE_PATH, VALID_WITH_SOURCE_HASH) == []


def test_valid_proxy_with_exception_passes() -> None:
    assert MODULE.validate_source_hash(APPLICABLE_PATH, VALID_WITH_PROXY) == []


def test_no_classification_ledger_passes() -> None:
    """Packet with marker but no classification ledger: no violation (not applicable)."""
    assert MODULE.validate_source_hash(APPLICABLE_PATH, NO_LEDGER_TABLE) == []


# === Fail cases ===

def test_missing_source_hash_column_fails() -> None:
    issues = MODULE.validate_source_hash(APPLICABLE_PATH, MISSING_HASH_COLUMN)
    assert any("source_hash_column_missing" in t for t in _types(issues))


def test_empty_source_hash_in_row_fails() -> None:
    issues = MODULE.validate_source_hash(APPLICABLE_PATH, MISSING_HASH_IN_ROW)
    assert any("source_hash_empty" in t for t in _types(issues))


def test_placeholder_hash_fails() -> None:
    issues = MODULE.validate_source_hash(APPLICABLE_PATH, PLACEHOLDER_HASH)
    assert any("source_hash_empty" in t for t in _types(issues))


def test_proxy_with_short_exception_fails() -> None:
    issues = MODULE.validate_source_hash(APPLICABLE_PATH, PROXY_MISSING_EXCEPTION)
    assert any("manifest_proxy_exception_missing" in t for t in _types(issues))


def test_proxy_with_no_exception_fails() -> None:
    issues = MODULE.validate_source_hash(APPLICABLE_PATH, PROXY_NO_EXCEPTION)
    assert any("manifest_proxy_exception_missing" in t for t in _types(issues))


# === Range / worktree handling (structural sanity) ===

def test_deleted_path_not_checked() -> None:
    """Deleted paths should be skipped by the classify function."""
    changed: dict[str, list[str]] = {APPLICABLE_PATH: ["D"]}
    report = MODULE._classify(changed)
    assert report["violations"] == []
    assert report["checkedPaths"] == []
