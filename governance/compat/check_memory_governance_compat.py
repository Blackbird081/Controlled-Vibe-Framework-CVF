#!/usr/bin/env python3
"""
CVF Memory Governance Compatibility Gate

Ensures that the durable-memory storage chain stays aligned:
- memory governance guard exists
- memory classification reference exists
- document-storage guard references the memory classification model
- master policy and governance control matrix register the rule
- hook chain runs this gate
- changed memory-bearing docs carry the correct memory class marker
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

MEMORY_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md"
MEMORY_CLASSIFICATION_PATH = "docs/reference/CVF_MEMORY_RECORD_CLASSIFICATION.md"
DOC_STORAGE_GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
REFERENCE_README_PATH = "docs/reference/README.md"
CONTEXT_MODEL_PATH = "docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md"
TEST_LOG_PATH = "docs/CVF_INCREMENTAL_TEST_LOG.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
THIS_SCRIPT_PATH = "governance/compat/check_memory_governance_compat.py"

REQUIRED_FILES = (
    MEMORY_GUARD_PATH,
    MEMORY_CLASSIFICATION_PATH,
    DOC_STORAGE_GUARD_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    DOCS_INDEX_PATH,
    REFERENCE_README_PATH,
    CONTEXT_MODEL_PATH,
    HOOK_CHAIN_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    MEMORY_GUARD_PATH: (
        "FULL_RECORD",
        "SUMMARY_RECORD",
        "POINTER_RECORD",
        "DEFAULT TAXONOMY MAPPING",
        MEMORY_CLASSIFICATION_PATH,
        "Lane selection does not decide memory class by itself.",
    ),
    MEMORY_CLASSIFICATION_PATH: (
        "Memory class: POINTER_RECORD",
        "FULL_RECORD",
        "SUMMARY_RECORD",
        "POINTER_RECORD",
        "Relationship To Context Continuity",
        "Relationship To GC-021 Fast Lane",
        "does not automatically mean `SUMMARY_RECORD`",
    ),
    DOC_STORAGE_GUARD_PATH: (
        "memory classification",
        "CVF_MEMORY_GOVERNANCE_GUARD.md",
        MEMORY_CLASSIFICATION_PATH,
    ),
    MASTER_POLICY_PATH: (
        "Memory governance is mandatory for evidence-bearing records intended to support later CVF memory",
        "Memory class follows artifact role, not whether the change used `Fast Lane` or `Full Lane`.",
        MEMORY_GUARD_PATH,
        MEMORY_CLASSIFICATION_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-022",
        MEMORY_GUARD_PATH,
        MEMORY_CLASSIFICATION_PATH,
        THIS_SCRIPT_PATH,
    ),
    DOCS_INDEX_PATH: (
        "Memory class: POINTER_RECORD",
        "Default memory role",
        "reference/CVF_MEMORY_RECORD_CLASSIFICATION.md",
        "../governance/toolkit/05_OPERATION/CVF_MEMORY_GOVERNANCE_GUARD.md",
    ),
    REFERENCE_README_PATH: (
        "Memory class: POINTER_RECORD",
        "CVF_MEMORY_RECORD_CLASSIFICATION.md",
    ),
    CONTEXT_MODEL_PATH: (
        "Memory class: POINTER_RECORD",
        "Relationship To GC-022",
        MEMORY_GUARD_PATH,
        MEMORY_CLASSIFICATION_PATH,
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
}

MEMORY_CLASS_PATTERN = re.compile(
    r"^Memory class:\s*(FULL_RECORD|SUMMARY_RECORD|POINTER_RECORD)\s*$",
    re.MULTILINE,
)

EXPECTED_BY_PREFIX: tuple[tuple[str, str], ...] = (
    ("docs/assessments/", "FULL_RECORD"),
    ("docs/audits/", "FULL_RECORD"),
    ("docs/reviews/", "FULL_RECORD"),
    ("docs/baselines/", "SUMMARY_RECORD"),
    ("docs/roadmaps/", "SUMMARY_RECORD"),
    ("docs/logs/", "SUMMARY_RECORD"),
    ("docs/reference/", "POINTER_RECORD"),
)

EXPECTED_BY_PATH: dict[str, str] = {
    DOCS_INDEX_PATH: "POINTER_RECORD",
    REFERENCE_README_PATH: "POINTER_RECORD",
    MEMORY_CLASSIFICATION_PATH: "POINTER_RECORD",
    TEST_LOG_PATH: "SUMMARY_RECORD",
}


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"

    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"

    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _get_changed_files(base: str, head: str) -> list[str]:
    code, out, err = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return [line.replace("\\", "/").strip() for line in out.splitlines() if line.strip()]


def _get_worktree_changed_files() -> list[str]:
    files: set[str] = set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for line in out.splitlines():
                normalized = line.replace("\\", "/").strip()
                if normalized:
                    files.add(normalized)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for line in out.splitlines():
            normalized = line.replace("\\", "/").strip()
            if normalized:
                files.add(normalized)
    return sorted(files)


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _expected_memory_class(path: str) -> str | None:
    if path in EXPECTED_BY_PATH:
        return EXPECTED_BY_PATH[path]
    for prefix, expected in EXPECTED_BY_PREFIX:
        if path.startswith(prefix):
            return expected
    return None


def _memory_marker_violations(changed_files: list[str]) -> dict[str, str]:
    violations: dict[str, str] = {}
    for path in changed_files:
        if not path.endswith(".md"):
            continue
        expected = _expected_memory_class(path)
        if expected is None:
            continue
        abs_path = REPO_ROOT / path
        if not abs_path.exists() or abs_path.is_dir():
            continue
        text = _read_text(path)
        if not text:
            violations[path] = "missing file contents"
            continue
        match = MEMORY_CLASS_PATTERN.search(text)
        if not match:
            violations[path] = f"missing memory class marker; expected {expected}"
            continue
        actual = match.group(1)
        if actual != expected:
            violations[path] = f"expected {expected} but found {actual}"
    return violations


def _classify(changed_files: list[str]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    memory_class_violations = _memory_marker_violations(changed_files)

    relevant_changed_files = [
        path
        for path in changed_files
        if path in REQUIRED_FILES
        or path == THIS_SCRIPT_PATH
        or _expected_memory_class(path) is not None
    ]

    compliant = not missing_files and not marker_violations and not memory_class_violations

    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "memoryClassViolations": memory_class_violations,
        "memoryClassViolationCount": len(memory_class_violations),
        "relevantChangedFiles": relevant_changed_files,
        "relevantChangedFileCount": len(relevant_changed_files),
        "compliant": compliant,
        "changedFiles": changed_files,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Memory Governance Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Relevant GC-022 files changed: {report['relevantChangedFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Memory class violations: {report['memoryClassViolationCount']}")

    if report["relevantChangedFiles"]:
        print("\nRelevant GC-022 files changed:")
        for path in report["relevantChangedFiles"]:
            print(f"  - {path}")

    if report["missingFiles"]:
        print("\nMissing required files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")

    if report["markerViolations"]:
        print("\nMarker violations:")
        for path, markers in report["markerViolations"].items():
            print(f"  - {path}")
            for marker in markers:
                print(f"    missing: {marker}")

    if report["memoryClassViolations"]:
        print("\nMemory class violations:")
        for path, issue in report["memoryClassViolations"].items():
            print(f"  - {path}: {issue}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — GC-022 memory governance, storage taxonomy linkage, and memory-class markers are aligned.")
        return

    print("\n❌ VIOLATION — GC-022 memory governance chain is incomplete or misaligned.")
    print("   Action required:")
    print(f"   1. Ensure {MEMORY_GUARD_PATH} and {MEMORY_CLASSIFICATION_PATH} exist and define the canonical classes.")
    print(f"   2. Ensure {DOC_STORAGE_GUARD_PATH}, {MASTER_POLICY_PATH}, {CONTROL_MATRIX_PATH}, and")
    print(f"      {DOCS_INDEX_PATH} reference the same memory-governance truth.")
    print(f"   3. Ensure changed memory-bearing docs carry the correct `Memory class:` marker.")
    print(f"   4. Ensure {HOOK_CHAIN_PATH} runs {THIS_SCRIPT_PATH}.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF memory governance compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when the GC-022 chain is incomplete or misaligned")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        changed_files = _get_changed_files(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                changed_files = _get_changed_files(fallback_base, head)
                print(
                    f"Warning: primary range failed ({exc}); fallback to {fallback_base}..{head}",
                    file=sys.stderr,
                )
                base = fallback_base
                base_source = "fallback-after-error:HEAD~1"
            except RuntimeError as fallback_exc:
                print(str(fallback_exc), file=sys.stderr)
                return 1
        else:
            print(str(exc), file=sys.stderr)
            return 1

    worktree_files = _get_worktree_changed_files()
    if worktree_files:
        # GC-022 is intentionally incremental. When there is an active local batch,
        # enforce memory-class markers on that batch only rather than on the entire
        # historical branch diff.
        changed_files = worktree_files

    classified = _classify(changed_files)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": MEMORY_GUARD_PATH,
        **classified,
    }

    if args.write_report:
        out_path = Path(args.write_report)
        if not out_path.is_absolute():
            out_path = (REPO_ROOT / out_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
