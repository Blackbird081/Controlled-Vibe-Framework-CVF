#!/usr/bin/env python3
"""
CVF GC-018 Stop-Boundary Semantics Gate

Ensures newly changed GC-018 continuation candidate packets explicitly classify
low-yield continuation classes and justify why continuation is still better than
a lateral shift toward a broader unresolved weakness.

Policy anchors:
  - governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md
  - docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018
  - docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md
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

TEMPLATE_PATH = "docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md"
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md"

PACKET_PREFIX = "docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_"
PACKET_SUFFIX = ".md"

REQUIRED_TEMPLATE_MARKERS = (
    "Continuation class:",
    "Lateral alternative considered:",
    "Why not lateral shift:",
    "Real decision boundary improved:",
)

FIELD_PATTERNS = {
    "continuationClass": re.compile(r"^- Continuation class:\s*(.+?)\s*$", re.MULTILINE),
    "lateralAlternativeConsidered": re.compile(r"^- Lateral alternative considered:\s*(YES|NO)\s*$", re.MULTILINE),
    "whyNotLateralShift": re.compile(r"^- Why not lateral shift:\s*(.+?)\s*$", re.MULTILINE),
    "realDecisionBoundaryImproved": re.compile(r"^- Real decision boundary improved:\s*(YES|NO)\s*$", re.MULTILINE),
    "decision": re.compile(r"^- Decision:\s*(CONTINUE|REVIEW REQUIRED|DEFER)\s*$", re.MULTILINE),
    "authorizedNow": re.compile(r"^- Authorized now:\s*(YES|NO)\s*$", re.MULTILINE),
}

VALID_CONTINUATION_CLASSES = {
    "VALIDATION_TEST",
    "PACKAGING_ONLY",
    "TRUTH_CLAIM",
    "REALIZATION",
    "STRUCTURAL",
    "MIXED",
    "OTHER",
}

LOW_YIELD_CLASSES = {
    "VALIDATION_TEST",
    "PACKAGING_ONLY",
    "TRUTH_CLAIM",
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


def _is_candidate_packet(path: str, statuses: list[str]) -> bool:
    if _is_deleted_only(statuses):
        return False
    return path.startswith(PACKET_PREFIX) and path.endswith(PACKET_SUFFIX)


def _extract_field(text: str, field_name: str) -> str | None:
    pattern = FIELD_PATTERNS[field_name]
    match = pattern.search(text)
    if not match:
        return None
    return match.group(1).strip()


def _is_placeholder(value: str | None) -> bool:
    if value is None:
        return True
    stripped = value.strip()
    if not stripped:
        return True
    if "<" in stripped or ">" in stripped:
        return True
    if stripped.upper() in {"TBD", "N/A", "NA", "NONE"}:
        return True
    return False


def _validate_template() -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    text = _read_text(TEMPLATE_PATH)
    if not text:
        return [{
            "path": TEMPLATE_PATH,
            "type": "missing_template",
            "message": f"`{TEMPLATE_PATH}` is missing.",
        }]

    for marker in REQUIRED_TEMPLATE_MARKERS:
        if marker not in text:
            violations.append({
                "path": TEMPLATE_PATH,
                "type": "template_marker_missing",
                "message": f"`{marker}` is missing from `{TEMPLATE_PATH}`.",
            })
    return violations


def _validate_packet(path: str) -> list[dict[str, str]]:
    text = _read_text(path)
    violations: list[dict[str, str]] = []
    if not text:
        return [{
            "path": path,
            "type": "missing_packet",
            "message": f"`{path}` is missing or unreadable.",
        }]

    extracted: dict[str, str | None] = {
        key: _extract_field(text, key)
        for key in FIELD_PATTERNS
    }

    for field_name, value in extracted.items():
        if value is None:
            violations.append({
                "path": path,
                "type": "missing_field",
                "message": f"`{path}` is missing required field `{field_name}`.",
            })

    continuation_class = extracted["continuationClass"]
    if continuation_class and continuation_class not in VALID_CONTINUATION_CLASSES:
        violations.append({
            "path": path,
            "type": "invalid_continuation_class",
            "message": (
                f"`{path}` has invalid continuation class `{continuation_class}`. "
                f"Expected one of: {', '.join(sorted(VALID_CONTINUATION_CLASSES))}."
            ),
        })

    why_not_lateral_shift = extracted["whyNotLateralShift"]
    if why_not_lateral_shift is not None and _is_placeholder(why_not_lateral_shift):
        violations.append({
            "path": path,
            "type": "placeholder_why_not_lateral_shift",
            "message": f"`{path}` must provide a real `Why not lateral shift` justification.",
        })

    low_yield = continuation_class in LOW_YIELD_CLASSES if continuation_class else False
    decision = extracted["decision"]
    authorized_now = extracted["authorizedNow"]
    real_boundary = extracted["realDecisionBoundaryImproved"]
    lateral_considered = extracted["lateralAlternativeConsidered"]

    if low_yield:
        if lateral_considered != "YES":
            violations.append({
                "path": path,
                "type": "lateral_alternative_required",
                "message": (
                    f"`{path}` is a low-yield continuation class (`{continuation_class}`) "
                    "and must set `Lateral alternative considered: YES`."
                ),
            })

        if (decision == "CONTINUE" or authorized_now == "YES") and real_boundary != "YES":
            violations.append({
                "path": path,
                "type": "real_decision_boundary_required",
                "message": (
                    f"`{path}` continues a low-yield continuation class (`{continuation_class}`) "
                    "without proving `Real decision boundary improved: YES`."
                ),
            })

    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    candidate_packets = [
        path for path, statuses in changed_paths.items()
        if _is_candidate_packet(path, statuses)
    ]

    violations = _validate_template()
    for path in candidate_packets:
        violations.extend(_validate_packet(path))

    return {
        "candidatePacketCount": len(candidate_packets),
        "candidatePackets": candidate_packets,
        "violations": violations,
        "violationCount": len(violations),
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF GC-018 Stop-Boundary Semantics Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Candidate packets checked: {report['candidatePacketCount']}")
    print(f"Violations: {report['violationCount']}")

    if report["candidatePackets"]:
        print("\nCandidate packets:")
        for path in report["candidatePackets"]:
            print(f"  - {path}")

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['type']}: {violation['message']}")

    if report["compliant"]:
        print("\n✅ COMPLIANT — GC-018 stop-boundary semantics are intact for changed continuation packets.")
    else:
        print("\n❌ VIOLATION — GC-018 continuation packet semantics are incomplete or unsafe.")
        print(f"   See: {POLICY_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF GC-018 stop-boundary semantics gate")
    parser.add_argument("--base", default=None, help="Git base ref")
    parser.add_argument("--head", default=None, help="Git head ref")
    parser.add_argument("--enforce", action="store_true", help="Exit 2 on violation")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    base, head, base_source = _resolve_range(args.base, args.head)

    try:
        changed = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        if args.base:
            print(str(exc), file=sys.stderr)
            return 1
        base = "HEAD~1"
        base_source = "fallback-after-error:HEAD~1"
        try:
            changed = _get_changed_name_status(base, head)
        except RuntimeError as fallback_exc:
            print(str(fallback_exc), file=sys.stderr)
            return 1

    worktree_changed = _get_worktree_name_status()
    merged = _merge_changed_maps(changed, worktree_changed)

    classified = _classify(merged)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "policy": POLICY_PATH,
        "controlId": "GC-018",
        **classified,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report, base, head, base_source)

    if args.enforce and not classified["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
