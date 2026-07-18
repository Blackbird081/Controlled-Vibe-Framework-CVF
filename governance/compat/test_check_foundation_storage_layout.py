import importlib.util
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_foundation_storage_layout.py")
SPEC = importlib.util.spec_from_file_location("check_foundation_storage_layout", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def _types(issues: list[dict[str, str]]) -> set[str]:
    return {issue["type"] for issue in issues}


def test_reference_family_file_without_readme_fails(tmp_path: Path) -> None:
    repo_root = tmp_path
    path = "docs/reference/new_family/CVF_NEW_FOUNDATION_RULE.md"
    full = repo_root / path
    full.parent.mkdir(parents=True)
    full.write_text("# Rule\n", encoding="utf-8")

    with patch.object(MODULE, "REPO_ROOT", repo_root):
        issues: list[dict[str, str]] = []
        MODULE._validate_reference_family_folder(path, {path: ["A"]}, issues)

    assert "foundation_folder_readme_missing" in _types(issues)


def test_reference_family_file_with_readme_passes(tmp_path: Path) -> None:
    repo_root = tmp_path
    path = "docs/reference/new_family/CVF_NEW_FOUNDATION_RULE.md"
    full = repo_root / path
    full.parent.mkdir(parents=True)
    full.write_text("# Rule\n", encoding="utf-8")
    (full.parent / "README.md").write_text("# Front Door\n", encoding="utf-8")

    with patch.object(MODULE, "REPO_ROOT", repo_root):
        issues: list[dict[str, str]] = []
        MODULE._validate_reference_family_folder(path, {path: ["A"]}, issues)

    assert not issues


def test_foundation_refactor_work_order_requires_storage_block() -> None:
    text = """
# Work Order

Scope: refactor docs/reference/ durable governance template addendum storage.
"""
    issues = MODULE._validate_work_order("docs/work_orders/CVF_TEST_FOR_CODEX.md", text)
    assert "foundation_storage_layout_block_missing" in _types(issues)


def test_cited_filename_markers_inside_inline_code_do_not_trigger() -> None:
    text = """
# Work Order

Scope: this work order touches `CVF_REFACTOR_TEMPLATE_ADDENDUM_STANDARD.md`
only as a filename citation; no foundation storage change is made here.
"""
    issues = MODULE._validate_work_order("docs/work_orders/CVF_TEST_FOR_CODEX.md", text)
    assert "foundation_storage_layout_block_missing" not in _types(issues)


def test_foundation_markers_inside_na_line_do_not_trigger() -> None:
    text = """
# Work Order

- Foundation Storage Layout Block: N/A with reason: no refactor, split, or relocate of any docs/reference/ template addendum standard in this tranche
"""
    issues = MODULE._validate_work_order("docs/work_orders/CVF_TEST_FOR_CODEX.md", text)
    assert "foundation_storage_layout_block_missing" not in _types(issues)


def test_foundation_refactor_work_order_with_storage_block_passes() -> None:
    text = """
# Work Order

Scope: refactor docs/reference/ durable governance template addendum storage.

## Foundation Storage Layout Block

| Field | Required content |
|---|---|
| Foundation files touched | `docs/reference/example/README.md` |
"""
    issues = MODULE._validate_work_order("docs/work_orders/CVF_TEST_FOR_CODEX.md", text)
    assert not issues
