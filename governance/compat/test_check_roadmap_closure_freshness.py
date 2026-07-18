from __future__ import annotations

import importlib.util
import textwrap
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_roadmap_closure_freshness.py")
SPEC = importlib.util.spec_from_file_location("check_roadmap_closure_freshness", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_matching_self_referenced_roadmap_status_passes() -> None:
    text = textwrap.dedent(
        """\
        # Example Roadmap

        Status: ROADMAP_CLOSED_PASS_BOUNDED

        ## Machine Closure Package

        | Closure item | Required artifact/path | Machine-readable evidence | Final status |
        |---|---|---|---|
        | Roadmap state | this file | `Status: ROADMAP_CLOSED_PASS_BOUNDED` | PASS |
        """
    )
    assert MODULE.validate_roadmap_closure_freshness(
        "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-18.md",
        text,
    ) == []


def test_mismatched_self_referenced_roadmap_status_fails() -> None:
    text = textwrap.dedent(
        """\
        # Example Roadmap

        Status: ROADMAP_CLOSED_PASS_BOUNDED

        ## Machine Closure Package

        | Closure item | Required artifact/path | Machine-readable evidence | Final status |
        |---|---|---|---|
        | Roadmap state | this file | `Status: ROADMAP_READY_FOR_GC018` | PASS |
        """
    )
    issues = MODULE.validate_roadmap_closure_freshness(
        "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-18.md",
        text,
    )
    assert issues == [
        "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-18.md: Machine Closure Package Roadmap state cites `Status: ROADMAP_READY_FOR_GC018` but top-of-file Status is `ROADMAP_CLOSED_PASS_BOUNDED`"
    ]


def test_non_self_referenced_roadmap_row_is_ignored() -> None:
    text = textwrap.dedent(
        """\
        # Example Roadmap

        Status: ROADMAP_CLOSED_PASS_BOUNDED

        ## Machine Closure Package

        | Closure item | Required artifact/path | Machine-readable evidence | Final status |
        |---|---|---|---|
        | Roadmap state | `docs/roadmaps/CVF_OTHER_ROADMAP.md` | `Status: ROADMAP_READY_FOR_GC018` | PASS |
        """
    )
    assert MODULE.validate_roadmap_closure_freshness(
        "docs/roadmaps/CVF_EXAMPLE_ROADMAP_2026-06-18.md",
        text,
    ) == []


def test_archive_roadmap_is_ignored() -> None:
    text = "Status: ROADMAP_CLOSED_PASS_BOUNDED\n"
    assert MODULE.validate_roadmap_closure_freshness(
        "docs/roadmaps/archive/CVF_EXAMPLE_ROADMAP_2026-06-18.md",
        text,
    ) == []
