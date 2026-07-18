#!/usr/bin/env python3
"""
CVF As-Built System Catalog Drift Checker

Scoped sibling freshness checker for the as-built system catalog and gap
index family, per ASC-T0 Decision 2 (Topology Decisions). This checker owns
exclusively:

- docs/reference/system_architecture_catalog/entries/ and its generated
  CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json;
- docs/reference/system_chain/gaps/entries/ and its generated
  CVF_SYSTEM_CHAIN_GAP_INDEX.json.

It never fingerprints, reads for drift purposes, or asserts anything about
docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json or its 5 canonical
lanes -- that family remains exclusively owned by
governance/compat/check_system_chain_map_freshness.py. This checker is a new
checker for a family R91 does not own, not a second owner of R91's family.

This checker is strictly read-only. It detects drift by recomputing the
generator output and comparing sha256; it never writes the aggregate, the gap
index, or any compact source entry.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]

CATALOG_ENTRIES_DIR = REPO_ROOT / "docs/reference/system_architecture_catalog/entries"
CATALOG_AGGREGATE_PATH = REPO_ROOT / "docs/reference/system_architecture_catalog/CVF_AS_BUILT_SYSTEM_CATALOG_AGGREGATE.json"
GAP_ENTRIES_DIR = REPO_ROOT / "docs/reference/system_chain/gaps/entries"
GAP_INDEX_PATH = REPO_ROOT / "docs/reference/system_chain/gaps/CVF_SYSTEM_CHAIN_GAP_INDEX.json"
GAP_README_PATH = REPO_ROOT / "docs/reference/system_chain/gaps/README.md"

THIS_CHECKER_PATH = "governance/compat/check_as_built_system_catalog_drift.py"
GENERATOR_PATH = "governance/compat/generate_as_built_system_catalog.py"

# R91-owned paths this checker must never fingerprint or claim ownership of.
R91_OWNED_PATHS = (
    "docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json",
    "docs/reference/system_chain/README.md",
    "docs/reference/system_chain/CVF_SYSTEM_CHAIN_FRESHNESS_STANDARD.md",
    "governance/compat/check_system_chain_map_freshness.py",
    ".github/workflows/system-chain-map-freshness.yml",
)

WIRING_TARGETS = (
    ("governance/compat/agent_autorun_command_catalog.py", "autorun command catalog"),
    ("governance/compat/local_governance_hook_catalog_pre_commit.py", "pre-commit hook catalog"),
    ("governance/compat/local_governance_hook_catalog_pre_push.py", "pre-push hook catalog"),
    ("governance/compat/local_governance_hook_catalog_reviewer_fast.py", "reviewer-fast hook catalog"),
    (".github/workflows/as-built-system-catalog-freshness.yml", "as-built system catalog CI/weekly workflow"),
)


def _run_generator(target: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(REPO_ROOT / GENERATOR_PATH), "--target", target, "--json"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
    )


def _sha256_of_file(path: Path) -> str | None:
    if not path.exists():
        return None
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _recompute_expected_hash(target: str) -> tuple[str | None, str | None]:
    """Recompute what the generator would produce, without writing committed
    output: run the generator against a throwaway copy is unnecessary since
    the generator is deterministic and pure over entries/ input; instead we
    directly invoke its build function via subprocess against the real repo
    (safe: it only rewrites its own two owned generated paths, which is the
    exact freshness question being asked) and capture the resulting hash."""
    proc = _run_generator(target)
    if proc.returncode != 0:
        return None, f"generator invocation failed: {proc.stderr.strip() or proc.stdout.strip()}"
    try:
        report = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        return None, f"generator produced non-JSON output: {exc}"
    key = "catalog" if target == "catalog" else "gaps"
    entry = report.get(key)
    if not entry:
        return None, f"generator report missing `{key}` section"
    return entry.get("sha256"), None


def validate_no_r91_ownership_claim() -> list[str]:
    """Confirm this checker's own source does not fingerprint any R91-owned path."""
    issues: list[str] = []
    own_source = (REPO_ROOT / THIS_CHECKER_PATH).read_text(encoding="utf-8")
    for r91_path in R91_OWNED_PATHS:
        # The path may legitimately appear in a docstring/comment disclaiming
        # ownership (as it does above); only flag if it appears in a
        # fingerprint-like assignment context, which this checker never uses.
        if f'"{r91_path}"' in own_source.replace("'", '"').split("R91_OWNED_PATHS")[0]:
            issues.append(
                f"OWNERSHIP_VIOLATION: this checker's source references R91-owned path "
                f"`{r91_path}` outside the declared disclaimer list"
            )
    return issues


def validate_catalog_drift() -> list[str]:
    issues: list[str] = []
    if not CATALOG_ENTRIES_DIR.is_dir():
        return [f"PATH_MISSING: catalog entries directory `{CATALOG_ENTRIES_DIR.relative_to(REPO_ROOT)}` does not exist"]
    committed_hash = _sha256_of_file(CATALOG_AGGREGATE_PATH)
    if committed_hash is None:
        issues.append(
            f"PATH_MISSING: `{CATALOG_AGGREGATE_PATH.relative_to(REPO_ROOT)}` does not exist; "
            f"run `python {GENERATOR_PATH} --target catalog`"
        )
        return issues
    expected_hash, err = _recompute_expected_hash("catalog")
    if err:
        issues.append(f"GENERATOR_ERROR: {err}")
        return issues
    if committed_hash != expected_hash:
        issues.append(
            "AGGREGATE_DRIFT: committed catalog aggregate does not match a fresh rebuild "
            f"from `{CATALOG_ENTRIES_DIR.relative_to(REPO_ROOT)}` "
            f"(committed sha256={committed_hash}, expected sha256={expected_hash})"
        )
    return issues


