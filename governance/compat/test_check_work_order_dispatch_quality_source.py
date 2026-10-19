from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pytest

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


def test_parenthesized_source_path_is_extracted_and_accepted_when_present() -> None:
    source_path = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/lpci/page.tsx"
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            f"| Dashboard handler exists | `{source_path}` | full file | `handleQuery` | LPCI dashboard page | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(root, source_path, "export function handleQuery() { return true; }\n")
        with patch.object(MODULE, "REPO_ROOT", root):
            assert MODULE._extract_paths(f"`{source_path}`") == [source_path]
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert issues == []


def test_parenthesized_source_path_still_fails_when_missing() -> None:
    source_path = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/lpci/page.tsx"
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            f"| Dashboard handler exists | `{source_path}` | full file | `handleQuery` | LPCI dashboard page | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        with patch.object(MODULE, "REPO_ROOT", Path(tmp)):
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert f"Source Verification ACCEPT cites missing source file `{source_path}`" in issues


def test_ordinary_source_path_remains_accepted() -> None:
    source_path = "governance/contracts/source.ts"
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            f"| SourceThing exists | `{source_path}` | full file | `SourceThing` | SourceThing | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(root, source_path, "export interface SourceThing { value: string }\n")
        with patch.object(MODULE, "REPO_ROOT", root):
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert issues == []


@pytest.mark.parametrize(
    "malformed_path",
    [
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard/lpci/page.tsx",
        "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/dashboard)/lpci/page.tsx",
    ],
)
def test_unbalanced_parentheses_do_not_bypass_source_validation(malformed_path: str) -> None:
    text = "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            f"| Malformed source | `{malformed_path}` | full file | `handleQuery` | LPCI dashboard page | ACCEPT |",
        ]
    )

    with TemporaryDirectory() as tmp:
        with patch.object(MODULE, "REPO_ROOT", Path(tmp)):
            assert MODULE._extract_paths(f"`{malformed_path}`") == []
            issues = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", text)

    assert "Source Verification ACCEPT row lacks a concrete source file or canonical-contract marker" in issues


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


def _anchor_row(source_path: str, cited_line: int) -> str:
    return "\n".join(
        [
            "## Source Verification Block",
            "| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |",
            "|---|---|---|---|---|---|",
            f"| Target declaration exists | `{source_path}` | line {cited_line} | `target` | declaration | ACCEPT |",
        ]
    )


DEFINITION_FORMS = [
    ("example.py", "def target(value):"),
    ("example.py", "async def target(value):"),
    ("example.py", "class target:"),
    ("example.py", "    def target(self):"),
    ("example.ts", "export function target(value: number) {"),
    ("example.ts", "export default function target(value: number) {"),
    ("example.ts", "export async function target(value: number) {"),
    ("example.ts", "export interface target {"),
    ("example.ts", "export type target = string;"),
    ("example.tsx", "export const target = () => null;"),
    ("example.jsx", "export class target {"),
    ("example.js", "let target = 1;"),
    ("example.mjs", "var target = 1;"),
    ("example.cjs", "function target() {}"),
]


@pytest.mark.parametrize(("source_path", "declaration"), DEFINITION_FORMS)
@pytest.mark.parametrize(
    "blank_lines",
    [[], ["", ""], ["   ", "\t"]],
    ids=["no-blank-control", "lf-blank-lines", "space-and-tab-only-lines"],
)
@pytest.mark.parametrize("newline", ["\n", "\r\n"], ids=["lf", "crlf"])
def test_symbol_definition_line_ignores_preceding_blank_lines(
    source_path: str,
    declaration: str,
    blank_lines: list[str],
    newline: str,
) -> None:
    header = "# header" if source_path.endswith(".py") else "// header"
    source_text = newline.join([header, *blank_lines, declaration, "    body();", ""])
    # header is line 1; each blank or whitespace-only line before the declaration adds one line
    assert MODULE._symbol_definition_line(source_path, source_text, "target") == 2 + len(blank_lines)


@pytest.mark.parametrize(
    ("source_path", "header", "declaration"),
    [
        ("governance/compat/example_anchor.py", "# header", "def target(value):"),
        ("governance/compat/example_anchor.ts", "// header", "export function target(value: number) {"),
    ],
)
def test_source_verification_line_anchor_accepts_declaration_after_blank_lines(
    source_path: str,
    header: str,
    declaration: str,
) -> None:
    # header is line 1, then an empty line, a spaces-only line and a tab-only line; declaration is line 5
    source_text = "\n".join([header, "", "   ", "\t", declaration, "    body();", ""])
    with TemporaryDirectory() as tmp:
        root = Path(tmp)
        _write(root, source_path, source_text)
        with patch.object(MODULE, "REPO_ROOT", root):
            accepted = MODULE._validate_accepted_source_rows("docs/work_orders/test.md", _anchor_row(source_path, 5))
            preceding_blank = MODULE._validate_accepted_source_rows(
                "docs/work_orders/test.md",
                _anchor_row(source_path, 2),
            )

    assert accepted == []
    assert preceding_blank == [
        f"Source Verification ACCEPT row cites `target` at line 2, but `{source_path}` defines it at line 5; "
        "cite the symbol definition line, not a continuation or interior signature line"
    ]


def test_symbol_definition_line_exact_name_absent_and_unsupported_cases() -> None:
    # target_helper must not satisfy target; the exact definition is on line 6
    source_text = "\n".join(
        ["", "def target_helper(value):", "    body()", "", "", "def target(value):", "    body()", ""]
    )
    assert MODULE._symbol_definition_line("example.py", source_text, "target") == 6
    assert MODULE._symbol_definition_line("example.py", "\n\ndef other(value):\n", "target") is None
    assert MODULE._symbol_definition_line("notes.md", "\n\ndef target(value):\n", "target") is None
