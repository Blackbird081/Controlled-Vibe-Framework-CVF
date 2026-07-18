"""Tests for check_corpus_packet_normalized_path.py (NR-05)."""
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().with_name("check_corpus_packet_normalized_path.py")
SPEC = importlib.util.spec_from_file_location("check_corpus_packet_normalized_path", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)

APPLICABLE_PATH = "docs/audits/CVF_TEST_READINESS_PACKET.md"
ARCHIVE_PATH = "docs/audits/archive/CVF_OLD_PACKET.md"
NON_APPLICABLE_PATH = "docs/reference/CVF_REF.md"

# --- Valid: normalizedPath values conform to canonical form ---
VALID_NORMALIZED = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `.private_reference/legacy/CVF ADD/file_a.md` | `cvf add/file_a.md` | READ_DEEP |
| `.private_reference/legacy/CVF ADD/sub/file_b.ts` | `cvf add/sub/file_b.ts` | READ_DEEP |
"""

# --- Valid: no normalizedPath column — NR-05 does not apply ---
NO_NORM_PATH_COLUMN = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | processingStatus | knowledgeRegion |
| --- | --- | --- |
| `.private_reference/legacy/file_a.md` | READ_DEEP | GOVERNANCE |
"""

# --- Valid: normalizedPath is empty/N/A — skipped per standard ---
EMPTY_NORM_PATH = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | n/a | READ_DEEP |
| `file_b.md` |  | READ_DEEP |
"""

# --- Fail: backslash in normalizedPath ---
BACKSLASH_IN_PATH = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `cvf\\\\add\\\\file_a.md` | READ_DEEP |
"""

# --- Fail: uppercase in normalizedPath ---
UPPERCASE_IN_PATH = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `CVF ADD/File_A.md` | READ_DEEP |
"""

# --- Fail: trailing slash ---
TRAILING_SLASH = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `cvf add/file_a.md/` | READ_DEEP |
"""

# --- Fail: leading slash ---
LEADING_SLASH = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `/cvf add/file_a.md` | READ_DEEP |
"""

# --- Fail: ./ segment ---
DOT_SLASH_SEGMENT = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `./cvf add/file_a.md` | READ_DEEP |
"""

# --- Fail: ../ segment ---
DOTDOT_SLASH_SEGMENT = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `../cvf add/file_a.md` | READ_DEEP |
"""

# --- Fail: Windows drive letter ---
WINDOWS_DRIVE = """\
# CVF Test Readiness Packet

- Classification task class: LEGACY_CORPUS_ABSORPTION

| sourcePath | normalizedPath | processingStatus |
| --- | --- | --- |
| `file_a.md` | `c:/cvf add/file_a.md` | READ_DEEP |
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


# === Canonical violation unit tests ===

def test_canonical_valid_path() -> None:
    assert MODULE._canonical_violations("cvf add/file_a.md") == []


def test_canonical_valid_nested_path() -> None:
    assert MODULE._canonical_violations("knowledge base graphify/cvf_graph_memory_data_model.md") == []


def test_canonical_backslash_violation() -> None:
    issues = MODULE._canonical_violations("cvf\\add\\file_a.md")
    assert any("backslash" in i for i in issues)


def test_canonical_uppercase_violation() -> None:
    issues = MODULE._canonical_violations("CVF_ADD/File_A.md")
    assert any("lowercase" in i for i in issues)


def test_canonical_trailing_slash_violation() -> None:
    issues = MODULE._canonical_violations("cvf add/file_a.md/")
    assert any("trailing slash" in i for i in issues)


def test_canonical_leading_slash_violation() -> None:
    issues = MODULE._canonical_violations("/cvf add/file_a.md")
    assert any("leading slash" in i for i in issues)


def test_canonical_dot_slash_violation() -> None:
    issues = MODULE._canonical_violations("./cvf add/file_a.md")
    assert any("./` segment" in i or "./" in i for i in issues)


def test_canonical_dotdot_slash_violation() -> None:
    issues = MODULE._canonical_violations("../cvf add/file_a.md")
    assert any("../" in i for i in issues)


def test_canonical_windows_drive_violation() -> None:
    issues = MODULE._canonical_violations("c:/path/to/file.md")
    assert any("drive" in i.lower() or "c:" in i.lower() for i in issues)


# === Applicability tests ===

def test_non_applicable_content_skipped() -> None:
    assert not MODULE._is_applicable("docs/audits/CVF_TEST_REFERENCE.md", NON_APPLICABLE_CONTENT)


def test_archive_path_skipped() -> None:
    assert not MODULE._is_applicable(ARCHIVE_PATH, VALID_NORMALIZED)


def test_non_applicable_prefix_skipped() -> None:
    assert not MODULE._is_applicable(NON_APPLICABLE_PATH, VALID_NORMALIZED)


def test_applicable_via_readiness_packet_filename_for_baseline() -> None:
    content = "docType: baseline\n## Corpus Intelligence Classification\nsome content"
    assert MODULE._is_applicable("docs/audits/CVF_TEST_READINESS_PACKET_2026-06-02.md", content)


# === Pass cases ===

def test_valid_normalized_paths_pass() -> None:
    assert MODULE.validate_normalized_path(APPLICABLE_PATH, VALID_NORMALIZED) == []


def test_no_normalized_path_column_passes() -> None:
    """When no normalizedPath column exists, NR-05 does not apply — no violation."""
    assert MODULE.validate_normalized_path(APPLICABLE_PATH, NO_NORM_PATH_COLUMN) == []


def test_empty_norm_path_rows_skipped() -> None:
    """Empty or N/A normalizedPath values are skipped — no violation."""
    assert MODULE.validate_normalized_path(APPLICABLE_PATH, EMPTY_NORM_PATH) == []


# === Fail cases ===

def test_backslash_in_normalized_path_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, BACKSLASH_IN_PATH)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_uppercase_in_normalized_path_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, UPPERCASE_IN_PATH)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_trailing_slash_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, TRAILING_SLASH)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_leading_slash_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, LEADING_SLASH)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_dot_slash_segment_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, DOT_SLASH_SEGMENT)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_dotdot_slash_segment_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, DOTDOT_SLASH_SEGMENT)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


def test_windows_drive_letter_fails() -> None:
    issues = MODULE.validate_normalized_path(APPLICABLE_PATH, WINDOWS_DRIVE)
    assert any("normalized_path_not_canonical" in t for t in _types(issues))


# === Range / worktree handling ===

def test_deleted_path_not_checked() -> None:
    changed: dict[str, list[str]] = {APPLICABLE_PATH: ["D"]}
    report = MODULE._classify(changed)
    assert report["violations"] == []
    assert report["checkedPaths"] == []
