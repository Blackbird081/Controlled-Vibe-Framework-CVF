#!/usr/bin/env python3
"""
CVF Anti-Collusion Evidence Trace Gate (GC-046 Phase 0.C)

Reports review packets under docs/reviews/ and .private_reference/ that are
missing Evidence Trace Blocks as required by GC-046 Rule 1.

Phase 0.B (advisory): always exits 0, reports all missing packets.
Phase 0.C (hard-fail, --enforce): exits non-zero when a file ADDED in the
  current commit diff is a review packet missing an Evidence Trace Block.
  Legacy packets (added before GC-046 on 2026-05-17) are grandfathered —
  they appear as advisory warnings but never block a commit.

GC-046: governance/toolkit/05_OPERATION/CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md
GC-018: docs/baselines/CVF_GC018_PHASE_0C_ANTI_COLLUSION_HARD_FAIL_2026-05-18.md

Evidence Trace Block markers (any one satisfies the check for that packet):
  - "Evidence Trace Block"
  - "Evidence Trace:"
  - "exact command"
  - "exact query"

Review packet scope: .md files whose names contain any of:
  REVIEW | REBUTTAL | RESPONSE | VERDICT | ABSORPTION | CONVERGENCE
  located under docs/reviews/ or .private_reference/
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

SCAN_DIRS = [
    REPO_ROOT / "docs" / "reviews",
    REPO_ROOT / ".private_reference",
]

REVIEW_NAME_FRAGMENTS = (
    "REVIEW",
    "REBUTTAL",
    "RESPONSE",
    "VERDICT",
    "ABSORPTION",
    "CONVERGENCE",
)

EVIDENCE_TRACE_MARKERS = (
    "Evidence Trace Block",
    "Evidence Trace:",
    "exact command",
    "exact query",
)

# GC-046 went active on this date. Files added before this are grandfathered.
GC046_ACTIVE_DATE = "2026-05-17"

PHASE_0B_THRESHOLD = 3


def _is_review_packet(path: Path) -> bool:
    name = path.name.upper()
    return path.suffix.lower() == ".md" and any(frag in name for frag in REVIEW_NAME_FRAGMENTS)


def _has_evidence_trace(path: Path) -> bool:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False
    return any(marker in text for marker in EVIDENCE_TRACE_MARKERS)


def _get_diff_added_files(base: str, head: str) -> set[Path]:
    """Return absolute paths of files added (A) in the diff base..head."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-status", f"{base}..{head}"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError:
        return set()
    added: set[Path] = set()
    for line in result.stdout.splitlines():
        parts = line.split("\t", 1)
        if len(parts) == 2 and parts[0].strip() == "A":
            added.add(REPO_ROOT / parts[1].strip())
    return added


def _is_legacy(path: Path) -> bool:
    """
    A file is legacy (grandfathered) if its name contains a date string
    earlier than GC046_ACTIVE_DATE, or if it lives in an archive/ subdirectory.
    """
    name = path.name
    if "archive" in path.parts:
        return True
    # Extract date fragment YYYY-MM-DD from filename
    import re
    match = re.search(r"(\d{4}-\d{2}-\d{2})", name)
    if match:
        return match.group(1) < GC046_ACTIVE_DATE
    return False


def _scan_all() -> tuple[list[Path], list[Path]]:
    """Return (compliant, missing) across all scan dirs."""
    compliant: list[Path] = []
    missing: list[Path] = []
    for scan_dir in SCAN_DIRS:
        if not scan_dir.exists():
            continue
        for path in sorted(scan_dir.rglob("*.md")):
            if not _is_review_packet(path):
                continue
            if _has_evidence_trace(path):
                compliant.append(path)
            else:
                missing.append(path)
    return compliant, missing


def main() -> int:
    parser = argparse.ArgumentParser(
        description="CVF Anti-Collusion Evidence Trace Gate (GC-046 Phase 0.C)"
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Phase 0.C hard-fail: exit non-zero when a diff-added review packet "
             "is missing an Evidence Trace Block",
    )
    parser.add_argument("--base", default="HEAD", help="Base ref for diff (default: HEAD)")
    parser.add_argument("--head", default="HEAD", help="Head ref for diff (default: HEAD)")
    args = parser.parse_args()

    mode = "HARD-FAIL (Phase 0.C)" if args.enforce else "ADVISORY (Phase 0.B)"
    print(f"=== CVF Anti-Collusion Evidence Trace Gate — GC-046 [{mode}] ===")

    compliant, missing = _scan_all()
    total = len(compliant) + len(missing)

    print(f"Review packets scanned: {total}")
    print(f"  With Evidence Trace:    {len(compliant)}")
    print(f"  Missing Evidence Trace: {len(missing)}")

    if compliant:
        print("\nCompliant packets:")
        for p in compliant:
            print(f"  + {p.relative_to(REPO_ROOT)}")

    legacy_missing = [p for p in missing if _is_legacy(p)]
    new_missing = [p for p in missing if not _is_legacy(p)]

    if legacy_missing:
        print(f"\nAdvisory — legacy packets missing Evidence Trace (grandfathered, {len(legacy_missing)}):")
        for p in legacy_missing:
            print(f"  ~ {p.relative_to(REPO_ROOT)}")

    if new_missing:
        print(f"\nViolation — new packets missing Evidence Trace Block (GC-046 Rule 1):")
        for p in new_missing:
            print(f"  ! {p.relative_to(REPO_ROOT)}")

    # Phase 0.B threshold status
    print(f"\nPhase 0.B threshold: {len(compliant)}/{PHASE_0B_THRESHOLD} compliant packets")
    if len(compliant) >= PHASE_0B_THRESHOLD:
        print("  Threshold MET — Phase 0.C hard-fail is authorized.")
    else:
        print(f"  Threshold NOT met — {PHASE_0B_THRESHOLD - len(compliant)} more needed.")

    if args.enforce:
        # Hard-fail only on diff-added new (non-legacy) files
        diff_added = _get_diff_added_files(args.base, args.head)
        hard_fail_targets = [
            p for p in new_missing
            if p in diff_added
        ]
        if hard_fail_targets:
            print(
                f"\nVIOLATION — {len(hard_fail_targets)} newly added review packet(s) "
                "are missing an Evidence Trace Block. Add a block before committing.\n"
                "Required format (GC-046 Rule 1):\n"
                "  Evidence Trace Block:\n"
                "  - Command: <exact grep/rg/find command>\n"
                "  - Result: <count or representative output>\n"
                "  - File: <path:line for any 'X exists' or 'X is absent' assertion>"
            )
            return 1
        elif new_missing:
            print(
                f"\n{len(new_missing)} new non-legacy packet(s) missing Evidence Trace "
                "detected in full scan — none are in the current diff. No commit blocked."
            )
        print("\nCOMPLIANT — no newly added review packets are missing Evidence Trace Blocks.")
        return 0
    else:
        if missing:
            print(
                "\nAction: add an Evidence Trace Block to each flagged packet before it is"
                " cited as convergence evidence."
            )
        print("\nADVISORY ONLY — pass --enforce for Phase 0.C hard-fail mode.")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
