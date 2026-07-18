from __future__ import annotations

import importlib.util
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_markdown_structural_completeness.py")
SPEC = importlib.util.spec_from_file_location("check_markdown_structural_completeness", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _write(repo_root: Path, rel_path: str, text: str) -> None:
    path = repo_root / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _roadmap_text(extra_sections: str = "") -> str:
    return "\n".join(
        [
            "# Test Roadmap",
            "",
            "Memory class: POINTER_RECORD",
            "",
            "Status: PROPOSED",
            "",
            "docType: roadmap",
            "",
            "## Authorization And Decision",
            "",
            "Operator requested this proposal.",
            "",
            "## Purpose",
            "",
            "Define a bounded roadmap.",
            "",
            "## Scope",
            "",
            "Bounded planning only.",
            "",
            "## Non-Goals",
            "",
            "No implementation.",
            "",
            extra_sections,
            "",
            "## Work Plan",
            "",
            "Plan only.",
            "",
            "## Acceptance Criteria",
            "",
            "Criteria are observable.",
            "",
            "## Verification And Evidence",
            "",
            "Reviewer-fast must pass.",
            "",
            "## Claim Boundary",
            "",
            "No runtime claim.",
            "",
        ]
    )


def test_new_roadmap_without_design_control_gate_fails() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        rel_path = "docs/roadmaps/CVF_TEST_ROADMAP_2026-06-11.md"
        _write(repo_root, rel_path, _roadmap_text())

        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE._validate_markdown(rel_path)

    assert "missing roadmap section: design control gate" in issues


def test_new_roadmap_with_dispatch_boundary_passes_design_control_gate() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        rel_path = "docs/roadmaps/CVF_TEST_ROADMAP_2026-06-11.md"
        _write(
            repo_root,
            rel_path,
            _roadmap_text(
                "\n".join(
                    [
                        "## Dispatch Boundary",
                        "",
                        "This parent roadmap must split into child work orders before build.",
                    ]
                )
            ),
        )

        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE._validate_markdown(rel_path)

    assert "missing roadmap section: design control gate" not in issues


def test_docs_audit_handoff_filename_uses_audit_doctype_not_handoff_keyword() -> None:
    text = "\n".join(
        [
            "# CVF AHB-T1 Handoff Boundary Audit",
            "",
            "Memory class: FULL_RECORD",
            "",
            "Status: CLOSED_PASS_BOUNDED",
            "",
            "docType: audit",
            "",
            "## Purpose",
            "",
            "Audit the handoff boundary.",
            "",
            "## Scope / Target / Owner Boundary",
            "",
            "Documentation-only audit.",
            "",
            "## Target / Source",
            "",
            "Target is the audit artifact itself.",
            "",
            "## Findings / Position",
            "",
            "The filename contains HANDOFF because that is the subject.",
            "",
            "## Risk / Corrective Action",
            "",
            "No session handoff status is claimed.",
            "",
            "## Decision / Recommendation",
            "",
            "Treat this as an audit/review artifact.",
            "",
            "## Claim Boundary",
            "",
            "No active handoff mutation.",
            "",
        ]
    )

    with tempfile.TemporaryDirectory() as tmp:
        repo_root = Path(tmp)
        rel_path = "docs/audits/CVF_AHB_T1_HANDOFF_BOUNDARY_AUDIT_2026-06-16.md"
        _write(repo_root, rel_path, text)

        with patch.object(MODULE, "REPO_ROOT", repo_root):
            issues = MODULE._validate_markdown(rel_path)

    assert not any("missing handoff section" in issue for issue in issues)
    assert not issues
