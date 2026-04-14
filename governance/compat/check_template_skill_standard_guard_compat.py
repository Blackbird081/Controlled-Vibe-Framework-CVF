#!/usr/bin/env python3
"""
CVF Template Skill Standard Guard Compatibility Gate

Ensures the GC-044 template/skill quality chain stays aligned:
- guard, standards, and prerequisite roadmaps exist
- policy, matrix, bootstrap, README surfaces, KB, and handoff reference the rule
- local hook chain and CI enforce the rule
- future skill/template additions cannot land silently without governed companion docs
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

GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md"
STANDARD_PATH = "docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md"
MEASUREMENT_PATH = "docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md"
ROADMAP_PATH = "docs/roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md"
VALUE_ROADMAP_PATH = "docs/roadmaps/CVF_NON_CODER_VALUE_REALIZATION_ROADMAP_2026-04-14.md"
PROPOSAL_PATH = "docs/reference/CVF_NON_CODER_VALUE_GUARD_PROPOSAL_2026-04-14.md"
OLD_INTAKE_PATH = "governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md"
OLD_GOVERNANCE_PATH = "governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md"
W7_INTAKE_PATH = "docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md"
W7_COMPILER_PATH = "docs/reference/CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md"
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
THIS_SCRIPT_PATH = "governance/compat/check_template_skill_standard_guard_compat.py"

REQUIRED_FILES = (
    GUARD_PATH,
    STANDARD_PATH,
    MEASUREMENT_PATH,
    ROADMAP_PATH,
    VALUE_ROADMAP_PATH,
    PROPOSAL_PATH,
    OLD_INTAKE_PATH,
    OLD_GOVERNANCE_PATH,
    W7_INTAKE_PATH,
    W7_COMPILER_PATH,
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
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    GUARD_PATH: (
        "Control ID:",
        "GC-044",
        STANDARD_PATH,
        MEASUREMENT_PATH,
        ROADMAP_PATH,
        OLD_INTAKE_PATH,
        OLD_GOVERNANCE_PATH,
        W7_INTAKE_PATH,
        W7_COMPILER_PATH,
        THIS_SCRIPT_PATH,
        "TRUSTED_FOR_VALUE_PROOF",
        "Provider freeze remains roadmap/execution policy",
    ),
    STANDARD_PATH: (
        "CANONICAL RESCREEN STANDARD",
        "GC-044",
        "TRUSTED_FOR_VALUE_PROOF",
        OLD_INTAKE_PATH,
        OLD_GOVERNANCE_PATH,
        W7_INTAKE_PATH,
        W7_COMPILER_PATH,
    ),
    MEASUREMENT_PATH: (
        "GC-044",
        STANDARD_PATH,
        "Alibaba only",
        "TRUSTED_FOR_VALUE_PROOF",
    ),
    ROADMAP_PATH: (
        STANDARD_PATH,
        "quality must come before quantity",
        "TRUSTED_FOR_VALUE_PROOF",
        "trusted benchmark subset",
        "GC-044",
    ),
    VALUE_ROADMAP_PATH: (
        MEASUREMENT_PATH,
        ROADMAP_PATH,
        "TRUSTED_FOR_VALUE_PROOF",
        "GC-044",
    ),
    PROPOSAL_PATH: (
        "SUPERSEDED IN PART",
        "GC-044",
        GUARD_PATH,
    ),
    MASTER_POLICY_PATH: (
        "GC-044",
        GUARD_PATH,
        STANDARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "GC-044",
        GUARD_PATH,
        STANDARD_PATH,
        MEASUREMENT_PATH,
        ROADMAP_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-044",
        STANDARD_PATH,
        "TRUSTED_FOR_VALUE_PROOF",
    ),
    DOCS_INDEX_PATH: (
        "reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md",
        "reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md",
        "../governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md",
        "roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md",
    ),
    REFERENCE_README_PATH: (
        Path(STANDARD_PATH).name,
        Path(MEASUREMENT_PATH).name,
    ),
    ROOT_README_PATH: (
        Path(GUARD_PATH).name,
    ),
    KB_PATH: (
        Path(GUARD_PATH).name,
        "TRUSTED_FOR_VALUE_PROOF",
    ),
    HANDOFF_PATH: (
        GUARD_PATH,
        STANDARD_PATH,
        MEASUREMENT_PATH,
        THIS_SCRIPT_PATH,
        "TRUSTED_FOR_VALUE_PROOF",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "Template Skill Standard Guard",
        "template-skill-standard-guard",
    ),
}

SKILL_SURFACE_RE = re.compile(
    r"^EXTENSIONS/CVF_v1\.5\.2_SKILL_LIBRARY_FOR_END_USERS/.+\.skill\.md$"
)
TEMPLATE_SURFACE_RE = re.compile(
    r"^EXTENSIONS/CVF_v1\.6_AGENT_PLATFORM/cvf-web/src/(lib/templates/.+\.ts|components/.+Wizard\.tsx)$"
)
COMPANION_DOC_RE = re.compile(
    r"^docs/(roadmaps|assessments|reviews|baselines|reference)/CVF_.+(SKILL|TEMPLATE|CORPUS|INTAKE|RESCREEN|NON_CODER_VALUE).+\.md$"
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


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff --name-status failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (
        ["diff", "--name-status"],
        ["diff", "--cached", "--name-status"],
        ["ls-files", "--others", "--exclude-standard"],
    ):
        code, out, _ = _run_git(args)
        if code != 0 or not out:
            continue
        if args[0] == "ls-files":
            for line in out.splitlines():
                normalized = line.replace("\\", "/").strip()
                if normalized:
                    changed.setdefault(normalized, set()).add("A")
        else:
            partial = _parse_name_status_output(out)
            for path, statuses in partial.items():
                changed.setdefault(path, set()).update(statuses)
    return changed


def _has_add_or_rename(statuses: set[str]) -> bool:
    return any(
        status == "A" or status.startswith("R") or status.startswith("C")
        for status in statuses
    )


def _classify(changed_name_status: dict[str, set[str]]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    added_surfaces: list[str] = []
    for path, statuses in changed_name_status.items():
        if not _has_add_or_rename(statuses):
            continue
        if SKILL_SURFACE_RE.match(path) or TEMPLATE_SURFACE_RE.match(path):
            added_surfaces.append(path)

    companion_docs = [
        path
        for path in changed_name_status
        if path in {STANDARD_PATH, ROADMAP_PATH, VALUE_ROADMAP_PATH, MEASUREMENT_PATH, HANDOFF_PATH}
        or COMPANION_DOC_RE.match(path)
    ]

    silent_intake_violations: list[str] = []
    if added_surfaces and not companion_docs:
        silent_intake_violations = added_surfaces

    return {
        "missingFiles": missing_files,
        "markerViolations": marker_violations,
        "addedSurfaces": added_surfaces,
        "companionDocs": companion_docs,
        "silentIntakeViolations": silent_intake_violations,
    }


def _build_report(base: str | None, head: str | None) -> dict[str, Any]:
    resolved_base, resolved_head, source = _resolve_range(base, head)
    changed_name_status = _get_changed_name_status(resolved_base, resolved_head)
    result = _classify(changed_name_status)
    result.update(
        {
            "mode": "range",
            "base": resolved_base,
            "head": resolved_head,
            "rangeSource": source,
            "changedFiles": sorted(changed_name_status.keys()),
            "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
    )
    return result


def _build_worktree_report() -> dict[str, Any]:
    changed_name_status = _get_worktree_name_status()
    result = _classify(changed_name_status)
    result.update(
        {
            "mode": "worktree",
            "changedFiles": sorted(changed_name_status.keys()),
            "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
    )
    return result


def _print_report(report: dict[str, Any]) -> None:
    print(json.dumps(report, indent=2))
    if report["missingFiles"] or report["markerViolations"] or report["silentIntakeViolations"]:
        print("\nVIOLATION — GC-044 template/skill standard chain drift detected.")
        if report["missingFiles"]:
            print("\nMissing required files:")
            for path in report["missingFiles"]:
                print(f"  - {path}")
        if report["markerViolations"]:
            print("\nMarker violations:")
            for path, markers in report["markerViolations"].items():
                print(f"  - {path}")
                for marker in markers:
                    print(f"      missing: {marker}")
        if report["silentIntakeViolations"]:
            print("\nSilent intake violations (added surface with no governed companion docs):")
            for path in report["silentIntakeViolations"]:
                print(f"  - {path}")
    else:
        print("\nCOMPLIANT — GC-044 template/skill standard chain is aligned.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the CVF template/skill standard guard chain")
    parser.add_argument("--base", help="Base git ref/sha for diff range")
    parser.add_argument("--head", help="Head git ref/sha for diff range")
    parser.add_argument("--worktree", action="store_true", help="Check current worktree instead of a git range")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations are found")
    args = parser.parse_args()

    report = _build_worktree_report() if args.worktree else _build_report(args.base, args.head)
    _print_report(report)

    has_issues = bool(
        report["missingFiles"] or report["markerViolations"] or report["silentIntakeViolations"]
    )
    if has_issues and args.enforce:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
