#!/usr/bin/env python3
"""
CVF Corpus-To-Knowledge-Map Reconciliation Gate

Requires corpus-derived knowledge maps to preserve source authority, safe
enumeration, semantic-region accounting, drift truth, and rebuildability.
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
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

METHOD_PATH = "docs/reference/CVF_KNOWLEDGE_SYSTEM_METHOD_STANDARD_2026-06-01.md"
STANDARD_PATH = "docs/reference/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_STANDARD_2026-06-01.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_GUARD.md"
THIS_SCRIPT_PATH = "governance/compat/check_corpus_to_knowledge_map_reconciliation.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
AGENTS_PATH = "AGENTS.md"
CLAUDE_PATH = "CLAUDE.md"
GC018_TEMPLATE_PATH = "docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md"
WORK_ORDER_TEMPLATE_PATH = "docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md"
ARCHIVE_MARKER = "/archive/"

REQUIRED_SECTION = "## Knowledge System Reconciliation"
ALLOWED_VERDICTS = (
    "RECONCILED_VERIFIED",
    "RECONCILED_WITH_DECLARED_GAPS",
    "PARTIAL",
    "BLOCKED",
    "STALE_MAP",
)
REQUIRED_SECTION_FIELDS = (
    "Knowledge task class:",
    "Source manifest:",
    "Source manifest hash:",
    "Enumeration safety:",
    "Intake registry or ledger:",
    "Authority assets:",
    "Derived views:",
    "Semantic region ledger:",
    "Region reconciliation:",
    "Orphan or unmapped assets:",
    "Cross-region links:",
    "Drift check:",
    "Rebuildability check:",
    "Retrieval boundary:",
    "Adversarial verification:",
    "Knowledge-map verdict:",
)
MAP_CLAIM_PATTERNS = (
    r"\bknowledge[- ]map (?:is )?(?:complete|current|reconciled|verified)\b",
    r"\bsemantic[- ]region map (?:is )?(?:complete|current|reconciled|verified)\b",
    r"\bretrieval[- ]readiness (?:is )?(?:complete|verified|proven)\b",
)
APPLICABLE_PREFIXES = (
    "docs/audits/",
    "docs/reviews/",
    "docs/assessments/",
    "docs/logs/",
    "docs/reports/",
    "docs/baselines/",
    "docs/roadmaps/",
    "docs/work_orders/",
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
        if status.startswith(("R", "C")):
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
    return (REPO_ROOT / path).read_text(encoding="utf-8", errors="replace")


def _add(violations: list[dict[str, str]], path: str, issue_type: str, message: str) -> None:
    violations.append({"path": path, "type": issue_type, "message": message})


def _extract_section(text: str, header: str) -> str:
    marker = f"{header}\n"
    start = text.find(marker)
    if start == -1:
        return ""
    section_start = start + len(marker)
    next_header = text.find("\n## ", section_start)
    return text[section_start:] if next_header == -1 else text[section_start:next_header]


def _field_value(section: str, label: str) -> str:
    match = re.search(rf"^\s*-\s*{re.escape(label)}\s*(.+?)\s*$", section, re.I | re.M)
    return match.group(1).strip() if match else ""


def _is_none_like(value: str) -> bool:
    return value.strip().lower() in {"none", "none.", "n/a", "n/a.", "0"}


def _is_safe_enumeration(value: str) -> bool:
    lowered = value.lower()
    if "rg --files" in lowered:
        return "--hidden" in lowered and "--no-ignore" in lowered
    if any(marker in lowered for marker in ("get-childitem", "filesystem", "structured complete api")):
        return True
    return bool(re.search(r"(?:^|[;&|]\s*)find\s+(?:[/.\-~]|[A-Za-z]:\\)", value, re.I))


def _extract_counts(section: str) -> tuple[int, int, int, int] | None:
    match = re.search(
        r"assets=(\d+);\s*mapped=(\d+);\s*deferred=(\d+);\s*unmapped=(\d+)",
        section,
        re.I,
    )
    return tuple(int(value) for value in match.groups()) if match else None


def _extract_verdict(section: str) -> str | None:
    match = re.search(r"^\s*-\s*Knowledge-map verdict:\s*([A-Z_]+)\s*$", section, re.M)
    return match.group(1) if match else None


def _is_applicable_output(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized.endswith(".md") or ARCHIVE_MARKER in normalized:
        return False
    if normalized in {METHOD_PATH, STANDARD_PATH, GUARD_PATH, GC018_TEMPLATE_PATH, WORK_ORDER_TEMPLATE_PATH}:
        return False
    if not any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES):
        return False
    return REQUIRED_SECTION in text or any(re.search(pattern, text, re.I) for pattern in MAP_CLAIM_PATTERNS)


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    for marker in (
        "Status: canonical and machine-enforced knowledge-map reconciliation standard",
        "## Enumeration Safety",
        "## Required Gates",
        "## Required Evidence Block",
        "RECONCILED_VERIFIED",
        "RECONCILED_WITH_DECLARED_GAPS",
        "STALE_MAP",
        THIS_SCRIPT_PATH,
    ):
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    if has_binding_marker(path, THIS_SCRIPT_PATH, text):
        return []
    return [{"path": path, "type": "binding_missing", "message": f"must cite `{THIS_SCRIPT_PATH}`"}]


def _validate_output(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable_output(path, text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(violations, path, "knowledge_reconciliation_section_missing", f"knowledge-map claim must include `{REQUIRED_SECTION}`")
        return violations

    section = _extract_section(text, REQUIRED_SECTION)
    for field in REQUIRED_SECTION_FIELDS:
        if field not in section:
            _add(violations, path, "knowledge_reconciliation_field_missing", f"missing field `{field}`")

    verdict = _extract_verdict(section)
    if verdict not in ALLOWED_VERDICTS:
        _add(violations, path, "knowledge_map_verdict_invalid", "missing or invalid knowledge-map verdict")
        return violations

    enumeration = _field_value(section, "Enumeration safety:")
    if not _is_safe_enumeration(enumeration):
        _add(violations, path, "unsafe_enumeration", "enumeration must use filesystem-backed evidence or `rg --files --hidden --no-ignore`")

    counts = _extract_counts(section)
    if counts is None:
        _add(violations, path, "region_reconciliation_missing", "region reconciliation must state numeric assets, mapped, deferred, and unmapped counts")
    else:
        assets, mapped, deferred, unmapped = counts
        if assets != mapped + deferred + unmapped:
            _add(violations, path, "region_reconciliation_mismatch", "assets must equal mapped + deferred + unmapped")
        if verdict == "RECONCILED_VERIFIED" and (deferred != 0 or unmapped != 0):
            _add(violations, path, "verified_map_has_gaps", "RECONCILED_VERIFIED requires deferred=0 and unmapped=0")
        if verdict == "RECONCILED_WITH_DECLARED_GAPS" and unmapped != 0:
            _add(violations, path, "bounded_map_has_unmapped_assets", "RECONCILED_WITH_DECLARED_GAPS requires unmapped=0")

    drift = _field_value(section, "Drift check:")
    if verdict in {"RECONCILED_VERIFIED", "RECONCILED_WITH_DECLARED_GAPS"} and drift.upper() != "PASS":
        _add(violations, path, "reconciled_map_without_current_drift_check", f"{verdict} requires drift check PASS")

    orphans = _field_value(section, "Orphan or unmapped assets:")
    if verdict in {"RECONCILED_VERIFIED", "RECONCILED_WITH_DECLARED_GAPS"} and orphans and not _is_none_like(orphans):
        _add(violations, path, "reconciled_map_has_orphans", f"{verdict} cannot retain orphan or unmapped assets")

    for label in ("Authority assets:", "Derived views:", "Semantic region ledger:", "Rebuildability check:", "Retrieval boundary:"):
        if not _field_value(section, label):
            _add(violations, path, "knowledge_reconciliation_value_missing", f"`{label}` requires a visible value")

    lowered = section.lower()
    if any(token in lowered for token in ("<path", "<hash", "<n>", "<source", "todo", "tbd")):
        _add(violations, path, "placeholder_residue", "knowledge reconciliation block contains placeholder residue")
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH, WORKFLOW_PATH, AGENTS_PATH, CLAUDE_PATH, GC018_TEMPLATE_PATH, WORK_ORDER_TEMPLATE_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_output(path, text))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    required_paths = (
        METHOD_PATH, STANDARD_PATH, GUARD_PATH, AUTORUN_PATH, HOOK_CHAIN_PATH,
        WORKFLOW_PATH, AGENTS_PATH, CLAUDE_PATH, GC018_TEMPLATE_PATH, WORK_ORDER_TEMPLATE_PATH,
    )
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
    print("=== CVF Corpus-To-Knowledge-Map Reconciliation Gate ===")
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
    print("\nCOMPLIANT - knowledge-map evidence is aligned." if report["compliant"] else "\nVIOLATION - knowledge-map evidence is incomplete or misaligned.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate corpus-to-knowledge-map reconciliation evidence")
    parser.add_argument("--base", default=None, help="Optional git base ref")
    parser.add_argument("--head", default=None, help="Optional git head ref")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero when violations exist")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()
    try:
        base, head, range_source = _resolve_range(args.base, args.head)
        report = _classify(_merge_changed_maps(_get_changed_name_status(base, head), _get_worktree_name_status()))
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    report["timestamp"] = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    report["range"] = {"base": base, "head": head, "source": range_source}
    print(json.dumps(report, indent=2, ensure_ascii=False)) if args.json else _print_report(report, base, head, range_source)
    return 2 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
