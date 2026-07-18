#!/usr/bin/env python3
"""
CVF Finding-To-Governance Learning Gate

Requires changed finding-bearing logs/reviews/assessments/audits to classify
whether each finding becomes a rule, guard, phase-gate action, design review, or
runtime/data-learning candidate.
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
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md"
THIS_SCRIPT_PATH = "governance/compat/check_finding_to_governance_learning.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

APPLICABLE_PREFIXES = ("docs/logs/", "docs/reviews/", "docs/assessments/", "docs/audits/")
PROVIDER_MEMORY_ESCAPE_PREFIXES = APPLICABLE_PREFIXES + ("docs/work_orders/",)
ARCHIVE_PATH_MARKER = "/archive/"
FINDING_HEADING_RE = re.compile(r"(?im)^##\s+(?:Quality Findings|Findings|Known Issues)\s*$")
FINDING_TABLE_RE = re.compile(r"(?im)^\s*\|\s*Finding\s*\|")
KNOWN_ISSUES_RE = re.compile(r"(?im)^Known Issues\s*$")
REQUIRED_SECTION = "## Finding-To-Governance Learning Disposition"
DEFECT_CLASSES = (
    "WORKER_EXECUTION_ERROR",
    "ORCHESTRATOR_PACKET_GAP",
    "RULE_GAP",
    "MACHINE_GATE_GAP",
    "PHASE_GATE_PLACEMENT_GAP",
    "OPERATOR_SCOPE_CLARITY_GAP",
    "RUNTIME_SIGNAL_GAP",
)
LANES = (
    "GOVERNANCE_CONTROL_PLANE",
    "RUNTIME_BEHAVIOR_LEARNING",
    "PROVIDER_OUTPUT_LEARNING",
    "COST_ECONOMICS_LEARNING",
    "DOCUMENTATION_ONLY_LEARNING",
)
DISPOSITIONS = (
    "RULE_EXISTS",
    "RULE_ADDED",
    "MACHINE_CHECK_ADDED",
    "MACHINE_CHECK_CANDIDATE",
    "PHASE_GATE_PLACEMENT_GAP",
    "DESIGN_REVIEW_REQUIRED",
    "RUNTIME_LEARNING_CANDIDATE",
    "N/A_WITH_REASON",
    "TEMPLATE_UPDATED",
    "STANDARD_UPDATED",
    "STANDARD_ADDED",
)

GENERALIZABLE_FINDING_MARKERS = (
    "repeated",
    "repeat",
    "recurring",
    "generalizable",
    "reusable",
    "future agent",
    "future agents",
    "future orchestrator",
    "future worker",
    "systemic",
    "control-plane",
    "control plane",
    "template gap",
    "rules/template",
    "rule/template",
    "rule gap",
    "guard gap",
    "machine gate gap",
    "phase gate",
    "standardize",
    "standardization",
    "canonical standard",
)

GENERALIZABLE_PROMOTION_DISPOSITIONS = (
    "RULE_EXISTS",
    "RULE_ADDED",
    "MACHINE_CHECK_ADDED",
    "MACHINE_CHECK_CANDIDATE",
    "TEMPLATE_UPDATED",
    "STANDARD_UPDATED",
    "STANDARD_ADDED",
    "PHASE_GATE_PLACEMENT_GAP",
    "DESIGN_REVIEW_REQUIRED",
    "N/A_WITH_REASON",
)

# Phrases that indicate a lesson was stored only in provider-specific memory.
# Detection is lower-cased before matching.
PROVIDER_MEMORY_ONLY_SIGNALS = (
    "stored in claude memory",
    "saved to claude memory",
    "recorded in claude memory",
    "captured in claude memory",
    "claude memory only",
    "codex memory only",
    "provider memory only",
    "in provider-specific memory",
    "lessons captured in memory",
    "gate lessons captured in memory",
    "new gate lessons captured in memory",
    "stored in memory.md",
    "saved to memory.md",
    "recorded in memory.md",
    "written to memory.md",
    "added to memory.md",
    "updated memory.md",
    "memory.md updated",
    "in memory.md",
    "in claude.md",
    "added to claude.md",
    "written to claude.md",
)

# Dispositions that prove a reusable lesson was promoted to CVF governance.
# If none of these appear alongside a provider-memory signal, it is a learning escape.
PROVIDER_MEMORY_GOVERNED_DISPOSITIONS = (
    "RULE_ADDED",
    "STANDARD_UPDATED",
    "STANDARD_ADDED",
    "MACHINE_CHECK_ADDED",
    "MACHINE_CHECK_CANDIDATE",
    "TEMPLATE_UPDATED",
)

PROVIDER_MEMORY_REUSABLE_SIGNALS = (
    "lesson",
    "lessons",
    "gate lesson",
    "guard lesson",
    "reusable",
    "future agent",
    "future agents",
    "future work order",
    "same kind of work order",
    "next time",
    "will be faster",
    "b7",
    "b8",
    "b9",
    "b10",
)

PROVIDER_MEMORY_LOCAL_NA_SIGNALS = (
    "session-local",
    "session local",
    "operator preference",
    "personal preference",
    "not reusable",
    "non-reusable",
    "one-off",
)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
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
    for item in maps:
        for path, statuses in item.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def _read_rel_at(ref: str, path: str) -> str:
    normalized = path.replace("\\", "/")
    code, out, _ = _run_git(["show", f"{ref}:{normalized}"])
    return out if code == 0 else ""


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _has_any(text: str, markers: tuple[str, ...]) -> bool:
    return any(marker in text for marker in markers)


def _is_applicable_path(path: str) -> bool:
    return (
        path.endswith(".md")
        and ARCHIVE_PATH_MARKER not in path
        and any(path.startswith(prefix) for prefix in APPLICABLE_PREFIXES)
    )


def _is_provider_memory_escape_path(path: str) -> bool:
    return (
        path.endswith(".md")
        and ARCHIVE_PATH_MARKER not in path
        and any(path.startswith(prefix) for prefix in PROVIDER_MEMORY_ESCAPE_PREFIXES)
    )


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: canonical and machine-enforced standard",
        "## Protocol",
        "## Enforcement",
        "## Failure Modes",
        THIS_SCRIPT_PATH,
        "GOVERNANCE_CONTROL_PLANE",
        "RUNTIME_BEHAVIOR_LEARNING",
        "MACHINE_CHECK_CANDIDATE",
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == AUTORUN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "autorun_binding_missing", f"autorun gate must run `{THIS_SCRIPT_PATH}`")
    if path == HOOK_CHAIN_PATH and not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "hook_binding_missing", f"local hook chain must run `{THIS_SCRIPT_PATH}`")
    return violations


def _has_finding_marker(text: str) -> bool:
    return bool(
        FINDING_HEADING_RE.search(text)
        or FINDING_TABLE_RE.search(text)
        or KNOWN_ISSUES_RE.search(text)
    )


def _validate_finding_doc(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable_path(path) or not _has_finding_marker(text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(violations, path, "learning_disposition_section_missing", f"finding-bearing artifact must include `{REQUIRED_SECTION}`")
        return violations
    if not _has_any(text, DEFECT_CLASSES):
        _add(violations, path, "defect_class_missing", "learning disposition must include a defect class")
    if not _has_any(text, LANES):
        _add(violations, path, "learning_lane_missing", "learning disposition must include a learning lane")
    if not _has_any(text, DISPOSITIONS):
        _add(violations, path, "learning_disposition_missing", "learning disposition must include an allowed disposition")
    if "next action" not in text.lower() and "next control action" not in text.lower():
        _add(violations, path, "next_action_missing", "learning disposition must include next action")

    disposition_section = text.split(REQUIRED_SECTION, 1)[1]
    lowered_disposition = disposition_section.lower()
    if any(marker in lowered_disposition for marker in GENERALIZABLE_FINDING_MARKERS):
        if not _has_any(disposition_section, GENERALIZABLE_PROMOTION_DISPOSITIONS):
            _add(
                violations,
                path,
                "generalizable_finding_promotion_missing",
                "generalizable/repeated rule, template, guard, or phase-gate findings must be promoted "
                "to a reusable CVF control (`RULE_ADDED`, `TEMPLATE_UPDATED`, `STANDARD_ADDED`, "
                "`MACHINE_CHECK_ADDED`, candidate, or explicit `N/A_WITH_REASON`)",
            )

    lowered = text.lower()
    runtime_terms = ("runtime", "provider", "cost", "token", "latency")
    if any(term in lowered for term in runtime_terms):
        has_runtime_lane = any(
            lane in text
            for lane in ("RUNTIME_BEHAVIOR_LEARNING", "PROVIDER_OUTPUT_LEARNING", "COST_ECONOMICS_LEARNING")
        )
        has_explicit_na = "N/A_WITH_REASON" in text
        if not has_runtime_lane and not has_explicit_na:
            _add(violations, path, "runtime_learning_lane_missing", "runtime/provider/cost findings require runtime/provider/cost learning lane or explicit N/A")

    return violations


def _validate_provider_memory_learning_escape(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_provider_memory_escape_path(path):
        return violations
    lowered = text.lower()
    has_memory_signal = any(signal in lowered for signal in PROVIDER_MEMORY_ONLY_SIGNALS)
    has_memory_md_signal = re.search(r"\bmemory\.md\b", lowered) is not None
    if not has_memory_signal and not has_memory_md_signal:
        return violations
    has_governed = any(disp in text for disp in PROVIDER_MEMORY_GOVERNED_DISPOSITIONS)
    if has_governed:
        return violations
    has_na = "N/A_WITH_REASON" in text
    has_reusable_signal = any(signal in lowered for signal in PROVIDER_MEMORY_REUSABLE_SIGNALS)
    has_local_na_signal = any(signal in lowered for signal in PROVIDER_MEMORY_LOCAL_NA_SIGNALS)
    if has_na and has_local_na_signal and not has_reusable_signal:
        return violations
    _add(
        violations,
        path,
        "provider_memory_only_learning_escape",
        "reusable lesson stored only in provider-specific memory must have a CVF-governed "
        "promotion disposition (RULE_ADDED, STANDARD_ADDED, MACHINE_CHECK_ADDED, etc.) "
        "or an explicit non-reusable/session-local N/A_WITH_REASON - provider memory is not CVF source authority",
    )
    return violations


def _validate_path_with_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_provider_memory_learning_escape(path, text))
    violations.extend(_validate_finding_doc(path, text))
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists():
        return []
    text = _read_rel(path)
    return _validate_path_with_text(path, text)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    paths_to_check = set(changed_paths)
    for path in (STANDARD_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH):
        if (REPO_ROOT / path).exists():
            paths_to_check.add(path)
    scoped_paths = sorted(
        path
        for path in paths_to_check
        if (
            path == STANDARD_PATH
            or path in {AUTORUN_PATH, HOOK_CHAIN_PATH}
            or _is_applicable_path(path)
            or _is_provider_memory_escape_path(path)
        )
    )
    violations: list[dict[str, str]] = []
    for path in scoped_paths:
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        # Skip rename-only files — content unchanged, no new violations possible.
        if statuses and all(s.startswith("R") for s in statuses):
            continue
        new_violations = _validate_path(path)
        if not new_violations:
            continue
        # Suppress pre-existing violations: only report issues introduced by this change.
        head_text = _read_rel_at("HEAD", path)
        if head_text:
            head_violations = set(
                (v["type"], v["message"])
                for v in _validate_path_with_text(path, head_text)
            )
            new_violations = [
                v for v in new_violations
                if (v["type"], v["message"]) not in head_violations
            ]
        violations.extend(new_violations)
    return {
        "filesChecked": scoped_paths,
        "fileCount": len(scoped_paths),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, base_source: str) -> None:
    print("=== CVF Finding-To-Governance Learning Gate ===")
    print(f"Range: {base}..{head}")
    print(f"Base source: {base_source}")
    print(f"Files checked: {report['fileCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["filesChecked"]:
        print("\nFiles checked:")
        for path in report["filesChecked"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - finding-to-governance learning gate is satisfied.")
    else:
        print("\nVIOLATION - add learning disposition for finding-bearing artifacts.")
        print(f"See: {STANDARD_PATH}")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")
    parser = argparse.ArgumentParser(description="Enforce finding-to-governance learning disposition")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    base, head, base_source = _resolve_range(args.base, args.head)
    try:
        range_changes = _get_changed_name_status(base, head)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    changed_paths = _merge_changed_maps(range_changes, _get_worktree_name_status())
    classified = _classify(changed_paths)
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "range": {"base": base, "head": head, "baseSource": base_source},
        "standard": STANDARD_PATH,
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
