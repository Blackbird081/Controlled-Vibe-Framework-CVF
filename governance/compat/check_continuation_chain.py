#!/usr/bin/env python3
"""CVF continuation chain guard."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY = "governance/toolkit/05_OPERATION/CVF_CONTINUATION_CHAIN_GUARD.md"
WORK_ORDER_ROOT = "docs/work_orders"
REVIEW_ROOT = "docs/reviews"
STATE_PATH = "CVF_SESSION/ACTIVE_SESSION_STATE.json"
EXEMPTION_REGISTRY_PATH = "governance/compat/CVF_CONTINUATION_CHAIN_EXEMPTION_REGISTRY.json"
GC018_PATTERN = re.compile(r"docs/baselines/CVF_GC018_[^\s`]+\.md")
GC018_REQUIRED_YES_RE = re.compile(r"^GC-018 required:\s*Yes\b", re.IGNORECASE | re.MULTILINE)
GC018_REQUIRED_NO_RE = re.compile(r"^GC-018 required:\s*No\b", re.IGNORECASE | re.MULTILINE)
CLOSED_PATTERN = re.compile(r"^Status:\s*CLOSED", re.IGNORECASE | re.MULTILINE)


def _read_text(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_exemptions(path: Path) -> tuple[set[str], list[dict[str, str]]]:
    data = _load_json(path) if path.exists() else []
    if not isinstance(data, list):
        raise ValueError("continuation chain exemption registry must be a list")
    exemptions: set[str] = set()
    violations: list[dict[str, str]] = []
    if len(data) > 10:
        violations.append({"rule": "registry", "file": str(path), "issue": "exemption registry exceeds 10 entries"})
    for index, entry in enumerate(data):
        if not isinstance(entry, dict) or not isinstance(entry.get("workOrderFile"), str):
            violations.append({"rule": "registry", "file": str(path), "issue": f"invalid exemption entry {index}"})
            continue
        exemptions.add(entry["workOrderFile"])
    return exemptions, violations


def _git_head_short() -> str:
    return subprocess.check_output(["git", "rev-parse", "--short=8", "HEAD"], cwd=REPO_ROOT, text=True).strip()


def _git_parent_short() -> str | None:
    try:
        sha = subprocess.check_output(
            ["git", "rev-parse", "--short=8", "HEAD~1"], cwd=REPO_ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
        return sha or None
    except subprocess.CalledProcessError:
        return None


def _active_handoff_path() -> Path | None:
    state_path = REPO_ROOT / STATE_PATH
    if not state_path.exists():
        return None
    state = _load_json(state_path)
    active = state.get("activeHandoff") if isinstance(state, dict) else None
    return (REPO_ROOT / active) if isinstance(active, str) and active else None


def _extract_identifiers(work_order_name: str) -> list[str]:
    stem = Path(work_order_name).stem
    identifiers = [work_order_name, stem]
    lane_match = re.search(r"(LANE_[A-Z]+)", stem)
    if lane_match:
        identifiers.append(lane_match.group(1))
    candidate_match = re.search(r"(C[1-4])_", stem)
    if candidate_match:
        identifiers.append(candidate_match.group(1))
    role_match = re.search(r"WORK_ORDER_([A-Z_]+)_\d{4}", stem)
    if role_match:
        identifiers.append(role_match.group(1))
    return list(dict.fromkeys(identifiers))


def _completion_reviews(review_root: Path) -> list[Path]:
    return sorted(review_root.glob("CVF_*_COMPLETION_*.md")) if review_root.exists() else []


def _has_matching_review(work_order_name: str, reviews: list[Path]) -> bool:
    identifiers = _extract_identifiers(work_order_name)
    for review in reviews:
        text = _read_text(review)
        if any(identifier and identifier in text for identifier in identifiers):
            return True
    return False


def _check_work_orders(work_order_root: Path, review_root: Path, exemptions: set[str]) -> list[dict[str, str]]:
    violations: list[dict[str, str]] = []
    reviews = _completion_reviews(review_root)
    work_orders = sorted(work_order_root.glob("CVF_AGENT_WORK_ORDER_*.md")) if work_order_root.exists() else []
    for path in work_orders:
        text = _read_text(path)
        name = path.name
        if GC018_REQUIRED_YES_RE.search(text) and not GC018_PATTERN.search(text):
            violations.append({"rule": "A", "file": name, "issue": "missing GC-018 reference"})
        elif GC018_REQUIRED_NO_RE.search(text):
            pass
        if CLOSED_PATTERN.search(text) and name not in exemptions and not _has_matching_review(name, reviews):
            violations.append({"rule": "B", "file": name, "issue": "no completion review"})
    return violations


def _check_handoff_head() -> list[dict[str, str]]:
    handoff = _active_handoff_path()
    head = _git_head_short()
    if handoff is None or not handoff.exists():
        return [{"rule": "C", "file": STATE_PATH, "issue": "active handoff missing", "headSha": head}]
    text = _read_text(handoff)
    parent = _git_parent_short()
    # GC-020 Rule C: handoff must contain either current HEAD or its immediate
    # parent. The parent-SHA branch resolves the self-referential paradox at
    # pre-push time: a commit cannot embed its own SHA in its own content, so a
    # GC-020 sync commit (which records the SHA it synced) is naturally
    # parent-anchored. This keeps the "handoff was sync'd recently" guarantee
    # without forcing an impossible self-reference.
    if head in text or (parent is not None and parent in text):
        return []
    try:
        handoff_label = str(handoff.relative_to(REPO_ROOT))
    except ValueError:
        handoff_label = str(handoff)
    return [{"rule": "C", "file": handoff_label, "issue": "GC-020 drift", "headSha": head, "parentSha": parent or ""}]


def run_check(
    work_order_root: Path | None = None,
    review_root: Path | None = None,
    exemption_registry: Path | None = None,
    include_rule_c: bool = True,
) -> dict[str, Any]:
    work_orders = work_order_root or REPO_ROOT / WORK_ORDER_ROOT
    reviews = review_root or REPO_ROOT / REVIEW_ROOT
    registry = exemption_registry or REPO_ROOT / EXEMPTION_REGISTRY_PATH
    exemptions, registry_violations = _load_exemptions(registry)
    violations = [
        *registry_violations,
        *_check_work_orders(work_orders, reviews, exemptions),
    ]
    if include_rule_c:
        violations.extend(_check_handoff_head())
    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "workOrderRoot": str(work_orders),
        "reviewRoot": str(reviews),
        "exemptionRegistry": str(registry),
        "exemptionCount": len(exemptions),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Continuation Chain Guard ===")
    print(f"Policy: {report['policy']}")
    print(f"Exemptions: {report['exemptionCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - Rule {violation['rule']} {violation.get('file', '')}: {violation['issue']}")
    if report["compliant"]:
        print("\nCOMPLIANT - continuation chain is aligned.")
    else:
        print("\nVIOLATION - continuation chain drift detected.")


def _resolve_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else REPO_ROOT / path


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check CVF continuation chain integrity")
    parser.add_argument("--work-order-root", default=WORK_ORDER_ROOT)
    parser.add_argument("--review-root", default=REVIEW_ROOT)
    parser.add_argument("--exemption-registry", default=EXEMPTION_REGISTRY_PATH)
    parser.add_argument("--skip-rule-c", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    report = run_check(
        _resolve_path(args.work_order_root),
        _resolve_path(args.review_root),
        _resolve_path(args.exemption_registry),
        include_rule_c=not args.skip_rule_c,
    )
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)
    return 2 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
