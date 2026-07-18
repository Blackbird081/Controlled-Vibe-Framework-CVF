from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import check_work_order_dispatch_quality_source as MODULE


def _write(root: Path, rel: str, text: str) -> None:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def test_source_verification_table_shape_rejects_noncanonical_columns() -> None:
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Symbol / path | File | Verified line | Disposition |",
            "|---|---|---|---|",
            "| `SourceThing` | `governance/contracts/source.ts` | line 1 | ACCEPT |",
        ]
    )

    assert MODULE._validate_source_verification_table_shape(text) == [
        "Source Verification table uses noncanonical columns; required columns are: "
        "Claimed item | Source file | Verified line/section | Verified path or symbol | "
        "Owning interface/function/schema | Disposition"
    ]


def test_accepted_source_row_missing_source_file_fails() -> None:
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            "| Future values | `docs/reference/CVF_MISSING_SPEC.md` | S3 | `bridgeAdvisoryType` | BridgeSpec | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        with patch.object(MODULE, "REPO_ROOT", Path(tmp)):
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert "Source Verification ACCEPT cites missing source file `docs/reference/CVF_MISSING_SPEC.md`" in issues


def test_accepted_source_row_declared_values_must_all_be_listed() -> None:
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            "| WorkflowRecoveryAction values `resume_from_checkpoint` | `governance/contracts/workflow.ts` | lines 1-3 | `WorkflowRecoveryAction` | WorkflowRecoveryAction | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(
            root,
            "governance/contracts/workflow.ts",
            "\n".join(
                [
                    "export type WorkflowRecoveryAction =",
                    "  | 'resume_from_checkpoint'",
                    "  | 'request_human_review';",
                ]
            ),
        )
        with patch.object(MODULE, "REPO_ROOT", root):
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert (
        "Source Verification ACCEPT row claims values for `WorkflowRecoveryAction` "
        "but omits source value(s): request_human_review"
    ) in issues


def test_source_verification_line_anchor_must_cite_definition_line() -> None:
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            "| Scan outcome builder exists | `governance/compat/example_scan_report.py` | line 4 | `build_scan_outcome_report` | function | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(
            root,
            "governance/compat/example_scan_report.py",
            "\n".join(
                [
                    "# Example",
                    "def build_scan_outcome_report(",
                    "    raw_scan,",
                    "    options,",
                    "):",
                    "    return raw_scan",
                    "",
                ]
            ),
        )
        with patch.object(MODULE, "REPO_ROOT", root):
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert (
        "Source Verification ACCEPT row cites `build_scan_outcome_report` at line 4, "
        "but `governance/compat/example_scan_report.py` defines it at line 2; "
        "cite the symbol definition line, not a continuation or interior signature line"
    ) in issues


def test_negative_search_claim_without_collision_block_fails() -> None:
    text = "Runtime token `documentStatus` is NOT FOUND in runtime owners."

    issues = MODULE._validate_negative_search_collision_discipline(
        "docs/work_orders/test.md",
        text,
        "work order",
    )

    assert issues == [
        "work order contains `NOT FOUND` or `BLOCKED_SOURCE_NOT_FOUND` "
        "but lacks `## Negative Search And Collision Discipline` evidence"
    ]


def test_negative_search_claim_with_recorded_collision_passes() -> None:
    text = "\n".join(
        [
            "Runtime token `documentStatus` is NOT FOUND in the runtime owner.",
            "## Negative Search And Collision Discipline",
            "- Search roots: runtime owner and tests.",
            "- Search command: `rg \"documentStatus\" EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`.",
            "- Coverage: source, tests, docs, JSON, external evidence.",
            "- Same-token collision results: `documentStatus` occurs in a non-authoritative fixture with different meaning.",
            "- Disposition: collision is not binding for this owner; token absent from runtime owner.",
        ]
    )

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(
            root,
            "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/profile.test.ts",
            "const fixture = { documentStatus: 'approved' };\n",
        )
        with patch.object(MODULE, "REPO_ROOT", root):
            issues = MODULE._validate_negative_search_collision_discipline(
                "docs/work_orders/test.md",
                text,
                "work order",
            )

    assert issues == []