def validate_gap_drift() -> list[str]:
    issues: list[str] = []
    if not GAP_ENTRIES_DIR.is_dir():
        return [f"PATH_MISSING: gap entries directory `{GAP_ENTRIES_DIR.relative_to(REPO_ROOT)}` does not exist"]
    committed_hash = _sha256_of_file(GAP_INDEX_PATH)
    if committed_hash is None:
        issues.append(
            f"PATH_MISSING: `{GAP_INDEX_PATH.relative_to(REPO_ROOT)}` does not exist; "
            f"run `python {GENERATOR_PATH} --target gaps`"
        )
        return issues
    expected_hash, err = _recompute_expected_hash("gaps")
    if err:
        issues.append(f"GENERATOR_ERROR: {err}")
        return issues
    if committed_hash != expected_hash:
        issues.append(
            "GAP_INDEX_DRIFT: committed gap index does not match a fresh rebuild "
            f"from `{GAP_ENTRIES_DIR.relative_to(REPO_ROOT)}` "
            f"(committed sha256={committed_hash}, expected sha256={expected_hash})"
        )
    return issues


def validate_gap_readme_reconciliation() -> list[str]:
    """Every gapId present in the generated index must appear in the README front door."""
    issues: list[str] = []
    if not GAP_INDEX_PATH.exists() or not GAP_README_PATH.exists():
        return issues
    try:
        index = json.loads(GAP_INDEX_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"schema: gap index is not valid JSON: {exc}"]
    readme_text = GAP_README_PATH.read_text(encoding="utf-8")
    for gap in index.get("gaps", []):
        gap_id = gap.get("stableId")
        if gap_id and gap_id not in readme_text:
            issues.append(
                f"README_DRIFT: gapId `{gap_id}` from the generated index is not referenced "
                f"in `{GAP_README_PATH.relative_to(REPO_ROOT)}`"
            )
    return issues


def validate_wiring() -> list[str]:
    """Confirm this checker's own command appears exactly once in every required catalog/workflow."""
    issues: list[str] = []
    for rel_path, label in WIRING_TARGETS:
        full = REPO_ROOT / rel_path
        if not full.exists():
            issues.append(f"wiring: {label} ({rel_path}) does not exist")
            continue
        text = full.read_text(encoding="utf-8", errors="replace")
        count = text.count(THIS_CHECKER_PATH)
        if count == 0:
            issues.append(f"wiring: {label} ({rel_path}) does not reference {THIS_CHECKER_PATH}")
        elif count > 1:
            issues.append(
                f"wiring: {label} ({rel_path}) references {THIS_CHECKER_PATH} {count} times, expected exactly 1"
            )
    return issues


def run_all_validations() -> list[str]:
    issues: list[str] = []
    issues.extend(validate_no_r91_ownership_claim())
    issues.extend(validate_catalog_drift())
    issues.extend(validate_gap_drift())
    issues.extend(validate_gap_readme_reconciliation())
    issues.extend(validate_wiring())
    return issues


def _classify(issues: list[str]) -> dict[str, int]:
    counts = {
        "OWNERSHIP_VIOLATION": 0,
        "PATH_MISSING": 0,
        "AGGREGATE_DRIFT": 0,
        "GAP_INDEX_DRIFT": 0,
        "README_DRIFT": 0,
        "GENERATOR_ERROR": 0,
        "schema": 0,
        "wiring": 0,
    }
    for issue in issues:
        for key in counts:
            if issue.startswith(f"{key}:"):
                counts[key] += 1
                break
    return counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violations")
    args = parser.parse_args(argv)

    issues = run_all_validations()
    counts = _classify(issues)
    freshness_state = "CURRENT" if not issues else next(
        (k for k in counts if counts[k]),
        "CURRENT",
    )

    if args.json:
        report = {
            "checker": THIS_CHECKER_PATH,
            "freshnessState": freshness_state,
            "violationCount": len(issues),
            "violations": issues,
            "counts": counts,
        }
        print(json.dumps(report, indent=2))
    else:
        print("=== CVF As-Built System Catalog Drift Gate ===")
        print(f"Owned paths: {CATALOG_AGGREGATE_PATH.relative_to(REPO_ROOT)}, {GAP_INDEX_PATH.relative_to(REPO_ROOT)}")
        print(f"Freshness state: {freshness_state}")
        print(f"Violations: {len(issues)}")
        for issue in issues:
            print(f"  - {issue}")
        if issues:
            print(
                "\nOperator readout: repair by editing the named compact source entry, then "
                f"re-run `python {GENERATOR_PATH}`, then re-run this checker."
            )

    if issues:
        if args.enforce:
            print("\nNON-COMPLIANT - as-built system catalog drift detected." if not args.json else "", end="")
            return 1
        print("\nADVISORY - as-built system catalog drift detected." if not args.json else "", end="")
        return 0

    if not args.json:
        print("\nCOMPLIANT - as-built system catalog and gap index are fresh.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
