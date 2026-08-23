from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_docs_governance_compat.py")
SPEC = importlib.util.spec_from_file_location("check_docs_governance_compat", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_exact_t2b_archive_paths_are_approved_naming_exceptions() -> None:
    for path in (
        "docs/reference/archive/AGENTS_FULL_PRE_T2B_2026-08-11.md",
        "docs/reference/archive/CLAUDE_FULL_PRE_T2B_2026-08-11.md",
    ):
        assert MODULE._validate_docs_path(path) == []


def test_similar_archive_name_still_requires_cvf_prefix() -> None:
    issues = MODULE._validate_docs_path(
        "docs/reference/archive/AGENTS_OTHER_ARCHIVE_2026-08-11.md"
    )
    assert any(issue["type"] == "governance_naming" for issue in issues)
