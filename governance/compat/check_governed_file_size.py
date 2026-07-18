#!/usr/bin/env python3
"""
CVF governed file size guard.

Keeps governed files reviewable by enforcing class-specific line-count
thresholds with an explicit exception registry for legacy debt.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY = REPO_ROOT / "governance" / "compat" / "CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json"
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md"
EXCLUDED_PREFIXES = (
    "docs/logs/",
    "docs/reviews/cvf_phase_governance/logs/",
    "governance/compat/",
    "scripts/",
)
EXCLUDED_EXACT = {
    "docs/CVF_INCREMENTAL_TEST_LOG.md",
}
CODE_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
MARKDOWN_EXTENSIONS = {".md"}
DEFAULT_NEAR_HARD_MARGIN_LINES = 25
DEFAULT_MIN_SHRINK_LINES = 50
DEFAULT_MAX_COMPRESSED_STATEMENT_LINES = 0
STATEMENT_KEYWORD_RE = re.compile(r"\b(const|let|var|import|export|return|if|for|while|switch|try|catch)\b")


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def _compressed_statement_lines(path: Path) -> list[dict[str, Any]]:
    compressed: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line or line.startswith("//") or line.startswith("*"):
                continue
            statement_semicolons = line.count(";")
            keyword_count = len(STATEMENT_KEYWORD_RE.findall(line))
            import_count = len(re.findall(r"\bimport\b", line))
            variable_decl_count = len(re.findall(r"\b(const|let|var)\b", line))
            if statement_semicolons >= 2 or import_count >= 2 or variable_decl_count >= 2 or keyword_count >= 4:
                compressed.append(
                    {
                        "line": line_number,
                        "statementSemicolons": statement_semicolons,
                        "keywordCount": keyword_count,
                        "snippet": line[:160],
                    }
                )
    return compressed


def _git_files(args: list[str]) -> list[str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


def _git_output(args: list[str]) -> str:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    return proc.stdout


def _parse_name_status(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        if len(parts) < 2:
            continue
        status = parts[0].strip()
        path = parts[2] if (status.startswith("R") or status.startswith("C")) and len(parts) > 2 else parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _worktree_changed_files() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        try:
            parsed = _parse_name_status(_git_output(args))
        except subprocess.CalledProcessError:
            parsed = {}
        for path, statuses in parsed.items():
            changed.setdefault(path, set()).update(statuses)

    try:
        untracked = _git_files(["ls-files", "--others", "--exclude-standard"])
    except subprocess.CalledProcessError:
        untracked = []
    for path in untracked:
        normalized = path.replace("\\", "/").strip()
        if normalized:
            changed.setdefault(normalized, set()).add("A")
    return changed


def _head_line_count(rel_path: str) -> int | None:
    proc = subprocess.run(
        ["git", "show", f"HEAD:{rel_path}"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return None
    if proc.stdout == "":
        return 0
    return proc.stdout.count("\n") + (0 if proc.stdout.endswith("\n") else 1)


def _iter_candidate_files() -> list[Path]:
    tracked = set(_git_files(["ls-files"]))
    untracked = set(_git_files(["ls-files", "--others", "--exclude-standard"]))
    files: list[Path] = []
    for rel_path in sorted(tracked | untracked):
        path = REPO_ROOT / rel_path
        if path.is_file():
            files.append(path)
    return files


def _is_excluded(rel_path: str) -> bool:
    if rel_path in EXCLUDED_EXACT:
        return True
    if any(rel_path.startswith(prefix) for prefix in EXCLUDED_PREFIXES):
        return True
    if "/archive/" in rel_path:
        return True
    return False


def _classify(rel_path: str) -> str | None:
    if _is_excluded(rel_path):
        return None

    suffix = Path(rel_path).suffix.lower()
    lower = rel_path.lower()

    if suffix in MARKDOWN_EXTENSIONS:
        return "active_markdown"

    if suffix not in CODE_EXTENSIONS:
        return None

    if ".test." in lower or "/tests/" in lower:
        return "test_code"

    if suffix in {".tsx", ".jsx"}:
        return "frontend_component"

    return "general_source"


def _same_maintainability_domain(path_a: str, path_b: str) -> bool:
    if path_a == "CVF_SESSION_MEMORY.md":
        return path_b.startswith("CVF_SESSION/handoffs/archive/")
    if path_a.startswith("AGENT_HANDOFF") and path_b.startswith("AGENT_HANDOFF"):
        return True
    parent_a = str(Path(path_a).parent).replace("\\", "/")
    parent_b = str(Path(path_b).parent).replace("\\", "/")
    if parent_a == ".":
        return parent_b == "."
    if parent_a == parent_b:
        return True
    return False


def _is_rotation_evidence(path_a: str, path_b: str, file_class: str) -> bool:
    if not _same_maintainability_domain(path_a, path_b):
        return False
    if path_a == "CVF_SESSION_MEMORY.md" and path_b.startswith("CVF_SESSION/handoffs/archive/"):
        return True
    return _classify(path_b) == file_class


def _is_code_path(rel_path: str) -> bool:
    return Path(rel_path).suffix.lower() in CODE_EXTENSIONS


def _matches_domain_prefix(rel_path: str, prefixes: list[str]) -> bool:
    normalized = rel_path.replace("\\", "/")
    return any(normalized.startswith(prefix.replace("\\", "/")) for prefix in prefixes)


def _is_owner_domain_change(rel_path: str, owner: dict[str, Any], prefixes: list[str]) -> bool:
    if not _matches_domain_prefix(rel_path, prefixes):
        return False

    allowed_classes = [
        str(file_class).strip()
        for file_class in owner.get("domainFileClasses", [])
        if str(file_class).strip()
    ]
    if allowed_classes:
        return _classify(rel_path) in set(allowed_classes)

    return _is_code_path(rel_path)


def build_report(registry_path: Path) -> dict[str, Any]:
    if not registry_path.exists():
        return {
            "registryPath": str(registry_path),
            "violationCount": 1,
            "advisoryCount": 0,
            "violations": [
                {
                    "type": "registry_missing",
                    "path": str(registry_path),
                    "message": "Governed file size exception registry is missing.",
                }
            ],
            "advisories": [],
            "compliant": False,
        }

    registry = _read_json(registry_path)
    thresholds = registry.get("thresholds", {})
    exception_map = {
        entry["path"]: entry
        for entry in registry.get("exceptions", [])
        if isinstance(entry, dict) and entry.get("path")
    }

    violations: list[dict[str, Any]] = []
    advisories: list[dict[str, Any]] = []
    files_report: list[dict[str, Any]] = []
    changed_files = _worktree_changed_files()
    added_files = {
        path for path, statuses in changed_files.items()
        if any(status == "A" or status.startswith("R") or status.startswith("C") for status in statuses)
    }
    near_hard_margin = int(registry.get("nearHardRotationMarginLines", DEFAULT_NEAR_HARD_MARGIN_LINES))
    min_shrink_lines = int(registry.get("nearHardMinShrinkLines", DEFAULT_MIN_SHRINK_LINES))
    max_compressed_statement_lines = int(
        registry.get("nearHardMaxCompressedStatementLines", DEFAULT_MAX_COMPRESSED_STATEMENT_LINES)
    )
    proactive_owner_surfaces = registry.get("proactiveOwnerSurfaces", [])

    for path in _iter_candidate_files():
        rel_path = _rel(path)
        file_class = _classify(rel_path)
        if not file_class:
            continue

        threshold = thresholds.get(file_class, {})
        soft = int(threshold.get("softThresholdLines", 0) or 0)
        hard = int(threshold.get("hardThresholdLines", 0) or 0)
        lines = _count_lines(path)
        exception = exception_map.get(rel_path)
        status = "ok"

        exception_active = bool(exception and exception.get("status") == "ACTIVE_EXCEPTION")

        if exception:
            missing_fields = [
                field
                for field in ("fileClass", "approvedMaxLines", "status", "rationale", "requiredFollowup")
                if not exception.get(field)
            ]
            if missing_fields:
                violations.append(
                    {
                        "type": "exception_entry_incomplete",
                        "path": rel_path,
                        "message": f"Exception entry is missing required fields: {', '.join(missing_fields)}.",
                    }
                )
                status = "violation"
            elif exception.get("fileClass") != file_class:
                violations.append(
                    {
                        "type": "exception_class_mismatch",
                        "path": rel_path,
                        "message": (
                            f"Exception class `{exception.get('fileClass')}` does not match detected class `{file_class}`."
                        ),
                    }
                )
                status = "violation"
            elif exception_active:
                approved_max = int(exception.get("approvedMaxLines", 0) or 0)
                if lines > approved_max:
                    violations.append(
                        {
                            "type": "exception_approved_max_exceeded",
                            "path": rel_path,
                            "message": f"File has {lines} lines, exceeding approved exception maximum {approved_max}.",
                        }
                    )
                    status = "violation"
                else:
                    status = "exception"
        if not exception_active:
            if hard and lines > hard:
                violations.append(
                    {
                        "type": "hard_threshold_exceeded_without_exception",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding hard threshold {hard} for class `{file_class}` without an approved exception."
                        ),
                    }
                )
                status = "violation"
            elif hard and rel_path in changed_files and lines >= max(1, hard - near_hard_margin):
                previous_lines = _head_line_count(rel_path)
                shrink = (previous_lines - lines) if previous_lines is not None else 0
                has_rotation_file = any(_is_rotation_evidence(rel_path, added, file_class) for added in added_files)
                compressed_lines = _compressed_statement_lines(path) if path.suffix.lower() in CODE_EXTENSIONS else []
                if len(compressed_lines) > max_compressed_statement_lines:
                    preview = ", ".join(str(item["line"]) for item in compressed_lines[:5])
                    violations.append(
                        {
                            "type": "near_hard_statement_compression",
                            "path": rel_path,
                            "message": (
                                f"File has {lines} lines and is within {near_hard_margin} lines of hard threshold {hard}, "
                                f"but contains {len(compressed_lines)} compressed multi-statement line(s) at line(s): {preview}. "
                                "Near-threshold governed code must rotate/split or expand maintainably; line-count compliance "
                                "must not be achieved by packing multiple statements onto one physical line."
                            ),
                        }
                    )
                    status = "violation"
                    files_report.append(
                        {
                            "path": rel_path,
                            "fileClass": file_class,
                            "lines": lines,
                            "status": status,
                            "softThresholdLines": soft,
                            "hardThresholdLines": hard,
                        }
                    )
                    continue
                if shrink < min_shrink_lines and not has_rotation_file:
                    violations.append(
                        {
                            "type": "near_hard_threshold_touched_without_rotation",
                            "path": rel_path,
                            "message": (
                                f"File has {lines} lines and is within {near_hard_margin} lines of hard threshold {hard}. "
                                "Touched near-threshold governed files must be rotated/split into a new file in the same "
                                f"maintainability domain or shrink by at least {min_shrink_lines} lines."
                            ),
                        }
                    )
                    status = "violation"
                else:
                    advisories.append(
                        {
                            "type": "near_hard_threshold_rotation_evidence",
                            "path": rel_path,
                            "message": (
                                f"File has {lines} lines near hard threshold {hard}, but rotation/split evidence or "
                                f"meaningful shrink ({shrink} lines) is present."
                            ),
                        }
                    )
                    status = "advisory"
            elif soft and lines > soft:
                advisories.append(
                    {
                        "type": "soft_threshold_exceeded",
                        "path": rel_path,
                        "message": (
                            f"File has {lines} lines, exceeding advisory threshold {soft} for class `{file_class}`."
                        ),
                    }
                )
                status = "advisory"

        files_report.append(
            {
                "path": rel_path,
                "fileClass": file_class,
                "lines": lines,
                "status": status,
                "softThresholdLines": soft,
                "hardThresholdLines": hard,
            }
        )

    for owner in proactive_owner_surfaces:
        if not isinstance(owner, dict) or owner.get("status") != "ACTIVE":
            continue
        owner_path = str(owner.get("path", "")).replace("\\", "/").strip()
        prefixes = [
            str(prefix).replace("\\", "/").strip()
            for prefix in owner.get("domainPrefixes", [])
            if str(prefix).strip()
        ]
        full_owner_path = REPO_ROOT / owner_path
        owner_class = _classify(owner_path)
        if not owner_path or not prefixes or not full_owner_path.exists() or not owner_class:
            violations.append(
                {
                    "type": "proactive_owner_surface_registry_invalid",
                    "path": owner_path or "<missing-owner-path>",
                    "message": "Proactive owner surface registry entry must cite an existing governed owner path and at least one domain prefix.",
                }
            )
            continue
        threshold = thresholds.get(owner_class, {})
        hard = int(threshold.get("hardThresholdLines", 0) or 0)
        owner_lines = _count_lines(full_owner_path)
        if not hard or owner_lines < max(1, hard - near_hard_margin):
            continue
        adjacent_changes = sorted(
            path
            for path in changed_files
            if path != owner_path and _is_owner_domain_change(path, owner, prefixes)
        )
        if adjacent_changes and owner_path not in changed_files:
            sample = ", ".join(adjacent_changes[:5])
            suffix = "" if len(adjacent_changes) <= 5 else f", ... (+{len(adjacent_changes) - 5} more)"
            violations.append(
                {
                    "type": "near_hard_owner_surface_adjacent_change_without_rotation",
                    "path": owner_path,
                    "message": (
                        f"Owner surface has {owner_lines} lines and is within {near_hard_margin} lines of hard threshold {hard}. "
                        "Adjacent source changes in the same registered owner domain require this owner entrypoint to be "
                        "split/rotated or meaningfully shrunk in the same batch. Adjacent change(s): "
                        f"{sample}{suffix}."
                    ),
                }
            )

    return {
        "policyPath": POLICY_PATH,
        "registryPath": _rel(registry_path),
        "fileCount": len(files_report),
        "violationCount": len(violations),
        "advisoryCount": len(advisories),
        "files": files_report,
        "violations": violations,
        "advisories": advisories,
        "changedFileCount": len(changed_files),
        "nearHardRotationMarginLines": near_hard_margin,
        "nearHardMinShrinkLines": min_shrink_lines,
        "nearHardMaxCompressedStatementLines": max_compressed_statement_lines,
        "proactiveOwnerSurfaceCount": len(proactive_owner_surfaces),
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Governed File Size Guard ===")
    print(f"Registry: {report['registryPath']}")
    print(f"Policy: {report['policyPath']}")
    print(f"Governed files checked: {report.get('fileCount', 0)}")
    print(f"Violations: {report['violationCount']}")
    print(f"Advisories: {report['advisoryCount']}")
    print("")
    print("Top governed files by line count:")
    for item in sorted(report.get("files", []), key=lambda row: row["lines"], reverse=True)[:10]:
        print(
            f"  - {item['path']}: {item['lines']} lines "
            f"[{item['fileClass']}, {item['status']}]"
        )

    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - {violation['path']} ({violation['type']}): {violation['message']}")
        print("\nFAIL - Governed file size policy is violated.")
        return

    if report["advisories"]:
        print("\nAdvisories:")
        for advisory in report["advisories"][:20]:
            print(f"  - {advisory['path']} ({advisory['type']}): {advisory['message']}")

    print("\nCOMPLIANT — Governed file size is within the active policy.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="CVF governed file size guard")
    parser.add_argument("--registry", default=str(DEFAULT_REGISTRY), help="Exception registry path")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violation")
    args = parser.parse_args()

    registry_path = (REPO_ROOT / args.registry).resolve() if not Path(args.registry).is_absolute() else Path(args.registry)
    report = build_report(registry_path)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
