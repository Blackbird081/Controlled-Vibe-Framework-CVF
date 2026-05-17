#!/usr/bin/env python3
"""
CVF Knowledge Absorption Priority Compatibility Gate

Ensures the GC-043 doctrine-first / governance-first knowledge-absorption
chain stays aligned:
- standard, executive note, and guard exist
- policy, matrix, bootstrap, README, KB, and handoff reference the rule
- hook chain and CI enforce the rule
- changed knowledge-absorption roadmaps carry the standard reference and
  implementation-blocking boundary markers
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md"
EXEC_NOTE_PATH = "docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
REFERENCE_README_PATH = "docs/reference/README.md"
ROOT_README_PATH = "README.md"
KB_PATH = "docs/CVF_CORE_KNOWLEDGE_BASE.md"
HANDOFF_PATH = "AGENT_HANDOFF.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
GRAPHIFY_ROADMAP_PATH = "docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md"
THIS_SCRIPT_PATH = "governance/compat/check_knowledge_absorption_priority_compat.py"

REQUIRED_FILES = (
    STANDARD_PATH,
    EXEC_NOTE_PATH,
    GUARD_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    DOCS_INDEX_PATH,
    REFERENCE_README_PATH,
    ROOT_README_PATH,
    KB_PATH,
    HANDOFF_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
    GRAPHIFY_ROADMAP_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    STANDARD_PATH: (
        "doctrine-first / governance-first absorption",
        "implementation-first expansion",
        "Graphify / LLM-Powered / Palace",
        GRAPHIFY_ROADMAP_PATH,
    ),
    EXEC_NOTE_PATH: (
        "highest-value next step",
        "doctrine-first / governance-first uplift",
        STANDARD_PATH,
    ),
    GUARD_PATH: (
        "Control ID:",
        "GC-043",
        STANDARD_PATH,
        EXEC_NOTE_PATH,
        GRAPHIFY_ROADMAP_PATH,
        THIS_SCRIPT_PATH,
        "owner-surface mapping",
        "implementation-first expansion",
    ),
    MASTER_POLICY_PATH: (
        "GC-043",
        "future knowledge absorption",
        STANDARD_PATH,
        GUARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-043",
        GUARD_PATH,
        STANDARD_PATH,
        EXEC_NOTE_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-043",
        STANDARD_PATH,
        "repo-derived skill intake",
        "post-closure synthesis-first uplift planning",
    ),
    DOCS_INDEX_PATH: (
        "reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md",
    ),
    REFERENCE_README_PATH: (
        Path(STANDARD_PATH).name,
    ),
    ROOT_README_PATH: (
        Path(GUARD_PATH).name,
    ),
    KB_PATH: (
        Path(GUARD_PATH).name,
        "Doctrine-first / governance-first absorption",
    ),
    HANDOFF_PATH: (
        STANDARD_PATH,
        Path(GUARD_PATH).name,
        THIS_SCRIPT_PATH,
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "knowledge-absorption-priority-guard",
        "Knowledge Absorption Priority Guard",
    ),
    GRAPHIFY_ROADMAP_PATH: (
        STANDARD_PATH,
        "SYNTHESIS-ONLY",
        "no code changes",
        "DOCTRINE / SYNTHESIS LANE",
        "doctrine-first / governance-first absorption",
    ),
}

KNOWLEDGE_ROADMAP_RE = re.compile(
    r"^docs/roadmaps/CVF_.+(ADDING_NEW|WINDOWS_SKILL_NORMALIZATION|GRAPHIFY|LLM_POWERED|PALACE|KNOWLEDGE|SYNTHESIS).+\.md$"
)
KNOWLEDGE_CONTENT_HINTS = (
    "Knowledge Base_",
    "skill normalization",
    "knowledge absorption",
    "knowledge native adoption",
    "repo-derived",
    "Graphify",
    "LLM-Powered",
    "Palace",
    "SYNTHESIS-ONLY",
)
ROADMAP_REQUIRED_ANY_DOCTRINE_MARKERS = (
    STANDARD_PATH,
    "doctrine-first",
    "governance-first absorption",
    "implementation-first expansion",
)
ROADMAP_REQUIRED_ANY_BOUNDARY_MARKERS = (
    "owner-surface",
    "No-New-Surface Rule",
    "SYNTHESIS-ONLY",
    "NO IMPLEMENTATION",
    "no code changes",
    "implementation remains blocked",
    "no runtime changes",
)


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


def _is_knowledge_roadmap(path: str, text: str) -> bool:
    if not KNOWLEDGE_ROADMAP_RE.match(path):
        return False
    return any(marker in text for marker in KNOWLEDGE_CONTENT_HINTS)


def _classify(changed_files: list[str]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    roadmap_violations: dict[str, list[str]] = {}
    relevant_changed_knowledge_roadmaps: list[str] = []
    for path in changed_files:
        if not path.startswith("docs/roadmaps/"):
            continue
        text = _read_text(path)
        if not _is_knowledge_roadmap(path, text):
            continue
        relevant_changed_knowledge_roadmaps.append(path)
        missing_markers: list[str] = []
        if not any(marker in text for marker in ROADMAP_REQUIRED_ANY_DOCTRINE_MARKERS):
            missing_markers.append("doctrine/governance-first standard reference")
        if not any(marker in text for marker in ROADMAP_REQUIRED_ANY_BOUNDARY_MARKERS):
            missing_markers.append("implementation-blocking boundary marker")
        if missing_markers:
            roadmap_violations[path] = missing_markers

    compliant = not missing_files and not marker_violations and not roadmap_violations
    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "knowledgeRoadmapViolations": roadmap_violations,
        "knowledgeRoadmapViolationCount": len(roadmap_violations),
        "relevantChangedKnowledgeRoadmaps": relevant_changed_knowledge_roadmaps,
        "relevantChangedKnowledgeRoadmapCount": len(relevant_changed_knowledge_roadmaps),
        "compliant": compliant,
        "changedFiles": changed_files,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Knowledge Absorption Priority Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Relevant changed knowledge roadmaps: {report['relevantChangedKnowledgeRoadmapCount']}")
    print(f"Knowledge-roadmap violations: {report['knowledgeRoadmapViolationCount']}")

    if report["missingFiles"]:
        print("\nMissing required files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")

    if report["markerViolations"]:
        print("\nMarker violations:")
        for path, markers in sorted(report["markerViolations"].items()):
            print(f"  - {path}")
            for marker in markers:
                print(f"      * {marker}")

    if report["knowledgeRoadmapViolations"]:
        print("\nKnowledge-roadmap violations:")
        for path, markers in sorted(report["knowledgeRoadmapViolations"].items()):
            print(f"  - {path}")
            for marker in markers:
                print(f"      * missing {marker}")

    if report["compliant"]:
        print("\nCOMPLIANT — GC-043 knowledge absorption priority chain is aligned.")
    else:
        print("\nVIOLATION — GC-043 knowledge absorption priority chain drift detected.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the CVF knowledge absorption priority guard chain.")
    parser.add_argument("--base", help="Base git ref/sha for changed-file detection.")
    parser.add_argument("--head", help="Head git ref/sha for changed-file detection.")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violations.")
    args = parser.parse_args()

    resolved_base, resolved_head, base_source = _resolve_range(args.base, args.head)
    changed_files = sorted(set(_get_changed_files(resolved_base, resolved_head) + _get_worktree_changed_files()))
    report = _classify(changed_files)
    payload = {
        "timestamp": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "range": f"{resolved_base}..{resolved_head}",
        "baseSource": base_source,
        **report,
    }
    print(json.dumps(payload, indent=2))

    if report["compliant"]:
        return 0
    _print_report(report, resolved_base, resolved_head, base_source)
    if args.enforce:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
