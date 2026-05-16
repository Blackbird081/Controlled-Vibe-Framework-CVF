#!/usr/bin/env python3
"""
CVF Markdown Structural Completeness Gate

Enforces GC-045 for new governed Markdown files. The guard focuses on new files
so CVF can improve document quality without forcing a disruptive retroactive
rewrite of historical dense docs.
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

STANDARD_PATH = "docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
README_PATH = "README.md"
KB_PATH = "docs/CVF_CORE_KNOWLEDGE_BASE.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_markdown_structural_completeness.py"

REQUIRED_FILES = (
    STANDARD_PATH,
    GUARD_PATH,
    THIS_SCRIPT_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    STANDARD_PATH: (
        "Common Required Elements",
        "Artifact Type Templates",
        "Contract",
        "Spec",
        "Policy",
        "Roadmap",
        "Review / Rebuttal / Response",
        "Baseline / Evidence / Authorization",
        "ADR",
        "Handoff",
        GUARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    GUARD_PATH: (
        "Control ID:",
        "GC-045",
        STANDARD_PATH,
        THIS_SCRIPT_PATH,
        "New governed Markdown files must follow",
    ),
}

COMMON_GROUPS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("title", (r"^#\s+\S+",)),
    ("memory class", (r"Memory class\s*:",)),
    ("status", (r"Status\s*:", r"Trạng thái\s*:", r"\*\*Status:\*\*")),
    ("purpose", (r"^##\s+Purpose\b", r"^##\s+Mục đích\b")),
    (
        "scope/target/owner boundary",
        (
            r"^##\s+Scope\b",
            r"^##\s+Applies To\b",
            r"\*\*Applies to:\*\*",
            r"^##\s+Target\b",
            r"^##\s+Source\b",
            r"^##\s+Owner\b",
            r"^##\s+Reviewed Source",
            r"^##\s+Authorization\b",
        ),
    ),
    (
        "claim/final/verification boundary",
        (
            r"^##\s+Claim Boundary\b",
            r"^##\s+Final Clause\b",
            r"^##\s+Invariant\b",
            r"^##\s+Verification\b",
            r"^##\s+Approval Gate\b",
            r"^##\s+Runtime Boundary\b",
        ),
    ),
)

SECTION_GROUPS: dict[str, tuple[tuple[str, tuple[str, ...]], ...]] = {
    "contract": (
        ("core principle", (r"^##\s+Core Principle\b",)),
        ("allowed/authorized actions", (r"^##\s+Allowed", r"^##\s+Authorized")),
        ("forbidden actions", (r"^##\s+Forbidden",)),
        ("requirement/rule", (r"^##\s+.*Requirement", r"^##\s+Rule\b")),
        ("exception path", (r"^##\s+Exception",)),
        ("violation conditions", (r"^##\s+Violation",)),
        ("audit/evidence requirements", (r"^##\s+Audit", r"^##\s+Evidence")),
        ("mapping/related/owner surface", (r"^##\s+.*Mapping", r"^##\s+Related", r"^##\s+Owner")),
    ),
    "spec": (
        ("owner/source", (r"^##\s+Owner", r"^##\s+Source")),
        ("protocol/contract/requirements", (r"^##\s+Protocol", r"^##\s+Contract", r"^##\s+Requirements")),
        ("enforcement/verification", (r"^##\s+Enforcement", r"^##\s+Verification")),
        ("boundaries/non-goals", (r"^##\s+.*Boundary", r"^##\s+Non-Goals")),
        ("related artifacts", (r"^##\s+Related",)),
    ),
    "policy": (
        ("rule", (r"^##\s+Rule\b",)),
        ("allowed/forbidden/requirements", (r"^##\s+Allowed", r"^##\s+Forbidden", r"^##\s+Requirements")),
        ("exceptions", (r"^##\s+Exceptions?",)),
        ("enforcement surface", (r"^##\s+Enforcement Surface\b",)),
        ("related artifacts", (r"^##\s+Related",)),
    ),
    "roadmap": (
        ("authorization/decision", (r"^##\s+Authorization", r"^##\s+Decision")),
        ("why/purpose", (r"^##\s+Why", r"^##\s+Purpose")),
        ("scope", (r"^##\s+Scope\b",)),
        ("non-goals", (r"^##\s+Non-Goals",)),
        ("work plan", (r"^##\s+Work Plan",)),
        ("acceptance criteria", (r"^##\s+Acceptance Criteria",)),
        ("verification/evidence", (r"^##\s+Verification", r"^##\s+Evidence")),
    ),
    "review": (
        ("target/source", (r"^##\s+Target", r"^##\s+Source", r"^##\s+Reviewed")),
        ("scope/methodology", (r"^##\s+Scope", r"^##\s+Methodology")),
        ("findings/position", (r"^##\s+Findings", r"^##\s+Position", r"^##\s+Bottom Line")),
        ("risk/corrective action", (r"^##\s+Risk", r"^##\s+Defect", r"^##\s+Required Corrective")),
        ("decision/recommendation/disposition", (r"^##\s+Decision", r"^##\s+Recommendation", r"^##\s+.*Disposition")),
    ),
    "baseline": (
        ("source/predecessor evidence", (r"^##\s+Source", r"^##\s+Predecessor Evidence")),
        ("decision/baseline/proposed tranche", (r"^##\s+Decision", r"^##\s+Baseline", r"^##\s+Proposed Tranche")),
        ("evidence/verification", (r"^##\s+Evidence", r"^##\s+Verification", r"^##\s+Required Evidence")),
    ),
    "adr": (
        ("context", (r"^##\s+Context\b",)),
        ("decision", (r"^##\s+Decision\b",)),
        ("alternatives", (r"^##\s+Alternatives\b",)),
        ("consequences", (r"^##\s+Consequences\b",)),
        ("gate/boundary", (r"^##\s+.*Gate", r"^##\s+Claim Boundary", r"^##\s+Verification")),
    ),
    "handoff": (
        ("active boundary", (r"^##\s+Active Boundary",)),
        ("latest work/changes", (r"^##\s+.*Completed", r"^##\s+.*Changes", r"^##\s+\d{4}-\d{2}-\d{2}")),
        ("next action/approval gate", (r"Next", r"Approval Gate", r"Implementation remains blocked")),
    ),
    "guard": (
        ("rule", (r"^##\s+Rule\b",)),
        ("enforcement surface", (r"^##\s+Enforcement Surface\b",)),
        ("related artifacts", (r"^##\s+Related Artifacts\b",)),
        ("final clause", (r"^##\s+Final Clause\b",)),
    ),
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


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        parts = raw_line.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if (status.startswith("R") or status.startswith("C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed(base: str, head: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    for path, statuses in _parse_name_status(out).items():
        changed.setdefault(path, set()).update(statuses)
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _is_governed_markdown(path: str) -> bool:
    if not path.endswith(".md"):
        return False
    return (
        path.startswith("docs/")
        or path.startswith("governance/toolkit/")
        or re.match(r"^AGENT_HANDOFF.*\.md$", path) is not None
        or re.match(r"^CVF_.+\.md$", path) is not None
    )


def _is_new(statuses: set[str]) -> bool:
    return any(status == "A" or status.startswith("R") or status.startswith("C") for status in statuses)


def _read_rel(path: str) -> str:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return ""
    return full.read_text(encoding="utf-8")


def _has_any(text: str, patterns: tuple[str, ...]) -> bool:
    return any(re.search(pattern, text, re.M | re.I) for pattern in patterns)


def _classify(path: str, text: str) -> str:
    name = Path(path).name.upper()
    title = "\n".join(text.splitlines()[:8]).upper()
    haystack = f"{path.upper()} {name} {title}"
    if "AGENT_HANDOFF" in haystack or "HANDOFF" in haystack:
        return "handoff"
    if path.startswith("governance/toolkit/") and name.endswith("_GUARD.MD"):
        return "guard"
    if "ADR" in haystack or "ARCHITECTURE DECISION" in haystack:
        return "adr"
    if "ROADMAP" in haystack:
        return "roadmap"
    if any(token in haystack for token in ("REVIEW", "REBUTTAL", "RESPONSE")):
        return "review"
    if any(token in haystack for token in ("AUTHORIZATION", "BASELINE", "EVIDENCE", "ASSESSMENT")):
        return "baseline"
    if "POLICY" in haystack or "STANDARD" in haystack:
        return "policy"
    if "CONTRACT" in haystack:
        return "contract"
    if "SPEC" in haystack:
        return "spec"
    return "spec"


def _validate_markdown(path: str) -> list[str]:
    text = _read_rel(path)
    artifact_type = _classify(path, text)
    issues: list[str] = []

    for label, patterns in COMMON_GROUPS:
        if not _has_any(text, patterns):
            issues.append(f"missing common element: {label}")

    for label, patterns in SECTION_GROUPS.get(artifact_type, ()):
        if not _has_any(text, patterns):
            issues.append(f"missing {artifact_type} section: {label}")

    return issues


def _check_required_markers() -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    for path in REQUIRED_FILES:
        text = _read_rel(path)
        if not text:
            violations.append({"path": path, "issues": ["required file missing"]})
            continue
        missing = [marker for marker in REQUIRED_MARKERS.get(path, ()) if marker not in text]
        if missing:
            violations.append({"path": path, "issues": [f"missing marker `{marker}`" for marker in missing]})
    return violations


def _run_check(base: str | None, head: str | None, all_changed: bool, no_bootstrap: bool = False) -> dict[str, Any]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    changed = _get_changed(resolved_base, resolved_head)
    targets = [
        path for path, statuses in sorted(changed.items())
        if _is_governed_markdown(path) and (all_changed or _is_new(statuses))
    ]

    violations = [] if no_bootstrap else _check_required_markers()
    for path in targets:
        issues = _validate_markdown(path)
        if issues:
            violations.append({"path": path, "issues": issues})

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "base": resolved_base,
        "head": resolved_head,
        "baseSource": base_source,
        "policy": GUARD_PATH,
        "standard": STANDARD_PATH,
        "checkedFiles": targets,
        "checkedFileCount": len(targets),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Markdown Structural Completeness Gate ===")
    print(f"Range: {report['base']}..{report['head']}")
    print(f"Base source: {report['baseSource']}")
    print(f"Standard: {report['standard']}")
    print(f"Files checked: {report['checkedFileCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["checkedFiles"]:
        print("\nChecked files:")
        for path in report["checkedFiles"]:
            print(f"  - {path}")
    else:
        print("\nNo new governed Markdown files required GC-045 structural validation.")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']}")
            for issue in violation["issues"]:
                print(f"    - {issue}")

    if report["compliant"]:
        print("\nCOMPLIANT - governed Markdown structure is complete for checked files.")
    else:
        print("\nVIOLATION - add the missing structural sections before committing.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Enforce CVF GC-045 Markdown structural completeness")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--all-changed", action="store_true", help="Check all changed governed markdown, not only new files")
    parser.add_argument("--no-bootstrap", action="store_true", help="Skip self-bootstrap REQUIRED_FILES check (use in portable workspaces such as public-sync)")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    report = _run_check(args.base, args.head, args.all_changed, args.no_bootstrap)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
