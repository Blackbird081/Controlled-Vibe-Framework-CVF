#!/usr/bin/env python3
"""
CVF Corpus Completeness And Report Integrity Gate

Requires changed bounded-corpus outputs to carry filesystem-backed inventory,
processing-ledger, reconciliation, drift, traceability, and adversarial-review
evidence before they claim a complete result.
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

STANDARD_PATH = "docs/reference/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_STANDARD_2026-06-01.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_GUARD.md"
THIS_SCRIPT_PATH = "governance/compat/check_corpus_completeness_report_integrity.py"
AUTORUN_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
AGENTS_PATH = "AGENTS.md"
CLAUDE_PATH = "CLAUDE.md"
GC018_TEMPLATE_PATH = "docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md"
ARCHIVE_MARKER = "/archive/"

REQUIRED_SECTION = "## Corpus Completeness And Report Integrity"
ALLOWED_VERDICTS = (
    "COMPLETE_VERIFIED",
    "COMPLETE_WITH_DECLARED_EXCLUSIONS",
    "PARTIAL",
    "BLOCKED",
    "STALE_SNAPSHOT",
    "NOT_APPLICABLE_WITH_REASON",
)
ALLOWED_TERMINAL_STATUSES = (
    "READ",
    "SKIPPED_WITH_REASON",
    "DEFERRED",
    "BLOCKED_UNREADABLE",
)
REQUIRED_SECTION_FIELDS = (
    "Corpus task class:",
    "Corpus root:",
    "Snapshot time:",
    "Enumeration command:",
    "Manifest artifact or inline manifest:",
    "Manifest hash:",
    "Processing ledger artifact or inline ledger:",
    "Allowed terminal statuses:",
    "Reconciliation:",
    "Unresolved files:",
    "Declared exclusions:",
    "Unreadable or unsupported files:",
    "Aggregation check:",
    "Drift check:",
    "Output traceability:",
    "Adversarial verification:",
    "Corpus verdict:",
)
COMPLETE_CLAIM_PATTERNS = (
    r"\ball files (?:were )?(?:read|processed|reviewed|scanned)\b",
    r"\bno files? (?:were )?skipped\b",
    r"\bnone skipped\b",
    r"\bfull(?:y)? file(?:-level)? (?:read|scan|inventory|coverage)\b",
    r"\bcomplete(?:d)? (?:corpus|inventory|scan|coverage)\b",
    r"\bblind-spot verdict:\s*clear\b",
    r"\bblindspot risk verdict:\s*clear\b",
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
    if next_header == -1:
        return text[section_start:]
    return text[section_start:next_header]


def _is_active_markdown(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized.endswith(".md") and ARCHIVE_MARKER not in normalized


def _is_applicable_output(path: str, text: str) -> bool:
    normalized = path.replace("\\", "/")
    if not _is_active_markdown(normalized):
        return False
    if normalized in {STANDARD_PATH, GUARD_PATH, GC018_TEMPLATE_PATH}:
        return False
    if not any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES):
        return False
    if REQUIRED_SECTION in text:
        return True
    lowered = text.lower()
    return any(re.search(pattern, lowered, re.I) for pattern in COMPLETE_CLAIM_PATTERNS)


def _extract_unresolved_count(section: str) -> int | None:
    match = re.search(r"\bunresolved\s*=\s*(\d+)\b", section, re.I)
    if match:
        return int(match.group(1))
    match = re.search(r"^\s*-\s*Unresolved files:\s*(\d+)\s*$", section, re.I | re.M)
    return int(match.group(1)) if match else None


def _extract_verdict(section: str) -> str | None:
    match = re.search(r"^\s*-\s*Corpus verdict:\s*([A-Z_]+)(?:\s+-\s*.+)?\s*$", section, re.M)
    return match.group(1) if match else None


def _extract_verdict_line(section: str) -> str:
    match = re.search(r"^\s*-\s*Corpus verdict:\s*(.+?)\s*$", section, re.M)
    return match.group(1).strip() if match else ""


def _field_value(section: str, label: str) -> str:
    match = re.search(rf"^\s*-\s*{re.escape(label)}\s*(.+?)\s*$", section, re.I | re.M)
    return match.group(1).strip() if match else ""


def _is_none_like(value: str) -> bool:
    return value.strip().lower() in {"none", "n/a", "0", "none.", "n/a."}


def _is_safe_enumeration(value: str) -> bool:
    lowered = value.lower()
    if "rg --files" in lowered:
        return "--hidden" in lowered and "--no-ignore" in lowered
    if any(marker in lowered for marker in ("get-childitem", "filesystem", "structured complete api")):
        return True
    return bool(re.search(r"(?:^|[;&|]\s*)find\s+(?:[/.\-~]|[A-Za-z]:\\)", value, re.I))


def _validate_standard(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    required = (
        "Status: canonical and machine-enforced corpus evidence standard",
        "## Corpus Manifest",
        "## Processing Ledger",
        "## Required Gates",
        "## Required Evidence Block",
        "COMPLETE_VERIFIED",
        "COMPLETE_WITH_DECLARED_EXCLUSIONS",
        "STALE_SNAPSHOT",
        THIS_SCRIPT_PATH,
    )
    for marker in required:
        if marker not in text:
            _add(violations, path, "standard_marker_missing", f"missing marker `{marker}`")
    return violations


def _validate_binding(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not has_binding_marker(path, THIS_SCRIPT_PATH, text):
        _add(violations, path, "binding_missing", f"must cite `{THIS_SCRIPT_PATH}`")
    return violations


def _validate_output(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable_output(path, text):
        return violations
    if REQUIRED_SECTION not in text:
        _add(
            violations,
            path,
            "corpus_integrity_section_missing",
            f"bounded-corpus completeness claim must include `{REQUIRED_SECTION}`",
        )
        return violations

    section = _extract_section(text, REQUIRED_SECTION)
    verdict = _extract_verdict(section)
    verdict_line = _extract_verdict_line(section)
    if verdict == "NOT_APPLICABLE_WITH_REASON":
        if verdict_line == verdict:
            _add(
                violations,
                path,
                "corpus_na_reason_missing",
                "NOT_APPLICABLE_WITH_REASON requires a visible reason on the Corpus verdict line",
            )
        text_without_section = text.replace(section, "")
        lowered_without_section = text_without_section.lower()
        if any(re.search(pattern, lowered_without_section, re.I) for pattern in COMPLETE_CLAIM_PATTERNS):
            _add(
                violations,
                path,
                "corpus_na_with_complete_claim",
                "NOT_APPLICABLE_WITH_REASON cannot accompany a corpus completeness claim outside the N/A block",
            )
        return violations

    for field in REQUIRED_SECTION_FIELDS:
        if field not in section:
            _add(violations, path, "corpus_integrity_field_missing", f"missing field `{field}`")

    for status in ALLOWED_TERMINAL_STATUSES:
        if status not in section:
            _add(violations, path, "terminal_status_vocabulary_missing", f"missing terminal status `{status}`")

    if verdict not in ALLOWED_VERDICTS:
        _add(violations, path, "corpus_verdict_invalid", "missing or invalid corpus verdict")
        return violations

    unresolved = _extract_unresolved_count(section)
    if unresolved is None:
        _add(violations, path, "unresolved_count_missing", "reconciliation must state numeric unresolved count")
    elif verdict in {"COMPLETE_VERIFIED", "COMPLETE_WITH_DECLARED_EXCLUSIONS"} and unresolved != 0:
        _add(violations, path, "complete_verdict_has_unresolved_files", f"{verdict} requires unresolved=0")

    exclusions = _field_value(section, "Declared exclusions:")
    unreadable = _field_value(section, "Unreadable or unsupported files:")
    enumeration = _field_value(section, "Enumeration command:")
    if not _is_safe_enumeration(enumeration):
        _add(
            violations,
            path,
            "unsafe_enumeration",
            "enumeration must use filesystem-backed evidence or `rg --files --hidden --no-ignore`",
        )
    if verdict == "COMPLETE_VERIFIED":
        if exclusions and not _is_none_like(exclusions):
            _add(violations, path, "complete_verified_has_exclusions", "COMPLETE_VERIFIED cannot retain declared exclusions")
        if unreadable and not _is_none_like(unreadable):
            _add(violations, path, "complete_verified_has_unreadable_files", "COMPLETE_VERIFIED cannot retain unreadable or unsupported files")
    if verdict == "COMPLETE_WITH_DECLARED_EXCLUSIONS" and (not exclusions or _is_none_like(exclusions)):
        _add(violations, path, "declared_exclusions_missing", "COMPLETE_WITH_DECLARED_EXCLUSIONS requires visible exclusions")

    reconciliation = _field_value(section, "Reconciliation:")
    for marker in ("manifest=", "ledger_terminal=", "exclusions=", "unresolved="):
        if marker not in reconciliation:
            _add(violations, path, "reconciliation_field_missing", f"reconciliation must include `{marker}`")

    lowered = section.lower()
    if any(token in lowered for token in ("<path", "<timestamp", "<exact", "<hash", "<n>", "todo", "tbd")):
        _add(violations, path, "placeholder_residue", "corpus integrity block contains placeholder residue")
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    violations: list[dict[str, str]] = []
    if path == STANDARD_PATH:
        violations.extend(_validate_standard(path, text))
    if path in {AUTORUN_PATH, HOOK_CHAIN_PATH, WORKFLOW_PATH, AGENTS_PATH, CLAUDE_PATH, GC018_TEMPLATE_PATH}:
        violations.extend(_validate_binding(path, text))
    violations.extend(_validate_output(path, text))
    return violations


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    required_paths = (
        STANDARD_PATH,
        GUARD_PATH,
        AUTORUN_PATH,
        HOOK_CHAIN_PATH,
        WORKFLOW_PATH,
        AGENTS_PATH,
        CLAUDE_PATH,
        GC018_TEMPLATE_PATH,
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
    print("=== CVF Corpus Completeness And Report Integrity Gate ===")
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
        print("\nCOMPLIANT - corpus completeness and report integrity evidence is aligned.")
    else:
        print("\nVIOLATION - bounded-corpus evidence is incomplete or misaligned.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate bounded-corpus evidence and report integrity")
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
