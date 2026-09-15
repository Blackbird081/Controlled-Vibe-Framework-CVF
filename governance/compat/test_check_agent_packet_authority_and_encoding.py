from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest


MODULE_PATH = Path(__file__).resolve().with_name("check_agent_packet_authority_and_encoding.py")
SPEC = importlib.util.spec_from_file_location("check_agent_packet_authority_and_encoding", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=repo,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )


def _init_repo(repo: Path) -> None:
    _git(repo, "init", "-q")
    _git(repo, "config", "user.email", "worker@example.invalid")
    _git(repo, "config", "user.name", "worker")


def _write(repo: Path, rel_path: str, content: bytes) -> None:
    full = repo / rel_path
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_bytes(content)


def _commit_all(repo: Path, message: str) -> None:
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", message)


def _rev(repo: Path, ref: str) -> str:
    return _git(repo, "rev-parse", ref).stdout.strip()


def _run_check_in_repo(repo: Path, base: str | None, head: str | None) -> dict:
    with patch.object(MODULE, "REPO_ROOT", repo):
        return MODULE._run_check(base, head)


def _violation_paths(report: dict) -> set[str]:
    return {violation["path"] for violation in report["violations"]}


def test_review_packet_rejects_missing_authority_artifact() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        text = (
            "Worker return references "
            "`docs/work_orders/CVF_AGENT_WORK_ORDER_MISSING_FOR_CLAUDE_2026-06-10.md`.\n"
        )
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE.find_authority_reference_violations(
                "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-10.md",
                text,
            )
    assert any("missing authority artifact" in issue for issue in issues)


def test_review_packet_accepts_existing_authority_artifact() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        authority = repo_root / "docs" / "work_orders" / "CVF_AGENT_WORK_ORDER_PRESENT_2026-06-10.md"
        authority.parent.mkdir(parents=True, exist_ok=True)
        authority.write_text("Status: DISPATCHED\n", encoding="utf-8")
        text = (
            "Worker return references "
            "`docs/work_orders/CVF_AGENT_WORK_ORDER_PRESENT_2026-06-10.md`.\n"
        )
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE.find_authority_reference_violations(
                "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-10.md",
                text,
            )
    assert issues == []


def test_added_non_ascii_line_requires_exception_marker() -> None:
    issues = MODULE.find_non_ascii_line_violations(
        "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-10.md",
        [MODULE.AddedLine(7, "Result - contains smart dash \u2014 here")],
        has_exception=False,
    )
    assert any("non-ASCII" in issue for issue in issues)


def test_added_non_ascii_line_allows_recorded_exception_marker() -> None:
    issues = MODULE.find_non_ascii_line_violations(
        "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-10.md",
        [MODULE.AddedLine(7, "Quoted filename: T\u00e0i li\u1ec7u.pdf")],
        has_exception=True,
    )
    assert issues == []


def test_pinned_raw_preimage_archive_allows_historical_non_ascii() -> None:
    issues = MODULE.find_non_ascii_line_violations(
        "docs/reference/archive/AGENTS_FULL_PRE_T2B_2026-08-11.md",
        [MODULE.AddedLine(7, "Historical text with smart dash \u2014 preserved")],
        has_exception=False,
    )
    assert issues == []


def test_other_archive_still_rejects_non_ascii_without_exception() -> None:
    issues = MODULE.find_non_ascii_line_violations(
        "docs/reference/archive/AGENTS_OTHER_ARCHIVE.md",
        [MODULE.AddedLine(7, "Historical text with smart dash \u2014 unapproved")],
        has_exception=False,
    )
    assert any("non-ASCII" in issue for issue in issues)


def test_provider_specific_agent_file_rejected_as_source_authority() -> None:
    text = (
        "## Source Authority\n\n"
        "| Source | Path | Role |\n"
        "| --- | --- | --- |\n"
        "| Repository agent guidance | `CLAUDE.md` | canonical routing evidence |\n"
    )
    issues = MODULE.find_provider_specific_authority_violations(
        "docs/reference/CVF_EXAMPLE_MATRIX_2026-06-13.md",
        text,
    )
    assert any("provider-specific" in issue for issue in issues)


