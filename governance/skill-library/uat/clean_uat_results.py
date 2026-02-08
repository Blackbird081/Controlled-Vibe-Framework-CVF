#!/usr/bin/env python3
"""
Clean generated UAT results and score reports.
"""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
UAT_RESULTS = ROOT_DIR / "governance" / "skill-library" / "uat" / "results"
UAT_REPORTS = ROOT_DIR / "governance" / "skill-library" / "uat" / "reports"


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean UAT results and reports.")
    parser.add_argument("--dry-run", action="store_true", help="List files without deleting.")
    args = parser.parse_args()

    if not UAT_RESULTS.exists():
        print(f"Missing directory: {UAT_RESULTS}")
        return 1

    result_files = sorted(UAT_RESULTS.glob("UAT-*.md"))
    report_files = sorted(UAT_REPORTS.glob("uat_score_report.*")) if UAT_REPORTS.exists() else []
    print(f"Found {len(result_files)} UAT result files.")
    print(f"Found {len(report_files)} UAT report files.")

    if args.dry_run:
        for path in result_files + report_files:
            print(f"- {path.name}")
        return 0

    for path in result_files + report_files:
        path.unlink(missing_ok=True)

    print("OK: Cleaned UAT results and reports.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
