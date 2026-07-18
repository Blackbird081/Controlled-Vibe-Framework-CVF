import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_corpus_completeness_report_integrity.py")
SPEC = importlib.util.spec_from_file_location("check_corpus_completeness_report_integrity", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


VALID_COMPLETE = """
# Report

## Corpus Completeness And Report Integrity

- Corpus task class: REPORT
- Corpus root: docs/source
- Snapshot time: 2026-06-01T00:00:00+07:00
- Enumeration command: Get-ChildItem docs/source -Recurse -File
- Manifest artifact or inline manifest: inline table below
- Manifest hash: abc123
- Processing ledger artifact or inline ledger: inline table below
- Allowed terminal statuses: READ | SKIPPED_WITH_REASON | DEFERRED | BLOCKED_UNREADABLE
- Reconciliation: manifest=2; ledger_terminal=2; exclusions=0; unresolved=0
- Unresolved files: 0
- Declared exclusions: none
- Unreadable or unsupported files: none
- Aggregation check: PASS
- Drift check: PASS
- Output traceability: report table cites source paths
- Adversarial verification: recomputed totals for 2 files
- Corpus verdict: COMPLETE_VERIFIED
"""


def _messages(issues: list[dict[str, str]]) -> list[str]:
    return [issue["message"] for issue in issues]


def test_valid_complete_verified_passes() -> None:
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", VALID_COMPLETE) == []


def test_not_applicable_with_reason_allows_short_non_corpus_block() -> None:
    text = """
# Worker Return

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON - worker return does not make a corpus completeness claim.
"""
    assert MODULE._validate_output("docs/reviews/CVF_TEST.md", text) == []


def test_not_applicable_requires_reason() -> None:
    text = """
# Worker Return

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON
"""
    issues = MODULE._validate_output("docs/reviews/CVF_TEST.md", text)
    assert any("requires a visible reason" in message for message in _messages(issues))


def test_not_applicable_rejects_complete_claim_outside_block() -> None:
    text = """
# Worker Return

All files were read.

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON - not a corpus task.
"""
    issues = MODULE._validate_output("docs/reviews/CVF_TEST.md", text)
    assert any("cannot accompany" in message for message in _messages(issues))


def test_complete_claim_without_section_fails() -> None:
    issues = MODULE._validate_output("docs/reviews/CVF_TEST.md", "# Review\n\nAll files were read.")
    assert any("Corpus Completeness" in message for message in _messages(issues))


def test_complete_verified_rejects_unresolved_files() -> None:
    invalid = VALID_COMPLETE.replace("unresolved=0", "unresolved=1").replace(
        "Unresolved files: 0", "Unresolved files: 1"
    )
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("requires unresolved=0" in message for message in _messages(issues))


def test_complete_verified_rejects_visible_exclusions() -> None:
    invalid = VALID_COMPLETE.replace("Declared exclusions: none", "Declared exclusions: docs/source/skip.pdf - encrypted")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("cannot retain declared exclusions" in message for message in _messages(issues))


def test_complete_with_exclusions_requires_visible_exclusion() -> None:
    invalid = VALID_COMPLETE.replace("COMPLETE_VERIFIED", "COMPLETE_WITH_DECLARED_EXCLUSIONS")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("requires visible exclusions" in message for message in _messages(issues))


def test_partial_verdict_allows_unresolved_files() -> None:
    partial = VALID_COMPLETE.replace("unresolved=0", "unresolved=3").replace(
        "Unresolved files: 0", "Unresolved files: docs/a.md, docs/b.pdf, docs/c.xlsx"
    ).replace("COMPLETE_VERIFIED", "PARTIAL")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", partial) == []


def test_bare_rg_files_enumeration_fails() -> None:
    invalid = VALID_COMPLETE.replace("Get-ChildItem docs/source -Recurse -File", "rg --files docs/source")
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("rg --files --hidden --no-ignore" in message for message in _messages(issues))


def test_ignore_safe_rg_files_enumeration_passes() -> None:
    safe = VALID_COMPLETE.replace("Get-ChildItem docs/source -Recurse -File", "rg --files --hidden --no-ignore docs/source")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", safe) == []


def test_find_in_prose_enumeration_fails() -> None:
    invalid = VALID_COMPLETE.replace(
        "Get-ChildItem docs/source -Recurse -File",
        "Unable to find files in docs/source",
    )
    issues = MODULE._validate_output("docs/audits/CVF_TEST.md", invalid)
    assert any("rg --files --hidden --no-ignore" in message for message in _messages(issues))


def test_find_command_enumeration_passes() -> None:
    safe = VALID_COMPLETE.replace("Get-ChildItem docs/source -Recurse -File", "find ./docs/source -type f")
    assert MODULE._validate_output("docs/audits/CVF_TEST.md", safe) == []


def test_binding_requires_checker_reference() -> None:
    issues = MODULE._validate_binding(MODULE.AUTORUN_PATH, "no checker binding")
    assert any(MODULE.THIS_SCRIPT_PATH in message for message in _messages(issues))
