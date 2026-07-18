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

try:
    from guard_binding_catalog import effective_binding_text
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import effective_binding_text


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md"
LIFECYCLE_STANDARD_PATH = "docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md"
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
OPERATOR_CHECKPOINT_GRANDFATHER_REF = "c043fa33"

REQUIRED_FILES = (
    STANDARD_PATH,
    LIFECYCLE_STANDARD_PATH,
    GUARD_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    DOCS_INDEX_PATH,
    README_PATH,
    KB_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    STANDARD_PATH: (
        "Common Required Elements",
        "Artifact Type Templates",
        "Contract",
        "Spec",
        "Policy",
        "SOP",
        "Roadmap",
        "Work Order",
        "Design Control Gate",
        LIFECYCLE_STANDARD_PATH,
        "Review / Rebuttal / Response",
        "Baseline / Evidence / Authorization",
        "ADR",
        "Handoff",
        GUARD_PATH,
        THIS_SCRIPT_PATH,
    ),
    LIFECYCLE_STANDARD_PATH: (
        "INTAKE",
        "DESIGN",
        "SPEC",
        "WORK ORDER",
        "BUILD",
        "REVIEW",
        "FREEZE",
        "Design Control Gate",
        "Dispatch Boundary",
        THIS_SCRIPT_PATH,
    ),
    GUARD_PATH: (
        "Control ID:",
        "GC-045",
        STANDARD_PATH,
        THIS_SCRIPT_PATH,
        "New governed Markdown files must follow",
    ),
    MASTER_POLICY_PATH: ("GC-045", STANDARD_PATH, GUARD_PATH, THIS_SCRIPT_PATH),
    CONTROL_MATRIX_PATH: ("GC-045", STANDARD_PATH, GUARD_PATH, THIS_SCRIPT_PATH),
    BOOTSTRAP_PATH: ("GC-045", STANDARD_PATH, "Markdown Structural Completeness"),
    DOCS_INDEX_PATH: ("reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md",),
    README_PATH: ("GC-045", Path(GUARD_PATH).name),
    KB_PATH: (Path(GUARD_PATH).name, "Markdown structural completeness"),
    HOOK_CHAIN_PATH: (THIS_SCRIPT_PATH,),
    WORKFLOW_PATH: (THIS_SCRIPT_PATH, "Markdown Structural Completeness"),
}

