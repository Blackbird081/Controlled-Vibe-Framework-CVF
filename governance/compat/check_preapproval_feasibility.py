#!/usr/bin/env python3
"""Range checker for opt-in preapproval feasibility proposals.

Shares the evaluator in preapproval_feasibility_contract. A range PASS with zero
evaluated proposals is NOT_APPLICABLE coverage, never approval feasibility, and
a valid HOLD is reported truthfully rather than treated as release. The
action-scoped FEASIBLE_FOR_INTEGRATED_ROOT_BUILD result has its own count and is
never folded into FEASIBLE or runtime readiness.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

import preapproval_feasibility_contract as contract  # noqa: E402

REPORT_SCHEMA = "cvf.preapprovalFeasibilityRangeReport.v1"


class RangeError(Exception):
    """A Git range or worktree listing could not be resolved."""


def _git(root: Path, args: list[str], *, ok_codes: tuple[int, ...] = (0,)) -> list[str]:
    proc = subprocess.run(
        ["git", *args], cwd=root, text=True, encoding="utf-8", errors="replace",
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    if proc.returncode not in ok_codes:
        raise RangeError(f"git {' '.join(args)} failed ({proc.returncode}): {proc.stderr.strip()}")
    # NUL-delimited Git output preserves actual UTF-8 names and whitespace;
    # quoted name-only output must never silently become an ineligible path.
    return [path for path in proc.stdout.split("\0") if path]


def changed_paths(root: Path, base: str, head: str) -> set[str]:
    """Committed range plus unstaged, staged and untracked paths."""
    paths: set[str] = set()
    if base and head:
        paths.update(_git(root, ["diff", "--name-only", "-z", f"{base}..{head}"]))
    paths.update(_git(root, ["diff", "--name-only", "-z"]))
    paths.update(_git(root, ["diff", "--name-only", "-z", "--cached"]))
    paths.update(_git(root, ["ls-files", "-z", "--others", "--exclude-standard"]))
    return paths


def marked_proposals_referencing(root: Path, companions: set[str]) -> set[str]:
    """Named-family inventory of marked proposals whose companion changed."""
    found = _git(
        root,
        ["grep", "--untracked", "-l", "-z", "-F", contract.COMPANION_PREFIX, "--", *contract.ELIGIBLE_FAMILIES],
        ok_codes=(0, 1),
    )
    referencing: set[str] = set()
    for path in found:
        if not contract.is_eligible_proposal_path(path):
            continue
        text = contract.Snapshot(root).text(path)
        if text is None:
            continue
        state, companion, _ = contract.parse_declarations(text)
        if state == "MARKED" and companion in companions:
            referencing.add(path)
    return referencing


def discover(root: Path, base: str, head: str) -> dict:
    changed = changed_paths(root, base, head)
    snapshot = contract.Snapshot(root)
    # Unreadable or escaping existing paths must reach the fail-closed evaluator.
    # Removed ordinary documents remain outside the current proposal inventory.
    changed_md = {p for p in changed if contract.is_eligible_proposal_path(p)
                  and (snapshot.read(p) is not None or (root / p).exists() or (root / p).is_symlink())}
    changed_json = {p for p in changed if p.endswith(".json")}
    referencing = marked_proposals_referencing(root, changed_json) if changed_json else set()
    return {
        "changedEligibleMarkdown": len(changed_md),
        "changedJson": len(changed_json),
        "companionReferencingProposals": len(referencing),
        "candidates": sorted(changed_md | referencing),
    }


def run(root: Path, base: str, head: str) -> dict:
    discovery = discover(root, base, head)
    receipts = [contract.evaluate(root, path, path, explicit=False) for path in discovery["candidates"]]
    evaluated = [r for r in receipts if r["technicalDisposition"] != "NOT_APPLICABLE"]
    names = ("FEASIBLE", contract.ROOT_BUILD_DISPOSITION, "HOLD", "INVALID")
    counts = {name: sum(r["technicalDisposition"] == name for r in evaluated) for name in names}
    return {
        "schemaVersion": REPORT_SCHEMA,
        "coverage": {
            "changedEligibleMarkdown": discovery["changedEligibleMarkdown"],
            "changedJson": discovery["changedJson"],
            "companionReferencingProposals": discovery["companionReferencingProposals"],
            "candidates": len(discovery["candidates"]),
            "evaluatedMarked": len(evaluated),
            "notApplicableUnmarked": len(receipts) - len(evaluated),
        },
        "counts": counts,
        "receipts": evaluated,
    }


def main(argv: list[str] | None = None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="CVF preapproval feasibility range checker.")
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--repo-root", default=str(contract.REPO_ROOT))
    args = parser.parse_args(argv)
    root = Path(args.repo_root).resolve()
    try:
        report = run(root, args.base, args.head)
    except RangeError as exc:
        print(f"VIOLATION: preapproval feasibility range could not be resolved fail-closed: {exc}")
        return 1 if args.enforce else 0
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True, ensure_ascii=True))
    else:
        coverage = report["coverage"]
        print("=== CVF Preapproval Feasibility Range Gate ===")
        print(f"Contract: {contract.__name__} ({contract.COMPANION_SCHEMA}); stable owner docs/reference/preapproval_feasibility/README.md")
        print("Coverage: " + ", ".join(f"{key}={value}" for key, value in coverage.items()))
        for receipt in report["receipts"]:
            codes = [d["code"] for d in receipt["diagnostics"]] + [v["code"] for v in receipt["canonicalViolations"]]
            print(f"  - {receipt['proposal']['path']}: {receipt['technicalDisposition']} coverage={receipt['coverageDisposition']} {codes}")
        if not coverage["evaluatedMarked"]:
            print("NOT_APPLICABLE: 0 marked proposals evaluated; this range result is not approval feasibility and releases nothing.")
        if report["counts"][contract.ROOT_BUILD_DISPOSITION]:
            print(f"SCOPED: {report['counts'][contract.ROOT_BUILD_DISPOSITION]} {contract.ROOT_BUILD_DISPOSITION} (runtimeReadiness=false); not FEASIBLE or READY, grants no effect, runtime or execution.")
        if report["counts"]["HOLD"]:
            print("HOLD: a valid STOP/ROOT_CONTRACT record is reported truthfully; range PASS does not release implementation or any effect.")
    if report["counts"]["INVALID"]:
        if not args.json:
            print("VIOLATION: repair invalid preapproval feasibility declarations before approval presentation.")
        return 1 if args.enforce else 0
    if not args.json:
        if report["coverage"]["evaluatedMarked"]:
            print("PASS: every evaluated marked proposal is declared-state valid (FEASIBLE, scoped root-build or HOLD); not an approval or effect grant.")
        else:
            print("PASS (NOT_APPLICABLE): no marked proposal in range; nothing was evaluated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