def test_provider_specific_agent_file_allowed_when_marked_not_cvf_source() -> None:
    text = (
        "## Finding-To-Governance Learning Disposition\n\n"
        "| Finding | Disposition |\n"
        "| --- | --- |\n"
        "| Provider-specific `CLAUDE.md` guidance cited by worker | NOT_CVF_SOURCE |\n"
    )
    issues = MODULE.find_provider_specific_authority_violations(
        "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md",
        text,
    )
    assert issues == []


def test_cvf_session_memory_front_door_not_confused_with_provider_memory() -> None:
    text = (
        "## Source Authority\n\n"
        "| Source | Path | Role |\n"
        "| --- | --- | --- |\n"
        "| Active front door | `CVF_SESSION_MEMORY.md` | session continuity |\n"
    )
    issues = MODULE.find_provider_specific_authority_violations(
        "docs/reviews/CVF_EXAMPLE_COMPLETION_2026-06-13.md",
        text,
    )
    assert issues == []


def test_provider_local_interaction_cannot_be_accepted_as_authority() -> None:
    text = (
        "## Authority Chain\n\n"
        "| Authority | Evidence | Disposition |\n"
        "|---|---|---|\n"
        "| Role selection | AskUserQuestion, 2026-06-22 | ACCEPT |\n"
    )
    issues = MODULE.find_provider_specific_authority_violations(
        "docs/baselines/CVF_GC018_EXAMPLE.md", text
    )
    assert any("provider-local interaction" in issue for issue in issues)


def test_provider_local_interaction_can_be_marked_not_cvf_source() -> None:
    text = (
        "## Authority Chain\n\n"
        "| Authority | Evidence | Disposition |\n"
        "|---|---|---|\n"
        "| Role selection | AskUserQuestion, 2026-06-22 | NOT_CVF_SOURCE |\n"
    )
    issues = MODULE.find_provider_specific_authority_violations(
        "docs/baselines/CVF_GC018_EXAMPLE.md", text
    )
    assert issues == []


def test_source_verification_rejects_value_assignment_in_symbol_cell() -> None:
    text = (
        "## Source Verification Block\n\n"
        "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |\n"
        "|---|---|---|---|---|---|---|\n"
        "| false invariant | `src/example.ts` | line 4 | `rawMemoryReleased: false` | result | LITERAL_INVARIANT | ACCEPT |\n"
    )
    issues = MODULE.find_source_verification_fidelity_violations(
        "docs/reference/CVF_EXAMPLE.md", text
    )
    assert any("value assignment or type annotation" in issue for issue in issues)


def test_source_verification_accepts_bare_symbol_cell() -> None:
    text = (
        "## Source Verification Block\n\n"
        "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |\n"
        "|---|---|---|---|---|---|---|\n"
        "| false invariant | `src/example.ts` | line 4 | `rawMemoryReleased` | result | LITERAL_INVARIANT | ACCEPT |\n"
    )
    issues = MODULE.find_source_verification_fidelity_violations(
        "docs/reference/CVF_EXAMPLE.md", text
    )
    assert issues == []


def test_source_verification_requires_doc_only_new_fact_type() -> None:
    text = (
        "## Source Verification Block\n\n"
        "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |\n"
        "|---|---|---|---|---|---|---|\n"
        "| new doc-only field | `docs/work_orders/example.md` | New Doc-Only Terms | `memorySummaryRequest` | contract | VALUE_SET | ACCEPT |\n"
    )
    issues = MODULE.find_source_verification_fidelity_violations(
        "docs/reference/CVF_EXAMPLE.md", text
    )
    assert any("DOC_ONLY_NEW" in issue for issue in issues)


def test_pending_worker_return_rejects_missing_gate_pass_and_required_reads() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        work_order_path = repo_root / "docs" / "work_orders" / "example.md"
        work_order_path.parent.mkdir(parents=True, exist_ok=True)
        work_order_path.write_text(
            "## Required First Reads\n\n"
            "| Source | Reason |\n|---|---|\n"
            "| `docs/reference/guard_orientation/README.md` | guard |\n"
            "| `docs/reference/source.md` | source |\n\n"
            "## Required Checks\n\n"
            "`python governance/compat/run_worker_return_fast_gate.py`\n",
            encoding="utf-8",
        )
        text = (
            "Status: COMPLETE_PENDING_REVIEW\n\n"
            "dispatchWorkOrder: `docs/work_orders/example.md`\n\n"
            "## Source Inventory\n\n"
            "| File | Action | Reason |\n|---|---|---|\n"
            "| `docs/reference/source.md` | READ-POINTER | cited |\n\n"
            "## Gate Evidence\n\nWorker-return fast gate expected to pass.\n"
        )
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE.find_pending_worker_evidence_violations(
                "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-22.md", text
            )
    assert any("lacks executed PASS evidence" in issue for issue in issues)
    assert any("absent from Source Inventory" in issue for issue in issues)
    assert any("non-read action" in issue for issue in issues)


