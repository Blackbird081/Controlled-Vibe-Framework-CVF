#!/usr/bin/env python3
"""
CVF MEMCON-T2 Memory Consolidation Artifact Quality Gate

Validates changed active MEMCON memory-consolidation artifacts for:
- missing source-authority fields;
- unresolved relative-date phrases in durable/retrieval-facing sections;
- TIME_AMBIGUOUS_BLOCKED incorrectly promoted as retrieval-eligible or consolidated;
- rawMemoryReleased=true present;
- retrieval-facing sections missing rawMemoryReleased=false;
- operator-visible review packet sections missing conflict, stale/outdated,
  temporal ambiguity, pruning/rejection, or operator action visibility;
- public export disposition missing from changed MEMCON review packets.

Binding standard: docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md
Schema appendix:  docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md
This script:      governance/compat/check_memory_consolidation_artifact_quality.py
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
THIS_SCRIPT_PATH = "governance/compat/check_memory_consolidation_artifact_quality.py"
STANDARD_PATH = "docs/reference/CVF_MEMORY_CONSOLIDATION_WORKFLOW_CHAIN_STANDARD_2026-06-12.md"
SCHEMA_APPENDIX_PATH = "docs/reference/CVF_MEMORY_CONSOLIDATION_SCHEMA_APPENDIX_2026-06-13.md"

DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")
ARCHIVE_MARKER = "/archive/"

APPLICABLE_PREFIXES = (
    "docs/reference/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/baselines/",
    "docs/work_orders/",
)

MEMCON_MARKERS = (
    "MemorySignal",
    "MemoryCandidate",
    "ConsolidatedMemoryRecord",
    "OperatorMemoryReviewPacket",
    "MemoryRetrievalPackInput",
    "MEMCON",
    "memory consolidation",
)

RELATIVE_DATE_PATTERNS: tuple[str, ...] = (
    r"\btoday\b",
    r"\byesterday\b",
    r"\btomorrow\b",
    r"\blast week\b",
    r"\bnext week\b",
    r"\brecently\b",
    r"\bearlier\b",
    r"\bthis month\b",
    r"\blast month\b",
    r"\bnext month\b",
    r"\bthree months ago\b",
    r"\bsix months ago\b",
    r"\ba few days ago\b",
    r"\ba few weeks ago\b",
    r"\bhom nay\b",
    r"\bhom qua\b",
    r"\btuan truoc\b",
    r"\bgan day\b",
    r"\bthang nay\b",
)

SOURCE_AUTHORITY_MARKERS = (
    "sourceAuthority",
    "source-authority",
    "source authority",
    "Source Authority",
    "Source-Authority",
)

RAW_RELEASE_TRUE_PATTERN = re.compile(
    r"rawMemoryReleased\s*[:=]\s*true", re.I
)

TIME_AMBIGUOUS_PROMOTED_PATTERN = re.compile(
    r"TIME_AMBIGUOUS_BLOCKED.*?(retrieval.?eligible|ELIGIBLE|CONSOLIDATED|promoted|retrieval_eligible)",
    re.I | re.S,
)
TIME_AMBIGUOUS_PROMOTED_ALT = re.compile(
    r"(retrieval.?eligible|ELIGIBLE|CONSOLIDATED|promoted)\s*.*?\bTIME_AMBIGUOUS_BLOCKED\b",
    re.I | re.S,
)

RETRIEVAL_BOUNDARY_MARKER = "rawMemoryReleased=false"
RETRIEVAL_FACING_MARKERS = (
    "retrievalBoundary",
    "MemoryRetrievalPackInput",
    "retrievalEligibility",
    "ConsolidatedMemoryRecord",
)

OPERATOR_PACKET_REQUIRED_SECTIONS = (
    "conflictsRequiringDecision",
    "staleOrOutdatedMemories",
    "temporalAmbiguityBlocks",
    "prunedOrRejectedNoise",
    "operatorActionsRequired",
)

OPERATOR_PACKET_ALT_SECTIONS = (
    "Conflicts Requiring Decision",
    "Stale Or Outdated Memories",
    "Temporal Ambiguity Blocks",
    "Pruned Or Rejected Noise",
    "Operator Actions Required",
)

PUBLIC_EXPORT_VALUES = (
    "EXPORTED",
    "DEFERRED_PRIVATE_ONLY",
    "BLOCKED_MISSING_PUBLIC_ARTIFACTS",
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


def _is_active_memcon_markdown(path: str) -> bool:
    if not path.endswith(".md"):
        return False
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    if normalized in {STANDARD_PATH, SCHEMA_APPENDIX_PATH, THIS_SCRIPT_PATH}:
        return False
    return any(normalized.startswith(prefix) for prefix in APPLICABLE_PREFIXES)


def _has_memcon_marker(text: str) -> bool:
    for marker in MEMCON_MARKERS:
        if marker in text:
            return True
    return False


def _is_applicable(path: str, text: str) -> bool:
    return _is_active_memcon_markdown(path) and _has_memcon_marker(text)


def _strip_backtick_spans(text: str) -> str:
    """Replace inline code spans with spaces to avoid false positives on example phrases."""
    return re.sub(r"`[^`\n]+`", lambda m: " " * len(m.group()), text)


def _is_quoted_context(line: str) -> bool:
    stripped = line.lstrip()
    if stripped.startswith(">"):
        return True
    lower = stripped.lower()
    quote_markers = (
        "source quote",
        "source evidence",
        "quoted source",
        "original text",
        "verbatim",
        "evidence quote",
        "evidence:",
        "original claim",
    )
    return any(m in lower for m in quote_markers)


def _line_is_in_quote_block(lines: list[str], idx: int) -> bool:
    line = lines[idx]
    if _is_quoted_context(line):
        return True
    if idx > 0 and _is_quoted_context(lines[idx - 1]):
        return True
    return False


def _check_source_authority(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    has_any = any(m in text for m in SOURCE_AUTHORITY_MARKERS)
    if not has_any:
        _add(
            violations,
            path,
            "memcon_source_authority_missing",
            "MEMCON artifact must include a source-authority field or section "
            "(sourceAuthority / source authority / Source Authority)",
        )
    return violations


def _check_relative_dates(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    lines = text.splitlines()
    for idx, line in enumerate(lines):
        if _line_is_in_quote_block(lines, idx):
            continue
        stripped_line = _strip_backtick_spans(line)
        lower_line = stripped_line.lower()
        for pattern in RELATIVE_DATE_PATTERNS:
            if re.search(pattern, lower_line):
                snippet = line.strip()[:80]
                _add(
                    violations,
                    path,
                    "memcon_unresolved_relative_date",
                    f"durable/retrieval-facing text contains unresolved relative-date phrase "
                    f"(pattern {pattern!r}): {snippet!r}",
                )
                break
    return violations


def _check_time_ambiguous_promotion(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if "TIME_AMBIGUOUS_BLOCKED" not in text:
        return violations
    for para in re.split(r"\n{2,}", text):
        clean_para = _strip_backtick_spans(para)
        if "TIME_AMBIGUOUS_BLOCKED" not in clean_para:
            continue
        if TIME_AMBIGUOUS_PROMOTED_PATTERN.search(clean_para) or TIME_AMBIGUOUS_PROMOTED_ALT.search(clean_para):
            _add(
                violations,
                path,
                "memcon_time_ambiguous_promoted",
                "TIME_AMBIGUOUS_BLOCKED status appears alongside retrieval-eligible or "
                "consolidated promotion language; TIME_AMBIGUOUS_BLOCKED must not be promoted",
            )
            break
    return violations


def _check_raw_memory_released(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    clean_text = _strip_backtick_spans(text)
    if RAW_RELEASE_TRUE_PATTERN.search(clean_text):
        _add(
            violations,
            path,
            "memcon_raw_memory_released_true",
            "rawMemoryReleased=true found; this invariant must always be false",
        )
    return violations


def _check_retrieval_boundary(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    has_retrieval_facing = any(m in text for m in RETRIEVAL_FACING_MARKERS)
    if not has_retrieval_facing:
        return violations
    if RETRIEVAL_BOUNDARY_MARKER not in text:
        _add(
            violations,
            path,
            "memcon_retrieval_boundary_missing",
            "MEMCON artifact has retrieval-facing sections but is missing "
            "rawMemoryReleased=false boundary marker",
        )
    return violations


def _is_review_packet(path: str, text: str) -> bool:
    if "OperatorMemoryReviewPacket" in text:
        return True
    if "packetId" in text and "generatedAtDate" in text:
        return True
    has_multiple = sum(
        1 for s in OPERATOR_PACKET_REQUIRED_SECTIONS if s in text or
        any(alt in text for alt in OPERATOR_PACKET_ALT_SECTIONS)
    )
    if has_multiple >= 3:
        return True
    return False


def _check_operator_packet_sections(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not path.startswith("docs/reviews/"):
        return violations
    if not _is_review_packet(path, text):
        return violations
    for required, alt in zip(OPERATOR_PACKET_REQUIRED_SECTIONS, OPERATOR_PACKET_ALT_SECTIONS):
        if required not in text and alt not in text:
            _add(
                violations,
                path,
                "memcon_operator_packet_section_missing",
                f"MEMCON operator review packet is missing required section: "
                f"{required!r} (or {alt!r})",
            )
    return violations


def _check_public_export_disposition(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not path.startswith("docs/reviews/"):
        return violations
    if "OperatorMemoryReviewPacket" not in text and not _is_review_packet(path, text):
        if "MEMCON" not in text:
            return violations
    if "Public Export Disposition" not in text:
        _add(
            violations,
            path,
            "memcon_public_export_disposition_missing",
            "changed MEMCON review packet is missing a Public Export Disposition section",
        )
        return violations
    has_valid = any(v in text for v in PUBLIC_EXPORT_VALUES)
    if not has_valid:
        _add(
            violations,
            path,
            "memcon_public_export_disposition_invalid",
            "Public Export Disposition section exists but does not contain a valid value "
            "(EXPORTED / DEFERRED_PRIVATE_ONLY / BLOCKED_MISSING_PUBLIC_ARTIFACTS)",
        )
    return violations


def check_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if not _is_applicable(path, text):
        return violations
    violations.extend(_check_source_authority(path, text))
    violations.extend(_check_relative_dates(path, text))
    violations.extend(_check_time_ambiguous_promotion(path, text))
    violations.extend(_check_raw_memory_released(path, text))
    violations.extend(_check_retrieval_boundary(path, text))
    violations.extend(_check_operator_packet_sections(path, text))
    violations.extend(_check_public_export_disposition(path, text))
    return violations


def _validate_path(path: str) -> list[dict[str, str]]:
    full = REPO_ROOT / path
    if not full.exists() or full.is_dir():
        return []
    text = _read_rel(path)
    return check_text(path, text)


def _classify(changed_paths: dict[str, list[str]]) -> dict[str, Any]:
    violations: list[dict[str, str]] = []
    checked: list[str] = []
    for path in sorted(changed_paths):
        statuses = changed_paths[path]
        if all(s.startswith("D") for s in statuses):
            continue
        if not (REPO_ROOT / path).exists():
            continue
        if not _is_active_memcon_markdown(path):
            continue
        full_text = _read_rel(path)
        if not _has_memcon_marker(full_text):
            continue
        checked.append(path)
        violations.extend(check_text(path, full_text))

    return {
        "checkedPaths": checked,
        "changedPaths": dict(changed_paths),
        "violations": violations,
        "violationCount": len(violations),
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any], base: str, head: str, range_source: str) -> None:
    print("=== CVF MEMCON-T2 Memory Consolidation Artifact Quality Gate ===")
    print(f"Range: {base}..{head} ({range_source})")
    print(f"Changed paths: {len(report['changedPaths'])}")
    print(f"Checked paths: {len(report['checkedPaths'])}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for item in report["violations"]:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
    if report["compliant"]:
        print("\nCOMPLIANT - MEMCON artifact quality checks passed.")
    else:
        print("\nVIOLATION - MEMCON artifact quality checks failed.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate MEMCON memory-consolidation artifacts for temporal "
        "ambiguity, source authority, and operator-visible review sections"
    )
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

    report["timestamp"] = (
        dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    )
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
