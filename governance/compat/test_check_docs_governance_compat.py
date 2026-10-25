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


def test_exact_existing_public_compatibility_paths_are_preserved():
    for path in MODULE.PUBLIC_COMPATIBILITY_PATHS:
        assert MODULE._validate_docs_path(path) == []


def test_unrelated_public_looking_paths_remain_rejected():
    for path in ("docs/EXPORT_OTHER.md", "docs/benchmark/other/README.md", "docs/evidence/archive/OTHER.md"):
        assert MODULE._validate_docs_path(path)


def test_public_base_path_compatibility_does_not_authorize_new_taxonomy(tmp_path, monkeypatch):
    old = "docs/benchmark/existing-public.md"
    new = "docs/benchmark/new-unapproved.md"
    for path in (old, new):
        target = tmp_path / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("# Public content\n", encoding="utf-8")
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    assert MODULE._classify([], {old: ["M"]}, {old})["compliant"]
    assert not MODULE._classify([], {new: ["A"]}, {old})["compliant"]
    assert not MODULE._classify([], {old: ["M"]})["compliant"]


def test_public_canonical_path_still_checks_evidence_content(tmp_path, monkeypatch):
    path = "docs/baselines/CVF_W1_T1_CP1_FIRST_EVIDENCE_BATCH_2026-01-01.md"
    target = tmp_path / path
    target.parent.mkdir(parents=True)
    target.write_text("# Incomplete evidence\n", encoding="utf-8")
    monkeypatch.setattr(MODULE, "REPO_ROOT", tmp_path)
    assert not MODULE._classify([], {path: ["M"]}, {path})["compliant"]