def test_pending_worker_return_accepts_executed_gate_and_required_reads() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        work_order_path = repo_root / "docs" / "work_orders" / "example.md"
        work_order_path.parent.mkdir(parents=True, exist_ok=True)
        work_order_path.write_text(
            "## Required First Reads\n\n"
            "| Source | Reason |\n|---|---|\n"
            "| `docs/reference/source.md` | source |\n\n"
            "## Required Checks\n\n"
            "`python governance/compat/run_worker_return_fast_gate.py`\n",
            encoding="utf-8",
        )
        text = (
            "Status: COMPLETE_PENDING_REVIEW\n\n"
            "dispatchWorkOrder: `docs/work_orders/example.md`\n\n"
            "## Source Inventory\n\n"
            "| File | Action | Reason |\n|---|---|---|\n"
            "| `docs/reference/source.md` | READ | verified |\n\n"
            "## Gate Evidence\n\n"
            "### Worker-return fast gate\n\n"
            "`python governance/compat/run_worker_return_fast_gate.py`\n\n"
            "COMPLIANT: worker-return fast gate passed.\n"
        )
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE.find_pending_worker_evidence_violations(
                "docs/reviews/CVF_EXAMPLE_WORKER_RETURN_2026-06-22.md", text
            )
    assert issues == []


def test_heading_section_keeps_nested_subheadings() -> None:
    text = (
        "## Gate Evidence\n\n"
        "### Worker-return fast gate\n\nPASS\n\n"
        "## Claim Boundary\n\nNo runtime claim.\n"
    )
    section = MODULE._extract_heading_section(text, "Gate Evidence")
    assert "### Worker-return fast gate" in section
    assert "PASS" in section
    assert "Claim Boundary" not in section


def test_pure_rename_with_historical_unicode_reports_no_violation() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", "line one\nsmart dash \u2014 here\n".encode("utf-8"))
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _commit_all(repo, "rename")
        head = _rev(repo, "HEAD")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/new.md" not in _violation_paths(report)


def test_rename_with_new_unicode_reports_only_new_line() -> None:
    # Enough unchanged shared content keeps Git's default 50% rename
    # similarity detection above threshold so this is reported as R, not A/D.
    unchanged = "line one\nline two\nline three\nline four\nsmart dash \u2014 here\n"
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", unchanged.encode("utf-8"))
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(
            repo,
            "docs/new.md",
            (unchanged + "newly added line with \u00e9 accent\n").encode("utf-8"),
        )
        _commit_all(repo, "rename plus new unicode")
        head = _rev(repo, "HEAD")
        status = _git(repo, "diff", "--name-status", "-M", base, head).stdout
        assert status.splitlines()[0].split("\t")[0].startswith("R")
        report = _run_check_in_repo(repo, base, head)
    violations = {v["path"]: v["issues"] for v in report["violations"]}
    assert "docs/new.md" in violations
    issues = violations["docs/new.md"]
    assert len(issues) == 1
    assert "line 6" in issues[0]


def test_rename_with_ascii_only_edit_passes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"line one\nline two\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(repo, "docs/new.md", b"line one\nline two\nline three ascii only\n")
        _commit_all(repo, "rename plus ascii edit")
        head = _rev(repo, "HEAD")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/new.md" not in _violation_paths(report)


def test_new_file_with_unicode_without_exception_fails() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/base.md", b"seed\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _write(repo, "docs/fresh.md", "brand new file with \u00e9 accent\n".encode("utf-8"))
        _commit_all(repo, "add fresh file")
        head = _rev(repo, "HEAD")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/fresh.md" in _violation_paths(report)


