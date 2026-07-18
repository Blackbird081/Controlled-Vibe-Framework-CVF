from __future__ import annotations

import importlib.util
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_agent_packet_authority_and_encoding.py")
SPEC = importlib.util.spec_from_file_location("check_agent_packet_authority_and_encoding", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


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
