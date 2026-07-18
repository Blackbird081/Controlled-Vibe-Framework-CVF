#!/usr/bin/env python3
"""
CVF Rescan Intelligence Hardening Gate

Requires changed rescan/intake outputs to reconcile against their predecessor
intake, route follow-up work, and include adversarial semantic sampling.
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
    from governance.compat.guard_behavior_discussion import strip_marked_discussion_sections
except ModuleNotFoundError:
    from guard_behavior_discussion import strip_marked_discussion_sections

try:
    from guard_binding_catalog import has_binding_marker
except ModuleNotFoundError:
    from governance.compat.guard_binding_catalog import has_binding_marker


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/CVF_RESCAN_INTELLIGENCE_HARDENING_STANDARD_2026-06-05.md"
THIS_SCRIPT_PATH = "governance/compat/check_rescan_intelligence_hardening.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
ARCHIVE_MARKER = "/archive/"

REQUIRED_SECTION = "## Rescan Intelligence Hardening"
REQUIRED_FIELDS = (
    "Original source artifact:",
    "Predecessor intake artifact:",
    "Delta ledger status:",
    "Routing matrix status:",
    "Semantic sampling status:",
    "Rescan intelligence verdict:",
)
ALLOWED_VERDICTS = (
    "COMPLETE_WITH_DELTA_ROUTING_SAMPLE",
    "COMPLETE_WITH_DECLARED_LIMITS",
    "PARTIAL",
    "BLOCKED",
    "NOT_APPLICABLE_WITH_REASON",
)
DELTA_CATEGORIES = (
    "UNCHANGED_FROM_INTAKE",
    "CHANGED_DISPOSITION",
    "NEW_FINDING",
    "REMOVED_OR_REJECTED",
)
ROUTING_LANES = (
    "DO_NOW",
    "SEPARATE_RUNTIME_TRANCHE",
    "STRATEGIC_OPERATOR_DECISION",
    "OUT_OF_SCOPE",
    "RESOLVED_BY_DESIGN",
)
SEMANTIC_FIELDS = (
    "sampleId",
    "source section",
    "source claim",
    "disposition checked",
    "adversarial challenge",
    "verdict",
)
APPLICABLE_PREFIXES = (
    "docs/audits/",
    "docs/reviews/",
    "docs/assessments/",
    "docs/reports/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
)
APPLICABILITY_PATTERNS = (
    r"\brescan\b",
    r"\bre-scan\b",
    r"\bfull[- ]coverage\b",
    r"\bsource[- ]backed reassessment\b",
    r"\bsource[- ]verified rescan\b",
    r"\bknowledge absorption\b",
    r"\bintake refresh\b",
)

RESCAN_TOKEN_RE = r"(?:rescan|re-scan)"
RESCAN_GUARD_MAINTENANCE_NOUNS = (
    r"hardening|guard(?:'s)?|checker|standard|section|body|block|verdict|"
    r"packet|rule|filtering|phrase|phrasing|exclusion|defect|trigger|"
    r"maintenance|false[- ]trigger"
)
RESCAN_SELF_REFERENCE_COMPOUND_RE = re.compile(
    rf"\b{RESCAN_TOKEN_RE}\b(?:[\s,-]+\w+){{0,3}}[\s,-]+(?:{RESCAN_GUARD_MAINTENANCE_NOUNS})\b"
    rf"|\b(?:{RESCAN_GUARD_MAINTENANCE_NOUNS})\b(?:[\s,-]+\w+){{0,3}}[\s,-]+\b{RESCAN_TOKEN_RE}\b",
    re.I,
)
NEGATED_RESCAN_CONTEXT_RE = re.compile(
    r"\b(?:not|never|no|without)\b[^.\n;]{0,120}\b"
    r"(?:rescan|re-scan|intake[- ]refresh|knowledge absorption|"
    r"source[- ]backed reassessment|source[- ]verified rescan)\b[^.\n;]*",
    re.I,
)

NA_LINE_RE = re.compile(r"(?im)^\s*[-|].{0,40}N/A\s+with\s+reason\b")
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


def _is_in_code_fence(lines: list[str], target_idx: int) -> bool:
    """Return True if the line at target_idx is inside a markdown code fence."""
    fence_count = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_count += 1
        if i == target_idx:
            break
    return (fence_count % 2) == 1


def _strip_non_signal_text(text: str) -> str:
    """Remove code fences, inline-code/cited-path spans, and N/A-with-reason
    lines before bare-keyword applicability matching, so incidental trigger
    words cited as evidence or declared non-applicable do not count as real
    rescan-applicability signal."""
    lines = text.splitlines()
    kept: list[str] = []
    for idx, line in enumerate(lines):
        if _is_in_code_fence(lines, idx):
            continue
        if NA_LINE_RE.match(line):
            continue
        kept.append(INLINE_CODE_RE.sub(" ", line))
    return "\n".join(kept)


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
        if status.startswith(("R", "C")):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for {base}..{head}: {err}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    code, out, err = _run_git(["status", "--short"])
    if code != 0:
        raise RuntimeError(f"git status failed: {err}")
    changed: dict[str, set[str]] = {}
    for raw_line in out.splitlines():
        if not raw_line.strip():
            continue
        status = raw_line[:2].strip() or raw_line[:2]
        path = raw_line[3:].strip()
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        path = path.replace("\\", "/")
        changed.setdefault(path, set()).add(status)
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed in maps:
        for path, statuses in changed.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _read_rel(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, vtype: str, message: str) -> None:
    violations.append({"path": path, "type": vtype, "message": message})


def _extract_section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return ""
    match = re.search(r"\n##\s+", text[start + len(heading):])
    if not match:
        return text[start:]
    return text[start:start + len(heading) + match.start()]


def _remove_section(text: str, heading: str) -> str:
    start = text.find(heading)
    if start == -1:
        return text
    match = re.search(r"\n##\s+", text[start + len(heading):])
    end = len(text) if not match else start + len(heading) + match.start()
    return text[:start] + "\n" + text[end:]


def _extract_verdict(section: str) -> str | None:
    match = re.search(r"^\s*-\s*Rescan intelligence verdict:\s*([A-Z_]+)\s*$", section, re.M)
    return match.group(1) if match else None


def _has_concrete_not_applicable_reason(section: str) -> bool:
    if not re.search(r"\bN/A\s+with\s+reason\b|\bReason:\s*\S", section, re.I):
        return False
    lowered = section.lower()
    return not any(token in lowered for token in ("<reason", "todo", "tbd", "confirm later"))


def _has_real_rescan_signal_outside_section(path: str, text: str) -> bool:
    if path.startswith("docs/work_orders/"):
        path_haystack = path.lower().replace("_", " ").replace("-", " ")
        if any(re.search(pattern, path_haystack, re.I) for pattern in APPLICABILITY_PATTERNS):
            return True
    signal_text = _strip_non_signal_text(
        strip_marked_discussion_sections(_remove_section(text, REQUIRED_SECTION))
    )
    non_rescan_discussion_phrases = (
        "rescan guard",
        "rescan standard",
        "rescan checker",
        "rescan section",
        "rescan block",
        "rescan matrices",
        "rescan compact",
        "rescan test",
        "rescan tests",
        "scaffold/rescan",
        "non-rescan",
        "non rescan",
        "not a rescan",
        "real rescan output",
        "real rescan outputs",
        "actual rescan output",
        "actual rescan outputs",
        "true rescan output",
        "true rescan outputs",
        "rescan/intake output",
        "rescan/intake outputs",
        "intake refresh output",
        "intake-refresh output",
    )
    signal_text = "\n".join(
        line
        for line in signal_text.splitlines()
        if not any(phrase in line.lower() for phrase in non_rescan_discussion_phrases)
    )
    lowered = re.sub(r"rescan[- ]intelligence(?:[- ]hardening)?", "", signal_text.lower())
    lowered = re.sub(r"check_rescan_intelligence_hardening\.py", " ", lowered)
    lowered = re.sub(
        r"\brescan[- ](?:guard|checker|standard|section|block|verdict|packet|rule|hardening)\b",
        " ",
        lowered,
    )
    lowered = re.sub(
        r"\b(?:real|actual|true)\s+rescan(?:/intake)?\s+(?:output|outputs|artifact|artifacts)\b",
        " ",
        lowered,
    )
    lowered = re.sub(r"\bnot\s+(?:a|itself\s+a)\s+rescan[^.\n]*", " ", lowered)
    lowered = re.sub(r"\bnot\s+performing\s+a\s+rescan[^.\n]*", " ", lowered)
    for _ in range(3):
        lowered = NEGATED_RESCAN_CONTEXT_RE.sub(" ", lowered)
        lowered = RESCAN_SELF_REFERENCE_COMPOUND_RE.sub(" ", lowered)
    return any(re.search(pattern, lowered, re.I) for pattern in APPLICABILITY_PATTERNS)


def _is_active_markdown(path: str) -> bool:
    if not path.endswith(".md"):
        return False
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    if normalized in {STANDARD_PATH}:
        return False
    return normalized.startswith(APPLICABLE_PREFIXES)


def _is_applicable_output(path: str, text: str) -> bool:
    if not _is_active_markdown(path):
        return False
    if REQUIRED_SECTION in text:
        return True
    if path.startswith("docs/roadmaps/"):
        return False
    if path.startswith("docs/work_orders/"):
        path_haystack = path.lower().replace("_", " ").replace("-", " ")
        return any(re.search(pattern, path_haystack, re.I) for pattern in APPLICABILITY_PATTERNS)
    return _has_real_rescan_signal_outside_section(path, text)


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "status: canonical and machine-enforced rescan intelligence standard",
        REQUIRED_SECTION,
        "### Original-Intake Delta Ledger",
        "### Follow-Up Routing Matrix",
        "### Semantic Sampling / Adversarial Review",
        "COMPLETE_WITH_DELTA_ROUTING_SAMPLE",
        "NOT_APPLICABLE_WITH_REASON",
        THIS_SCRIPT_PATH,
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    for marker in (*DELTA_CATEGORIES, *ROUTING_LANES, *SEMANTIC_FIELDS):
        if marker not in text:
            _add(violations, path, "standard_vocabulary_missing", f"missing vocabulary `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    if has_binding_marker(path, THIS_SCRIPT_PATH, text):
        return []
    return [{"path": path, "type": "binding_missing", "message": f"must cite `{THIS_SCRIPT_PATH}`"}]


def check_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable_output(path, text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(
            violations,
            path,
            "rescan_hardening_section_missing",
            f"rescan/intake output must include `{REQUIRED_SECTION}`",
        )
        return violations

    section = _extract_section(text, REQUIRED_SECTION)
    verdict = _extract_verdict(section)
    if verdict not in ALLOWED_VERDICTS:
        _add(violations, path, "rescan_verdict_invalid", "missing or invalid rescan intelligence verdict")

    if verdict == "NOT_APPLICABLE_WITH_REASON":
        if not _has_concrete_not_applicable_reason(section):
            _add(
                violations,
                path,
                "not_applicable_reason_missing",
                "NOT_APPLICABLE_WITH_REASON requires a concrete N/A with reason statement",
            )
        if _has_real_rescan_signal_outside_section(path, text):
            _add(
                violations,
                path,
                "not_applicable_used_for_rescan_output",
                "rescan/intake output cannot use compact NOT_APPLICABLE_WITH_REASON",
            )
        lowered = section.lower()
        if any(token in lowered for token in ("<path", "<reason", "<finding", "todo", "tbd", "confirm later")):
            _add(violations, path, "placeholder_residue", "rescan intelligence block contains placeholder residue")
        return violations

    for field in REQUIRED_FIELDS:
        if field not in section:
            _add(violations, path, "rescan_hardening_field_missing", f"missing field `{field}`")

    required_headings = (
        "### Original-Intake Delta Ledger",
        "### Follow-Up Routing Matrix",
        "### Semantic Sampling / Adversarial Review",
    )
    for heading in required_headings:
        if heading not in section:
            _add(violations, path, "rescan_subsection_missing", f"missing subsection `{heading}`")

    for marker in DELTA_CATEGORIES:
        if marker not in section:
            _add(violations, path, "delta_category_missing", f"missing delta category `{marker}`")
    for marker in ROUTING_LANES:
        if marker not in section:
            _add(violations, path, "routing_lane_missing", f"missing routing lane `{marker}`")
    for marker in SEMANTIC_FIELDS:
        if marker not in section:
            _add(violations, path, "semantic_sampling_field_missing", f"missing semantic sampling field `{marker}`")

    lowered = section.lower()
    if any(token in lowered for token in ("<path", "<reason", "<finding", "todo", "tbd", "confirm later")):
        _add(violations, path, "placeholder_residue", "rescan intelligence block contains placeholder residue")
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(check_text(path, text))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    required_paths = (STANDARD_PATH, THIS_SCRIPT_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH)
    missing_files = [path for path in required_paths if not (REPO_ROOT / path).exists()]
    scoped_paths = set(changed_paths)
    scoped_paths.update(path for path in required_paths if (REPO_ROOT / path).exists())

    violations: list[dict[str, str]] = []
    for path in sorted(scoped_paths):
        statuses = changed_paths.get(path, [])
        if statuses and all(status.startswith("D") for status in statuses):
            continue
        violations.extend(_validate_path(path))

    return {
        "checkedPaths": sorted(scoped_paths),
        "changedPaths": changed_paths,
        "missingFiles": missing_files,
        "violations": violations,
        "violationCount": len(missing_files) + len(violations),
        "compliant": not missing_files and not violations,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF Rescan Intelligence Hardening Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Standard: {STANDARD_PATH}")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked paths: {len(report['checkedPaths'])}")
    print(f"Missing files: {len(report['missingFiles'])}")
    print(f"Violations: {len(report['violations'])}")
    if report["missingFiles"]:
        print("\nMissing files:")
        for path in report["missingFiles"]:
            print(f"  - {path}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - rescan intelligence evidence is aligned.")
    else:
        print("\nVIOLATION - rescan intelligence evidence is incomplete or misaligned.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate rescan delta, routing, and adversarial sampling evidence")
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        changed_paths = _merge_changed_maps(
            _get_changed_name_status(base, head),
            _get_worktree_name_status(),
        )
        report = _classify(changed_paths)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    report["timestamp"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    report["range"] = {"base": base, "head": head, "source": range_source}
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report, base, head, range_source)
    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
