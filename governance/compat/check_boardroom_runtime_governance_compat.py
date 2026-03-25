#!/usr/bin/env python3
"""
CVF Boardroom Runtime Governance Compatibility Gate

Ensures that the canonical GC-028 boardroom runtime chain stays aligned:
- guard exists
- boardroom protocol and templates exist
- master policy references the control
- control matrix registers the control
- session bootstrap routes to the control
- docs index points to the canonical templates
- local hook chain and CI workflow run this gate
- runtime owner files exist and expose the expected transition surface
- changed canonical boardroom docs contain the required sections and file:line evidence
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

GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_BOARDROOM_RUNTIME_GUARD.md"
PROTOCOL_PATH = "docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md"
SESSION_TEMPLATE_PATH = "docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md"
DISSENT_TEMPLATE_PATH = "docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md"
TRANSITION_TEMPLATE_PATH = "docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
RUNTIME_GATE_PATH = "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts"
DESIGN_CONSUMER_PATH = "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/design.consumer.contract.ts"
RUNTIME_TEST_PATH = "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/design.consumer.test.ts"
THIS_SCRIPT_PATH = "governance/compat/check_boardroom_runtime_governance_compat.py"

REQUIRED_FILES = (
    GUARD_PATH,
    PROTOCOL_PATH,
    SESSION_TEMPLATE_PATH,
    DISSENT_TEMPLATE_PATH,
    TRANSITION_TEMPLATE_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    DOCS_INDEX_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
    RUNTIME_GATE_PATH,
    DESIGN_CONSUMER_PATH,
    RUNTIME_TEST_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    GUARD_PATH: (
        "Control ID: `GC-028`",
        "No downstream orchestration may proceed until the transition gate returns `PROCEED_TO_ORCHESTRATION`.",
        SESSION_TEMPLATE_PATH,
        DISSENT_TEMPLATE_PATH,
        TRANSITION_TEMPLATE_PATH,
        RUNTIME_GATE_PATH,
        THIS_SCRIPT_PATH,
    ),
    PROTOCOL_PATH: (
        "`GC-028`",
        RUNTIME_GATE_PATH,
        "GC-028 governs the decision surface regardless of that internal packaging detail",
        "governance/toolkit/05_OPERATION/CVF_BOARDROOM_RUNTIME_GUARD.md",
        THIS_SCRIPT_PATH,
    ),
    SESSION_TEMPLATE_PATH: (
        "Review mode: `BOARDROOM_SESSION_PACKET`",
        "## 2. Intake Candidate Summary",
        "## 3. Participants / Roles",
        "## 4. Clarifications",
        "## 5. Arguments / Evidence",
        "## 6. Dissent Log",
        "## 7. Decision Outcome",
        "## 8. Transition Directive",
        "## 9. Evidence Ledger",
    ),
    DISSENT_TEMPLATE_PATH: (
        "Review mode: `BOARDROOM_DISSENT_LOG`",
        "## 2. Dissent Claim",
        "## 3. Supporting Evidence",
        "## 4. Risk If Ignored",
        "## 5. Resolution Status",
    ),
    TRANSITION_TEMPLATE_PATH: (
        "Review mode: `BOARDROOM_TRANSITION_DECISION`",
        "## 2. Dominant Decision",
        "## 3. Transition Gate Result",
        "## 4. Allowed Next Step",
        "## 5. Blocking Conditions",
        "## 6. Evidence Ledger",
    ),
    MASTER_POLICY_PATH: (
        "Live `AI Boardroom` deliberation is a separate high-criticality control and must truthfully gate downstream work",
        GUARD_PATH,
        PROTOCOL_PATH,
        THIS_SCRIPT_PATH,
    ),
    CONTROL_MATRIX_PATH: (
        "`GC-028`",
        RUNTIME_GATE_PATH,
        GUARD_PATH,
        PROTOCOL_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-028",
        "live boardroom deliberation in intake/design flow",
        GUARD_PATH,
        RUNTIME_GATE_PATH,
    ),
    DOCS_INDEX_PATH: (
        "reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md",
        "reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md",
        "reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md",
        "reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "Boardroom Runtime Governance",
        "boardroom-runtime-governance",
    ),
    RUNTIME_GATE_PATH: (
        "export type BoardroomTransitionAction",
        '"PROCEED_TO_ORCHESTRATION"',
        '"RETURN_TO_DESIGN"',
        '"ESCALATE_FOR_REVIEW"',
        '"STOP_EXECUTION"',
        "export class BoardroomTransitionGateContract",
    ),
    DESIGN_CONSUMER_PATH: (
        "BoardroomTransitionGateContract",
        "boardroomTransition",
        "orchestrationBlocked",
    ),
    RUNTIME_TEST_PATH: (
        "boardroomTransition",
        "orchestrationBlocked",
    ),
}

DOC_PATTERNS: dict[str, re.Pattern[str]] = {
    "session": re.compile(r"^docs/reviews/CVF_BOARDROOM_SESSION_PACKET_.+\.md$"),
    "dissent": re.compile(r"^docs/reviews/CVF_BOARDROOM_DISSENT_LOG_.+\.md$"),
    "transition": re.compile(r"^docs/reviews/CVF_BOARDROOM_TRANSITION_DECISION_.+\.md$"),
}

DOC_REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    "session": (
        "## 2. Intake Candidate Summary",
        "## 3. Participants / Roles",
        "## 4. Clarifications",
        "## 5. Arguments / Evidence",
        "## 6. Dissent Log",
        "## 7. Decision Outcome",
        "## 8. Transition Directive",
        "## 9. Evidence Ledger",
    ),
    "dissent": (
        "## 2. Dissent Claim",
        "## 3. Supporting Evidence",
        "## 4. Risk If Ignored",
        "## 5. Resolution Status",
    ),
    "transition": (
        "## 2. Dominant Decision",
        "## 3. Transition Gate Result",
        "## 4. Allowed Next Step",
        "## 5. Blocking Conditions",
        "## 6. Evidence Ledger",
    ),
}

EVIDENCE_PATTERN = re.compile(r"[A-Za-z0-9_./\\-]+\.(?:md|ts):\d+")


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
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _is_deleted_only(statuses: list[str]) -> bool:
    return all(status.startswith("D") for status in statuses)


def _read_text(path: str) -> str:
    abs_path = REPO_ROOT / path
    if not abs_path.exists() or abs_path.is_dir():
        return ""
    return abs_path.read_text(encoding="utf-8")


def _classify_doc_type(path: str, statuses: list[str]) -> str | None:
    if _is_deleted_only(statuses):
        return None
    for doc_type, pattern in DOC_PATTERNS.items():
        if pattern.match(path):
            return doc_type
    return None


def _validate_canonical_doc(path: str, doc_type: str) -> list[dict[str, str]]:
    text = _read_text(path)
    violations: list[dict[str, str]] = []
    if not text:
        return [{
            "path": path,
            "type": "missing_doc",
            "message": f"`{path}` is missing or unreadable.",
        }]

    for marker in DOC_REQUIRED_MARKERS[doc_type]:
        if marker not in text:
            violations.append({
                "path": path,
                "type": "missing_marker",
                "message": f"`{path}` is missing required section `{marker}`.",
            })

    if not EVIDENCE_PATTERN.search(text):
        violations.append({
            "path": path,
            "type": "missing_file_line_evidence",
            "message": f"`{path}` must include at least one `file:line` evidence reference.",
        })

    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    missing_files = [path for path in REQUIRED_FILES if not (REPO_ROOT / path).exists()]

    marker_violations: dict[str, list[str]] = {}
    for path, markers in REQUIRED_MARKERS.items():
        text = _read_text(path)
        missing_markers = [marker for marker in markers if marker not in text]
        if missing_markers:
            marker_violations[path] = missing_markers

    relevant_changed_files = [
        path for path in changed_paths
        if path in REQUIRED_FILES or path == THIS_SCRIPT_PATH
    ]

    canonical_doc_reports: list[dict[str, Any]] = []
    canonical_doc_violations: list[dict[str, str]] = []
    for path, statuses in changed_paths.items():
        doc_type = _classify_doc_type(path, statuses)
        if doc_type is None:
            continue
        violations = _validate_canonical_doc(path, doc_type)
        canonical_doc_reports.append({
            "path": path,
            "docType": doc_type,
            "violationCount": len(violations),
        })
        canonical_doc_violations.extend(violations)

    compliant = not missing_files and not marker_violations and not canonical_doc_violations

    return {
        "requiredFileCount": len(REQUIRED_FILES),
        "missingFiles": missing_files,
        "missingFileCount": len(missing_files),
        "markerViolations": marker_violations,
        "markerViolationCount": len(marker_violations),
        "relevantChangedFiles": relevant_changed_files,
        "relevantChangedFileCount": len(relevant_changed_files),
        "canonicalDocReports": canonical_doc_reports,
        "canonicalDocViolations": canonical_doc_violations,
        "canonicalDocViolationCount": len(canonical_doc_violations),
        "compliant": compliant,
        "changedFiles": list(changed_paths.keys()),
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Boardroom Runtime Governance Compatibility Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Required files checked: {report['requiredFileCount']}")
    print(f"Relevant GC-028 files changed: {report['relevantChangedFileCount']}")
    print(f"Missing files: {report['missingFileCount']}")
    print(f"Marker violations: {report['markerViolationCount']}")
    print(f"Canonical doc violations: {report['canonicalDocViolationCount']}")

    if report["relevantChangedFiles"]:
        print("\nRelevant GC-028 files changed:")
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

    if report["canonicalDocReports"]:
        print("\nCanonical boardroom docs checked:")
        for item in report["canonicalDocReports"]:
            print(f"  - {item['path']} [{item['docType']}] violations={item['violationCount']}")

    if report["canonicalDocViolations"]:
        print("\nCanonical doc violations:")
        for item in report["canonicalDocViolations"]:
            print(f"  - {item['path']}: {item['message']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — GC-028 boardroom runtime guard, protocol, templates, runtime owner, bootstrap, hook-chain, and canonical boardroom packet validation are aligned.")
        return

    print("\n❌ VIOLATION — GC-028 boardroom runtime governance chain is incomplete or misaligned.")
    print("   Action required:")
    print(f"   1. Ensure {GUARD_PATH}, {PROTOCOL_PATH}, and all three templates exist and stay aligned.")
    print(f"   2. Ensure {MASTER_POLICY_PATH}, {CONTROL_MATRIX_PATH}, {BOOTSTRAP_PATH}, and {DOCS_INDEX_PATH} reference GC-028 truthfully.")
    print(f"   3. Ensure {RUNTIME_GATE_PATH}, {DESIGN_CONSUMER_PATH}, and {RUNTIME_TEST_PATH} expose the expected boardroom transition surface.")
    print(f"   4. Ensure {HOOK_CHAIN_PATH} and {WORKFLOW_PATH} run {THIS_SCRIPT_PATH}.")
    print("   5. Ensure changed canonical boardroom docs contain the required sections and file:line evidence.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF boardroom runtime governance compatibility gate")
    parser.add_argument("--base", default=None, help="Git base ref (default: auto-detect merge-base, then fallback HEAD~1)")
    parser.add_argument("--head", default=None, help="Git head ref (default: HEAD)")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero (exit 2) when the GC-028 chain is incomplete or misaligned")
    parser.add_argument("--json", action="store_true", help="Print JSON report to stdout instead of text")
    parser.add_argument("--write-report", default=None, help="Optional output path for JSON report file")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        changed_map = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            fallback_base = "HEAD~1"
            try:
                changed_map = _get_changed_name_status(fallback_base, head)
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

    worktree_map = _get_worktree_name_status()
    merged = _merge_changed_maps(changed_map, worktree_map)

    classified = _classify(merged)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": GUARD_PATH,
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