def test_existing_file_newly_added_unicode_fails() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/doc.md", b"ascii only line\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _write(
            repo, "docs/doc.md", "ascii only line\nnewly added \u00e8 unicode line\n".encode("utf-8")
        )
        _commit_all(repo, "modify with unicode")
        head = _rev(repo, "HEAD")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/doc.md" in _violation_paths(report)


def test_below_threshold_move_is_treated_as_ordinary_added_destination() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"aaaa\nbbbb\ncccc\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(
            repo,
            "docs/new.md",
            "totally different content\nnothing shared with old\nunicode here \u00e9\n".encode(
                "utf-8"
            ),
        )
        _commit_all(repo, "below-threshold move")
        head = _rev(repo, "HEAD")
        status = _git(repo, "diff", "--name-status", "-M", base, head).stdout
        assert "R" not in status.splitlines()[0].split("\t")[0]
        report = _run_check_in_repo(repo, base, head)
    assert "docs/new.md" in _violation_paths(report)


def test_below_threshold_move_does_not_claim_historical_provenance() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"aaaa\nbbbb\ncccc\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(
            repo,
            "docs/new.md",
            "totally different content\nnothing shared with old\n".encode("utf-8"),
        )
        _commit_all(repo, "below-threshold move ascii")
        head = _rev(repo, "HEAD")
        with patch.object(MODULE, "REPO_ROOT", repo):
            changed = MODULE._get_changed(base, head)
    record = changed["docs/new.md"]
    assert record.rename_source is None
    assert not any(status.startswith(("R", "C")) for status in record.statuses)


def test_rename_path_with_spaces_resolves_source_and_destination() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old name.md", "content with \u00e9 accent\n".encode("utf-8"))
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old name.md", "docs/new name.md")
        _commit_all(repo, "rename with spaces")
        head = _rev(repo, "HEAD")
        with patch.object(MODULE, "REPO_ROOT", repo):
            changed = MODULE._get_changed(base, head)
        report = _run_check_in_repo(repo, base, head)
    assert changed["docs/new name.md"].rename_source == "docs/old name.md"
    assert "docs/new name.md" not in _violation_paths(report)


def test_rename_path_with_non_ascii_name_resolves_source_and_destination() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        old_path = "docs/t\u00e0i_li\u1ec7u_c\u0169.md"
        new_path = "docs/t\u00e0i_li\u1ec7u_m\u1edbi.md"
        _write(repo, old_path, "n\u1ed9i dung c\u0169\n".encode("utf-8"))
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", old_path, new_path)
        _commit_all(repo, "rename non-ascii path")
        head = _rev(repo, "HEAD")
        with patch.object(MODULE, "REPO_ROOT", repo):
            changed = MODULE._get_changed(base, head)
        report = _run_check_in_repo(repo, base, head)
    assert changed[new_path].rename_source == old_path
    assert new_path not in _violation_paths(report)


def test_malformed_name_status_record_fails_closed() -> None:
    with pytest.raises(ValueError, match="truncated R100 record"):
        MODULE._parse_name_status_z("R100\0source.md\0")


def test_malformed_non_rename_name_status_record_fails_closed() -> None:
    with patch.object(
        MODULE,
        "_get_changed",
        side_effect=ValueError("malformed name-status stream: truncated M record"),
    ):
        report = MODULE._run_check(None, None)
    assert report["compliant"] is False
    assert report["violations"][0]["path"] == "<git-name-status>"
    assert "truncated M record" in report["violations"][0]["issues"][0]


def test_name_status_parser_preserves_leading_and_trailing_spaces() -> None:
    changed = MODULE._parse_name_status_z("R100\0 docs/old.md \0 docs/new.md \0")
    assert " docs/new.md " in changed
    assert changed[" docs/new.md "].rename_source == " docs/old.md "


def test_git_diff_failure_returns_noncompliant_provenance() -> None:
    with patch.object(MODULE, "_run_git", return_value=(2, "", "fatal: synthetic failure")):
        result = MODULE._added_lines_from_git_diff(
            ["diff", "--", "docs/file.md"], "test path"
        )
    assert result.diagnostic is not None
    assert "synthetic failure" in result.diagnostic


