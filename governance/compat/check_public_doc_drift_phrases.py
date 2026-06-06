#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_PUBLIC_DOC_PATHS = [
    "AGENTS.md",
    "AGENT_HANDOFF.md",
    "ARCHITECTURE.md",
    "CONTRIBUTING.md",
    "COST_AND_QUOTA.md",
    "GOVERNANCE.md",
    "PROVIDERS.md",
    "README.md",
    "SECURITY.md",
    "docs/GET_STARTED.md",
    "docs/START_WITH_CVF.md",
    "docs/CVF_CORE_KNOWLEDGE_BASE.md",
    "docs/concepts/skill-system.md",
    "docs/guides/CVF_QUICK_ORIENTATION.md",
    "docs/guides/POST_MC5_ORIENTATION.md",
    "docs/guides/external-agent-review-guide.md",
    "docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md",
    "docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md",
    "docs/reference/CVF_POSITIONING.md",
    "docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md",
    "docs/reference/CVF_WEB_TOOLKIT_GUIDE.md",
]

REQUIRED_PUBLIC_ROOT_FILES = [
    "README.md",
    "ARCHITECTURE.md",
    "GOVERNANCE.md",
    "SECURITY.md",
    "PROVIDERS.md",
    "COST_AND_QUOTA.md",
    "docs/GET_STARTED.md",
    "docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md",
    "docs/guides/external-agent-review-guide.md",
]

FORBIDDEN_PATTERNS = [
    {
        "id": "raw_memory_class_marker",
        "pattern": re.compile(r"^Memory class\s*:", re.MULTILINE),
        "message": "Public-facing docs must not expose raw internal Memory class markers.",
    },
    {
        "id": "stale_release_date",
        "pattern": re.compile(r"March 20, 2026"),
        "message": "March 20, 2026 release footer/date is stale for current public docs.",
    },
    {
        "id": "stale_version_1_6_0",
        "pattern": re.compile(r"Version:\s*1\.6\.0\b"),
        "message": "Version: 1.6.0 is stale; public docs must use the current version or a source pointer.",
    },
    {
        "id": "stale_skill_count_131",
        "pattern": re.compile(r"\b131\s+active\s+skills\b", re.IGNORECASE),
        "message": "131 active skills is stale; use the current source-backed count or a stable pointer.",
    },
    {
        "id": "stale_skill_count_141",
        "pattern": re.compile(r"\b141\s+reusable\s+skills\b", re.IGNORECASE),
        "message": "141 reusable skills is stale; use the current source-backed count or a stable pointer.",
    },
    {
        "id": "stale_skill_count_124",
        "pattern": re.compile(r"\b124\s+skills(?:\s+browser)?\b", re.IGNORECASE),
        "message": "124 skills is stale; use the current source-backed count or a stable pointer.",
    },
    {
        "id": "placeholder_security_contact",
        "pattern": re.compile(r"operator-defined private security channel", re.IGNORECASE),
        "message": "Security disclosure contact is still placeholder text.",
    },
    {
        "id": "handoff_label_public_surface",
        "pattern": re.compile(r"\[Agent Handoff\]", re.IGNORECASE),
        "message": "Public-facing docs must not label continuation pointers as Agent Handoff.",
    },
]


def _line_col(text: str, offset: int) -> tuple[int, int]:
    line = text.count("\n", 0, offset) + 1
    last_newline = text.rfind("\n", 0, offset)
    col = offset + 1 if last_newline == -1 else offset - last_newline
    return line, col


def _scan_text(rel_path: str, text: str) -> list[dict[str, object]]:
    violations: list[dict[str, object]] = []
    for rule in FORBIDDEN_PATTERNS:
        pattern = rule["pattern"]
        assert isinstance(pattern, re.Pattern)
        for match in pattern.finditer(text):
            line, col = _line_col(text, match.start())
            violations.append(
                {
                    "path": rel_path,
                    "line": line,
                    "column": col,
                    "type": rule["id"],
                    "match": match.group(0),
                    "message": rule["message"],
                }
            )
    return violations


def _classify(paths: list[str] | None = None) -> dict[str, object]:
    scan_paths = paths or DEFAULT_PUBLIC_DOC_PATHS
    required_paths = REQUIRED_PUBLIC_ROOT_FILES if paths is None else []
    violations: list[dict[str, object]] = []
    scanned: list[str] = []
    missing: list[str] = []
    missing_required: list[str] = []

    for rel_path in scan_paths:
        normalized = rel_path.replace("\\", "/")
        path = REPO_ROOT / normalized
        if not path.exists():
            if normalized in required_paths:
                missing_required.append(normalized)
                violations.append(
                    {
                        "path": normalized,
                        "line": 0,
                        "column": 0,
                        "type": "missing_required_public_doc",
                        "match": "",
                        "message": "Required public front-door documentation file is missing.",
                    }
                )
            else:
                missing.append(normalized)
            continue
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        scanned.append(normalized)
        violations.extend(_scan_text(normalized, text))

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "scannedPaths": scanned,
        "missingPaths": missing,
        "missingRequiredPaths": missing_required,
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict[str, object]) -> None:
    print("=== CVF Public Doc Drift Phrase Gate ===")
    print(f"Scanned paths: {len(report['scannedPaths'])}")
    if report["missingRequiredPaths"]:
        print(f"Missing required paths: {len(report['missingRequiredPaths'])}")
    if report["missingPaths"]:
        print(f"Missing optional paths: {len(report['missingPaths'])}")
    print(f"Violations: {report['violationCount']}")

    violations = report["violations"]
    if violations:
        print("\nViolations:")
        for violation in violations:
            print(
                f"  - [{violation['type']}] {violation['path']}:{violation['line']}: "
                f"{violation['message']} (matched `{violation['match']}`)"
            )
    else:
        print("\nCOMPLIANT - no known stale public-doc drift phrases found.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check public-facing docs for known stale drift phrases")
    parser.add_argument("--base", help="Accepted for autorun/hook compatibility; not used by this scan.")
    parser.add_argument("--head", help="Accepted for autorun/hook compatibility; not used by this scan.")
    parser.add_argument("--paths", nargs="*", help="Optional explicit paths to scan instead of the default public-doc set.")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = _classify(args.paths)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
