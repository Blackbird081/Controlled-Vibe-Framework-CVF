#!/usr/bin/env python3
"""
CVF Provider Lane Release Readiness Gate — W110-T3
Checks provider lane certification status from saved receipts.
Makes NO live provider API calls.

Usage:
  python scripts/check_cvf_provider_release_readiness.py
  python scripts/check_cvf_provider_release_readiness.py --json

Exit codes:
  0 — at least one lane is CERTIFIED or CANARY_PASS (with warning if no CERTIFIED lane)
  1 — no receipts found, or evaluation fails
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
EVALUATOR = REPO_ROOT / "scripts" / "evaluate_cvf_provider_lane_certification.py"


def run_evaluator() -> list[dict] | None:
    try:
        result = subprocess.run(
            [sys.executable, str(EVALUATOR), "--json"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            return None
        return json.loads(result.stdout)
    except Exception:
        return None


def print_report(lanes: list[dict]) -> None:
    bar = "=" * 64
    print(f"\n{bar}")
    print("CVF Provider Lane Release Readiness")
    print(bar)

    certified = [r for r in lanes if r["status"] == "CERTIFIED"]
    canary = [r for r in lanes if r["status"] == "CANARY_PASS"]
    degraded = [r for r in lanes if r["status"] in ("DEGRADED", "BLOCKED")]
    other = [r for r in lanes if r not in certified + canary + degraded]

    for group, label in [(certified, "CERTIFIED"), (canary, "CANARY_PASS"),
                          (degraded, "DEGRADED/BLOCKED"), (other, "OTHER")]:
        if not group:
            continue
        print(f"\n  {label}:")
        for r in group:
            receipt = r.get("latest_receipt") or "—"
            tail = r.get("consecutive_passes", 0)
            print(f"    {r['provider']:<12} {r['model']:<18} tail={tail}/3")
            print(f"      receipt: {receipt}")

    print(f"\n{'-' * 64}")
    print(f"  Certified  : {len(certified)}")
    print(f"  Canary Pass: {len(canary)}")
    print(f"  Degraded   : {len(degraded)}")
    print(f"{bar}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF Provider Lane Release Readiness Gate")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    args = parser.parse_args()

    lanes = run_evaluator()
    if lanes is None:
        print("ERROR: Certification evaluator failed to run or returned invalid output.")
        print(f"  Run manually: python {EVALUATOR.name}")
        sys.exit(1)

    certified = [r for r in lanes if r["status"] == "CERTIFIED"]
    canary = [r for r in lanes if r["status"] == "CANARY_PASS"]
    any_receipts = any(r["receipt_count"] > 0 for r in lanes)

    if not any_receipts:
        if args.json:
            print(json.dumps({"status": "NO_RECEIPTS", "lanes": lanes}, indent=2))
        else:
            print("ERROR: No receipts found for any provider lane.")
            print("  Run a canary first: python scripts/run_cvf_provider_live_canary.py --provider alibaba --save-receipt")
        sys.exit(1)

    if args.json:
        result = {
            "status": "CERTIFIED" if certified else ("CANARY_PASS" if canary else "NO_PASS"),
            "certified_count": len(certified),
            "canary_pass_count": len(canary),
            "lanes": lanes,
        }
        print(json.dumps(result, indent=2))
    else:
        print_report(lanes)

    if certified:
        print("  RELEASE READY: At least one lane is CERTIFIED.")
        sys.exit(0)
    elif canary:
        print("  WARNING: No CERTIFIED lane — DeepSeek is CANARY_PASS only.")
        print("  Multi-provider operability is proven. Certification repeat is optional.")
        sys.exit(0)
    else:
        print("  ERROR: No lane has passed a full 6/6 canary.")
        sys.exit(1)


if __name__ == "__main__":
    main()