def test_missing_source_blob_produces_deterministic_diagnostic() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        record = MODULE.ChangeRecord(statuses={"R100"}, rename_source="never_existed.md")
        with patch.object(MODULE, "REPO_ROOT", repo):
            result = MODULE._rename_aware_added_lines(
                "dest.md", record, "deadbeef", "cafebabe"
            )
    assert result.diagnostic is not None
    assert "never_existed.md" in result.diagnostic


def test_decode_failure_produces_deterministic_diagnostic() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/base.md", b"seed\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _write(repo, "docs/bad.md", b"invalid utf-8: \xff\n")
        report = _run_check_in_repo(repo, base, base)
    violations = {v["path"]: v["issues"] for v in report["violations"]}
    assert "docs/bad.md" in violations
    assert any("decode failure" in issue for issue in violations["docs/bad.md"])


def test_binary_rename_is_classified_without_text_violation() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        payload = bytes(range(256)) * 20
        _write(repo, "docs/old.md", payload)
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        changed_payload = payload[:100] + b"\xff\xfe\xfd" + payload[103:]
        _write(repo, "docs/new.md", changed_payload)
        _commit_all(repo, "binary rename with change")
        head = _rev(repo, "HEAD")
        status = _git(repo, "diff", "--name-status", "-M50", base, head).stdout
        assert status.splitlines()[0].split("\t")[0].startswith("R")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/new.md" not in _violation_paths(report)


def test_staged_pure_rename_with_historical_unicode_passes_head_head_hook() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", "historical dash \u2014 stays\n".encode("utf-8"))
        _commit_all(repo, "init")
        head = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        report = _run_check_in_repo(repo, head, head)
    assert "docs/new.md" not in _violation_paths(report)


def test_staged_rename_with_new_unicode_fails_head_head_hook() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"line one\nline two\n")
        _commit_all(repo, "init")
        head = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(repo, "docs/new.md", "line one\nline two\nnew \u00e9\n".encode("utf-8"))
        _git(repo, "add", "docs/new.md")
        report = _run_check_in_repo(repo, head, head)
    assert "docs/new.md" in _violation_paths(report)


def test_staged_rename_then_unstaged_unicode_edit_checks_both_layers() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"line one\nline two\n")
        _commit_all(repo, "init")
        head = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _write(repo, "docs/new.md", "line one\nline two\nunstaged \u00e9\n".encode("utf-8"))
        report = _run_check_in_repo(repo, head, head)
    assert "docs/new.md" in _violation_paths(report)


def test_committed_range_rename_plus_staged_edit_checks_later_layer() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/old.md", b"line one\nline two\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _git(repo, "mv", "docs/old.md", "docs/new.md")
        _commit_all(repo, "rename")
        head = _rev(repo, "HEAD")
        _write(repo, "docs/new.md", "line one\nline two\nstaged \u00e9\n".encode("utf-8"))
        _git(repo, "add", "docs/new.md")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/new.md" in _violation_paths(report)


def test_text_encoding_exception_behavior_is_unchanged() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/base.md", b"seed\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _write(
            repo,
            "docs/fresh.md",
            (
                "Text Encoding Exception: this file legitimately carries "
                "non-ASCII text \u00e9.\nbrand new content \u00e8\n"
            ).encode("utf-8"),
        )
        _commit_all(repo, "add exception-marked file")
        head = _rev(repo, "HEAD")
        report = _run_check_in_repo(repo, base, head)
    assert "docs/fresh.md" not in _violation_paths(report)


def test_untracked_file_retains_fail_closed_behavior() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/base.md", b"seed\n")
        _commit_all(repo, "init")
        base = _rev(repo, "HEAD")
        _write(repo, "docs/untracked.md", "untracked new content \u00e9\n".encode("utf-8"))
        report = _run_check_in_repo(repo, base, base)
    assert "docs/untracked.md" in _violation_paths(report)


def test_deleted_tracked_path_recreated_untracked_is_not_hidden_by_delete() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo = Path(tmp)
        _init_repo(repo)
        _write(repo, "docs/recreated.md", b"tracked ascii\n")
        _commit_all(repo, "init")
        head = _rev(repo, "HEAD")
        _git(repo, "rm", "--cached", "docs/recreated.md")
        _write(repo, "docs/recreated.md", "replacement \u00e9\n".encode("utf-8"))
        report = _run_check_in_repo(repo, head, head)
    assert "docs/recreated.md" in _violation_paths(report)
