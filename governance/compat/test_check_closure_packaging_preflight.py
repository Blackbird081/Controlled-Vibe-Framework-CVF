from __future__ import annotations

import importlib.util
import tempfile
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_closure_packaging_preflight.py")
SPEC = importlib.util.spec_from_file_location("check_closure_packaging_preflight", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_closed_doc_rejects_stale_dispatch_language() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

This does not dispatch worker execution.
"""
    issues = MODULE.validate_doc("docs/work_orders/CVF_WO_EXAMPLE.md", text, {"docs/work_orders/CVF_WO_EXAMPLE.md"})
    assert any("stale dispatch/hold/pre-closure" in issue for issue in issues)


def test_stale_dispatch_language_inside_code_fence_is_not_flagged() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

```text
This does not dispatch worker execution.
```
"""
    issues = MODULE.validate_doc("docs/work_orders/CVF_WO_EXAMPLE.md", text, {"docs/work_orders/CVF_WO_EXAMPLE.md"})
    assert not any("stale dispatch/hold/pre-closure" in issue for issue in issues)


def test_stale_dispatch_language_outside_fence_still_fires() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

This does not dispatch worker execution.
"""
    issues = MODULE.validate_doc("docs/work_orders/CVF_WO_EXAMPLE.md", text, {"docs/work_orders/CVF_WO_EXAMPLE.md"})
    assert any("stale dispatch/hold/pre-closure" in issue for issue in issues)


def test_closed_pass_substring_inside_fence_is_not_closed_equivalent() -> None:
    text = """
# Example

Status: ACTIVE

Other tranche reference:

```text
CLOSED_PASS_BOUNDED
```
"""
    assert not MODULE._is_closed_equivalent(text)


def test_corpus_enumeration_rejects_git_listing() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Corpus Completeness And Report Integrity

- Enumeration command: `git ls-files docs/reviews`
"""
    issues = MODULE.validate_doc("docs/reviews/CVF_EXAMPLE.md", text, {"docs/reviews/CVF_EXAMPLE.md"})
    assert any("git-derived file listing" in issue for issue in issues)


def test_corpus_enumeration_rejects_bare_rg_files() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Corpus Completeness And Report Integrity

- Enumeration command: `rg --files docs/reviews`
"""
    issues = MODULE.validate_doc("docs/reviews/CVF_EXAMPLE.md", text, {"docs/reviews/CVF_EXAMPLE.md"})
    assert any("--hidden" in issue and "--no-ignore" in issue for issue in issues)


def test_closure_diff_gate_rejects_path_not_in_changed_range() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Closure Diff Gate

| Requirement | Final artifact | Disposition |
| --- | --- | --- |
| Runtime route | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | SATISFIED |
"""
    issues = MODULE.validate_doc("docs/reviews/CVF_EXAMPLE.md", text, {"docs/reviews/CVF_EXAMPLE.md"})
    assert any("not present in the changed range" in issue for issue in issues)


def test_valid_closed_doc_passes_preflight() -> None:
    text = """
# Example

Status: CLOSED_PASS_BOUNDED

## Closure Diff Gate

| Requirement | Final artifact | Disposition |
| --- | --- | --- |
| Completion | `docs/reviews/CVF_EXAMPLE.md` | SATISFIED |

## Corpus Completeness And Report Integrity

- Enumeration command: `rg --files --hidden --no-ignore docs/reviews/CVF_EXAMPLE.md`
"""
    issues = MODULE.validate_doc("docs/reviews/CVF_EXAMPLE.md", text, {"docs/reviews/CVF_EXAMPLE.md"})
    assert issues == []


def test_closed_baseline_is_in_active_scope() -> None:
    assert MODULE._is_active_doc("docs/baselines/CVF_GC018_EXAMPLE.md")


def test_exhaustive_directory_claim_rejects_omitted_files() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        target = repo_root / "src" / "lib"
        target.mkdir(parents=True)
        (target / "a.ts").write_text("", encoding="utf-8")
        (target / "b.ts").write_text("", encoding="utf-8")
        text = "`src/lib/` contains only `a.ts`."
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE._validate_exhaustive_directory_claims(text)
    assert any("unsupported exhaustive directory claim" in issue for issue in issues)
    assert any("b.ts" in issue for issue in issues)


def test_exhaustive_directory_claim_accepts_exact_direct_children() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        target = repo_root / "src" / "lib"
        target.mkdir(parents=True)
        (target / "a.ts").write_text("", encoding="utf-8")
        (target / "b.ts").write_text("", encoding="utf-8")
        text = "`src/lib/` contains only `a.ts` and `b.ts`."
        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE._validate_exhaustive_directory_claims(text)
    assert issues == []


def test_descriptive_contains_only_prose_does_not_trigger_directory_check() -> None:
    text = "The result contains only caller-supplied summaries."
    assert MODULE._validate_exhaustive_directory_claims(text) == []


def test_decided_roadmap_rejects_same_tranche_parked_residue() -> None:
    text = """
# Roadmap

Status: MPI_T6_DECIDED_DEFER_PHASE2_FULLY_DECIDED

MPI-T6 remains parked until a future packet.
"""
    issues = MODULE._validate_decided_roadmap_residue(
        "docs/roadmaps/CVF_MPI_ROADMAP.md", text
    )
    assert any("marks MPI-T6 decided" in issue for issue in issues)


def test_decided_roadmap_allows_different_future_tranche_parked() -> None:
    text = """
# Roadmap

Status: MPI_T6_DECIDED_DEFER_PHASE2_FULLY_DECIDED

MPI-T7 remains parked until operator selection.
"""
    assert MODULE._validate_decided_roadmap_residue(
        "docs/roadmaps/CVF_MPI_ROADMAP.md", text
    ) == []


def test_complete_pending_gates_is_stale_in_closed_baseline() -> None:
    text = """
# GC-018

Status: CLOSED_PASS_BOUNDED

Work remains COMPLETE_PENDING_GATES.
"""
    issues = MODULE.validate_doc(
        "docs/baselines/CVF_GC018_EXAMPLE.md",
        text,
        {"docs/baselines/CVF_GC018_EXAMPLE.md"},
    )
    assert any("COMPLETE_PENDING_GATES" in issue for issue in issues)


def test_active_handoff_can_authorize_session_sync_protected_paths(monkeypatch) -> None:
    handoff = "AGENT_HANDOFF_V15_2026-05-29.md"
    changed = {
        "CVF_SESSION_MEMORY.md": {"M"},
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": {"M"},
        handoff: {"M"},
    }
    texts = {
        handoff: """
## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: session sync only.

Protected paths:

- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`

Operator authorization: operator requested session-sync guard hardening.

Rollback boundary: revert only the session-sync update.
""",
        "CVF_SESSION_MEMORY.md": "",
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": "{}",
    }

    monkeypatch.setattr(MODULE, "_get_changed", lambda base, head: changed)
    monkeypatch.setattr(MODULE, "_read_rel", lambda path: texts.get(path, ""))

    report = MODULE._run_check("base", "head")

    assert report["compliant"]
    assert report["authorizationDocs"] == [handoff]


def test_archive_handoff_cannot_authorize_session_sync_protected_paths(monkeypatch) -> None:
    handoff = "CVF_SESSION/handoffs/archive/AGENT_HANDOFF.md"
    changed = {
        "CVF_SESSION_MEMORY.md": {"M"},
        "CVF_SESSION/ACTIVE_SESSION_STATE.json": {"M"},
        handoff: {"M"},
    }
    texts = {
        handoff: """
## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: session sync only.

Protected paths:

- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`

Operator authorization: operator requested session-sync guard hardening.

Rollback boundary: revert only the session-sync update.
""",
    }

    monkeypatch.setattr(MODULE, "_get_changed", lambda base, head: changed)
    monkeypatch.setattr(MODULE, "_read_rel", lambda path: texts.get(path, ""))

    report = MODULE._run_check("base", "head")

    assert not report["compliant"]
    assert report["authorizationDocs"] == []