# Sealed archive files are exempt from structural completeness checks.
# They are read-only historical records that cannot be modified to add structural sections.
# Legacy corpus files pre-dating GC-045 are also exempt; they predate the standard.
STRUCTURAL_CHECK_EXEMPT = {
    "docs/CVF_ARCHITECTURE_DECISIONS_ARCHIVE_ADR001-010.md",
    "docs/CVF_ARCHITECTURE_DECISIONS.md",
    "docs/CVF_CORE_KNOWLEDGE_BASE.md",
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
    "sop": (
        ("scope", (r"^##\s+Scope\b",)),
        ("owner/source", (r"^##\s+Owner", r"^##\s+Source")),
        ("protocol/contract/requirements", (r"^##\s+Protocol", r"^##\s+Contract", r"^##\s+Requirements")),
        ("inputs and outputs", (r"^##\s+Inputs", r"^##\s+.*Outputs")),
        ("role workflow", (r"^##\s+Role Workflow\b", r"^##\s+Roles\b")),
        ("standard workflow", (r"^##\s+Standard Workflow\b", r"^##\s+Workflow\b")),
        ("enforcement/verification", (r"^##\s+Enforcement", r"^##\s+Verification")),
        ("boundaries/non-goals", (r"^##\s+.*Boundary", r"^##\s+Non-Goals", r"^##\s+Boundaries")),
        ("failure modes", (r"^##\s+Failure", r"^##\s+Escalation")),
        ("related artifacts", (r"^##\s+Related",)),
    ),
    "roadmap": (
        ("authorization/decision", (r"^##\s+Authorization", r"^##\s+Decision")),
        ("why/purpose", (r"^##\s+Why", r"^##\s+Purpose")),
        ("scope", (r"^##\s+Scope\b",)),
        ("non-goals", (r"^##\s+Non-Goals",)),
        (
            "design control gate",
            (
                r"^##\s+Design Control Gate\b",
                r"^##\s+Dispatch Boundary\b",
                r"^##\s+Governed Work Lifecycle\b",
            ),
        ),
        ("work plan", (r"^##\s+Work Plan",)),
        ("acceptance criteria", (r"^##\s+Acceptance Criteria",)),
        ("verification/evidence", (r"^##\s+Verification", r"^##\s+Evidence")),
    ),
    "work_order": (
        ("authority chain", (r"^##\s+(?:\d+\.\s+)?Authority Chain\b",)),
        ("agent roles", (r"^##\s+(?:\d+\.\s+)?Agent Roles\b", r"^##\s+(?:\d+\.\s+)?.*Roles\b")),
        ("allowed/forbidden scope", (r"Allowed scope", r"Forbidden scope", r"^##\s+Scope\b")),
        ("required first reads", (r"^##\s+(?:\d+\.\s+)?Required First Reads\b",)),
        ("pre-flight checks", (r"^##\s+(?:\d+\.\s+)?.*Pre-Flight", r"^##\s+(?:\d+\.\s+)?Preflight")),
        ("write ownership", (r"^##\s+(?:\d+\.\s+)?Write Ownership\b", r"^###\s+Write Ownership\b")),
        ("execution plan", (r"^##\s+(?:\d+\.\s+)?Execution Plan\b", r"^##\s+(?:\d+\.\s+)?.*Execution Rules\b")),
        ("evidence requirements", (r"^##\s+Evidence Requirements\b", r"Evidence Trace Block")),
        ("acceptance criteria", (r"^##\s+Acceptance Criteria\b", r"Acceptance Criteria")),
        ("review gate", (r"^##\s+(?:\d+\.\s+)?Review Gate\b",)),
        ("closure checklist", (r"^##\s+(?:\d+\.\s+)?Closure Checklist\b", r"^##\s+(?:\d+\.\s+)?Completion Requirements\b")),
        ("return conditions", (r"^##\s+(?:\d+\.\s+)?Return-To-Orchestrator Conditions\b", r"Return to orchestrator")),
        (
            "operator checkpoint",
            (
                r"^##\s+(?:\d+\.\s+)?Operator Checkpoint\b",
                r"operator\.checkpoint\.waiver",
            ),
        ),
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
    "reference": (
        ("purpose", (r"^##\s+Purpose\b",)),
        (
            "scope/applies-to",
            (
                r"^##\s+Scope\b",
                r"^##\s+Applies To\b",
                r"^##\s+Owner Surface",
                r"^##\s+Source Lineage",
                r"^##\s+Target",
                r"\*\*Applies to:\*\*",
            ),
        ),
        (
            "claim/final/verification boundary",
            (
                r"^##\s+Claim Boundary\b",
                r"^##\s+Final Clause\b",
                r"^##\s+Verification\b",
                r"^##\s+Current Closure Statement\b",
            ),
        ),
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

DOC_TYPE_ALIASES: dict[str, str] = {
    "audit": "review",
    "completion_review": "review",
    "rebuttal_review": "review",
    "gc018": "baseline",
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


def _path_exists_at_ref(path: str, ref: str) -> bool:
    normalized = path.replace("\\", "/")
    code, _, _ = _run_git(["cat-file", "-e", f"{ref}:{normalized}"])
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
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md"):
        return False
    if _is_archive_markdown_path(normalized):
        return False
    if normalized.startswith("CVF_SESSION/handoffs/archive/"):
        return False
    return (
        normalized.startswith("docs/")
        or normalized.startswith("governance/toolkit/")
        or re.match(r"^AGENT_HANDOFF.*\.md$", normalized) is not None
        or re.match(r"^CVF_.+\.md$", normalized) is not None
    )


def _is_archive_markdown_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.endswith(".md") and "/archive/" in f"/{normalized}/"


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
    normalized_path = path.replace("\\", "/")
    doc_type_match = re.search(r"^docType:\s*([A-Za-z_ -]+)\s*$", text, re.M)
    if doc_type_match:
        declared = doc_type_match.group(1).strip().lower().replace("-", "_").replace(" ", "_")
        declared = DOC_TYPE_ALIASES.get(declared, declared)
        if declared in SECTION_GROUPS:
            return declared
    name = Path(path).name.upper()
    title = "\n".join(text.splitlines()[:8]).upper()
    haystack = f"{path.upper()} {name} {title}"
    if normalized_path.startswith("docs/work_orders/"):
        return "work_order"
    if normalized_path.startswith("docs/roadmaps/"):
        return "roadmap"
    if normalized_path.startswith("docs/reviews/"):
        return "review"
    if normalized_path.startswith("docs/audits/"):
        return "review"
    if normalized_path.startswith("docs/baselines/") or normalized_path.startswith("docs/assessments/"):
        return "baseline"
    if normalized_path.startswith("docs/reference/"):
        return "reference"
    if "AGENT_HANDOFF" in haystack or "HANDOFF" in haystack:
        return "handoff"
    if path.startswith("governance/toolkit/") and name.endswith("_GUARD.MD"):
        return "guard"
    if "ADR" in haystack or "ARCHITECTURE DECISION" in haystack:
        return "adr"
    if "SOP" in haystack or "STANDARD OPERATING PROCEDURE" in haystack:
        return "sop"
    if "WORK_ORDER" in haystack or "WORK ORDER" in haystack:
        return "work_order"
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
    normalized = path.replace("\\", "/")
    if normalized in STRUCTURAL_CHECK_EXEMPT or _is_archive_markdown_path(normalized):
        return []
    text = _read_rel(path)
    artifact_type = _classify(path, text)
    issues: list[str] = []

    for label, patterns in COMMON_GROUPS:
        if not _has_any(text, patterns):
            issues.append(f"missing common element: {label}")

    for label, patterns in SECTION_GROUPS.get(artifact_type, ()):
        if artifact_type == "work_order" and label == "operator checkpoint":
            if _has_any(text, patterns):
                continue
            if _path_exists_at_ref(path, OPERATOR_CHECKPOINT_GRANDFATHER_REF):
                continue
            issues.append("missing work_order section: operator checkpoint")
            continue
        if not _has_any(text, patterns):
            issues.append(f"missing {artifact_type} section: {label}")

    return issues


def _check_required_markers() -> list[dict[str, Any]]:
    violations: list[dict[str, Any]] = []
    for path in REQUIRED_FILES:
        text = effective_binding_text(path, _read_rel(path))
        if not text:
            violations.append({"path": path, "issues": ["required file missing"]})
            continue
        missing = [marker for marker in REQUIRED_MARKERS.get(path, ()) if marker not in text]
        if missing:
            violations.append({"path": path, "issues": [f"missing marker `{marker}`" for marker in missing]})
    return violations


def _run_check(base: str | None, head: str | None, all_changed: bool) -> dict[str, Any]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    changed = _get_changed(resolved_base, resolved_head)
    targets = [
        path for path, statuses in sorted(changed.items())
        if _is_governed_markdown(path) and (all_changed or _is_new(statuses))
    ]

    violations = _check_required_markers()
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
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    report = _run_check(args.base, args.head, args.all_changed)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)
    return 1 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
