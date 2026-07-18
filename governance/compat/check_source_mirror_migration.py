#!/usr/bin/env python3
"""
CVF Source Mirror Migration Guard.

Changed governed external-absorption artifacts that cite the legacy
`.private_reference/external_repos/` source family must carry an explicit
source-mirror migration control block. This is forward-only and does not reopen
historical artifacts outside the changed set.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

STANDARD_PATH = "docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md"
MIRROR_INDEX_PATH = ".private_reference/source_mirrors/INDEX.md"
THIS_SCRIPT_PATH = "governance/compat/check_source_mirror_migration.py"

LEGACY_SOURCE_MARKER = ".private_reference/external_repos/"
SOURCE_MIRROR_MARKER = ".private_reference/source_mirrors/"
REQUIRED_SECTION = "## Source Mirror Migration Control"
ARCHIVE_MARKER = "/archive/"

GOVERNED_PREFIXES = (
    "docs/audits/",
    "docs/baselines/",
    "docs/reference/external_agent_review/",
    "docs/reviews/",
    "docs/roadmaps/",
    "docs/work_orders/",
)

REQUIRED_FIELDS = (
    "Legacy source path",
    "Source mirror path",
    "Mirror index row",
    "Pinned upstream commit",
    "Migration disposition",
    "Legacy cleanup disposition",
    "Claim boundary",
)

ALLOWED_DISPOSITIONS = (
    "MIGRATED_TO_SOURCE_MIRROR",
    "LEGACY_REFERENCE_ONLY_WITH_REASON",
    "BLOCKED_SOURCE_MIRROR_WITH_REASON",
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
    code, out, _ = _run_git(["rev-list", "--max-parents=0", head])
    if code == 0 and out:
        return out.splitlines()[0], "root-commit"
    return "HEAD", "fallback:HEAD"


def _changed_paths(base: str, head: str) -> list[str]:
    code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        return []
    return [line.strip().replace("\\", "/") for line in out.splitlines() if line.strip()]


def _worktree_changed_paths() -> list[str]:
    paths: set[str] = set()
    for args in (["diff", "--name-only"], ["diff", "--name-only", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0:
            paths.update(line.strip().replace("\\", "/") for line in out.splitlines() if line.strip())
    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0:
        paths.update(line.strip().replace("\\", "/") for line in out.splitlines() if line.strip())
    return sorted(paths)


def _is_active_governed_markdown(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if ARCHIVE_MARKER in normalized:
        return False
    return normalized.endswith(".md") and normalized.startswith(GOVERNED_PREFIXES)


def _extract_section(text: str, heading: str) -> str:
    marker = heading + "\n"
    start = text.find(marker)
    if start < 0:
        return ""
    next_heading = re.search(r"\n##\s+", text[start + len(marker) :])
    if not next_heading:
        return text[start:]
    end = start + len(marker) + next_heading.start()
    return text[start:end]


def _parse_table_rows(section: str) -> dict[str, str]:
    rows: dict[str, str] = {}
    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped:
            continue
        cells = [cell.strip().strip("`") for cell in stripped.strip("|").split("|")]
        if len(cells) < 2:
            continue
        if cells[0].lower() == "field":
            continue
        rows[cells[0]] = cells[1]
    return rows


def _check_text(path: str, text: str) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    if LEGACY_SOURCE_MARKER not in text:
        return violations
    if REQUIRED_SECTION not in text:
        return [
            {
                "path": path,
                "type": "source_mirror_migration_block_missing",
                "message": f"changed artifact cites `{LEGACY_SOURCE_MARKER}` and must include `{REQUIRED_SECTION}`",
            }
        ]

    section = _extract_section(text, REQUIRED_SECTION)
    rows = _parse_table_rows(section)
    for field in REQUIRED_FIELDS:
        value = rows.get(field, "")
        if not value:
            violations.append(
                {
                    "path": path,
                    "type": "source_mirror_migration_field_missing",
                    "message": f"source mirror migration block missing `{field}`",
                }
            )

    legacy_path = rows.get("Legacy source path", "")
    mirror_path = rows.get("Source mirror path", "")
    mirror_index = rows.get("Mirror index row", "")
    pinned_commit = rows.get("Pinned upstream commit", "")
    disposition = rows.get("Migration disposition", "")
    claim_boundary = rows.get("Claim boundary", "")

    if legacy_path and LEGACY_SOURCE_MARKER not in legacy_path:
        violations.append(
            {
                "path": path,
                "type": "source_mirror_legacy_path_invalid",
                "message": f"`Legacy source path` must cite `{LEGACY_SOURCE_MARKER}` or a concrete legacy path",
            }
        )
    if mirror_path and not (
        SOURCE_MIRROR_MARKER in mirror_path or "BLOCKED_SOURCE_MIRROR_WITH_REASON" in mirror_path
    ):
        violations.append(
            {
                "path": path,
                "type": "source_mirror_path_invalid",
                "message": f"`Source mirror path` must cite `{SOURCE_MIRROR_MARKER}` or a blocked-with-reason disposition",
            }
        )
    if mirror_index and MIRROR_INDEX_PATH not in mirror_index:
        violations.append(
            {
                "path": path,
                "type": "source_mirror_index_missing",
                "message": f"`Mirror index row` must cite `{MIRROR_INDEX_PATH}`",
            }
        )
    if pinned_commit and not (
        re.fullmatch(r"[0-9a-f]{7,40}", pinned_commit)
        or "BLOCKED_SOURCE_MIRROR_WITH_REASON" in pinned_commit
        or "LEGACY_REFERENCE_ONLY_WITH_REASON" in pinned_commit
    ):
        violations.append(
            {
                "path": path,
                "type": "source_mirror_commit_invalid",
                "message": "`Pinned upstream commit` must be a 7-40 character hex SHA or an explicit blocked/legacy reason",
            }
        )
    if disposition and disposition not in ALLOWED_DISPOSITIONS:
        violations.append(
            {
                "path": path,
                "type": "source_mirror_disposition_invalid",
                "message": f"`Migration disposition` must be one of {', '.join(ALLOWED_DISPOSITIONS)}",
            }
        )
    if claim_boundary and not re.search(r"no (runtime|install|package activation|provider|public|production)", claim_boundary, re.I):
        violations.append(
            {
                "path": path,
                "type": "source_mirror_claim_boundary_weak",
                "message": "`Claim boundary` must explicitly deny runtime/install/package/provider/public/production authority",
            }
        )
    if "<" in section or "TODO" in section or "TBD" in section:
        violations.append(
            {
                "path": path,
                "type": "source_mirror_placeholder_residue",
                "message": "source mirror migration block contains placeholder residue",
            }
        )
    return violations


def run_check(base: str | None = None, head: str = "HEAD") -> tuple[list[dict[str, str]], dict[str, Any]]:
    if base is None:
        base, base_source = _discover_default_base(head)
    else:
        base_source = "explicit:--base"
    paths = sorted(set(_changed_paths(base, head)) | set(_worktree_changed_paths()))
    checked: list[str] = []
    violations: list[dict[str, str]] = []
    for path in paths:
        if not _is_active_governed_markdown(path):
            continue
        if path.replace("\\", "/") == STANDARD_PATH:
            continue
        full = REPO_ROOT / path
        if not full.exists() or full.is_dir():
            continue
        text = full.read_text(encoding="utf-8", errors="replace")
        if LEGACY_SOURCE_MARKER not in text:
            continue
        checked.append(path)
        violations.extend(_check_text(path, text))
    return violations, {
        "base": base,
        "head": head,
        "baseSource": base_source,
        "changedPaths": paths,
        "checkedPaths": checked,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate source-mirror migration discipline")
    parser.add_argument("--base", default=None)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    violations, meta = run_check(args.base, args.head)
    print("=== CVF Source Mirror Migration Guard ===")
    print(f"Range: {meta['base']}..{meta['head']} ({meta['baseSource']})")
    print(f"Checked artifacts: {len(meta['checkedPaths'])}")
    print(f"Violations: {len(violations)}")
    if meta["checkedPaths"]:
        print("\nChecked files:")
        for path in meta["checkedPaths"]:
            print(f"  - {path}")
    if violations:
        print("\nViolations:")
        for item in violations:
            print(f"  - {item['path']}: {item['type']} - {item['message']}")
        print("\nVIOLATION - source-mirror migration evidence is incomplete.")
        return 1 if args.enforce else 0
    print("COMPLIANT - source-mirror migration evidence is aligned.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
