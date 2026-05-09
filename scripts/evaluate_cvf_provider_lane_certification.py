#!/usr/bin/env python3
"""
CVF Provider Lane Certification Evaluator — W110-T2
Reads receipt JSONs from each provider audit folder, applies the lane status
taxonomy from provider-lane-status.ts, and prints the current readiness matrix.

Usage:
  python scripts/evaluate_cvf_provider_lane_certification.py
  python scripts/evaluate_cvf_provider_lane_certification.py --json

Exit codes: 0=ok, 1=no receipts found for any provider
"""
import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent

PROVIDERS = [
    {
        "name": "alibaba",
        "model": "qwen-turbo",
        "audit_dir": REPO_ROOT / "docs" / "evidence" / "provider-lane-receipts" / "alibaba",
    },
    {
        "name": "deepseek",
        "model": "deepseek-chat",
        "audit_dir": REPO_ROOT / "docs" / "evidence" / "provider-lane-receipts" / "deepseek",
    },
    {
        "name": "openai",
        "model": "gpt-4o-mini",
        "audit_dir": REPO_ROOT / "docs" / "evidence" / "provider-lane-receipts" / "openai",
    },
]

CERTIFICATION_WINDOW = 3
SCENARIOS_TOTAL = 6


def load_receipts(audit_dir: Path) -> list[dict]:
    receipts = []
    for p in sorted(audit_dir.glob("RECEIPT_*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            receipts.append({
                "run_id": data.get("run_id", p.stem),
                "overall_status": data.get("overall_status", "FAIL"),
                "pass_count": data.get("pass_count", 0),
                "timestamp": data.get("timestamp", ""),
                "receipt_path": str(p.relative_to(REPO_ROOT)),
            })
        except Exception:
            continue
    # Sort chronologically by run_id (YYYYMMDD-HHMMSS prefix guarantees lexicographic order)
    return sorted(receipts, key=lambda r: r["run_id"])


def classify(receipts: list[dict]) -> str:
    if not receipts:
        return "EXPERIMENTAL"

    latest = receipts[-1]
    latest_full_pass = (
        latest["overall_status"] == "PASS" and latest["pass_count"] == SCENARIOS_TOTAL
    )

    if not latest_full_pass:
        has_prior = any(
            r["overall_status"] == "PASS" and r["pass_count"] == SCENARIOS_TOTAL
            for r in receipts[:-1]
        )
        return "DEGRADED" if has_prior else "LIVE"

    consecutive = 0
    for r in reversed(receipts):
        if r["overall_status"] == "PASS" and r["pass_count"] == SCENARIOS_TOTAL:
            consecutive += 1
        else:
            break

    return "CERTIFIED" if consecutive >= CERTIFICATION_WINDOW else "CANARY_PASS"


def evaluate_all() -> list[dict]:
    results = []
    for cfg in PROVIDERS:
        receipts = load_receipts(cfg["audit_dir"])
        status = classify(receipts)
        latest = receipts[-1] if receipts else None
        results.append({
            "provider": cfg["name"],
            "model": cfg["model"],
            "status": status,
            "receipt_count": len(receipts),
            "last_run_at": latest["timestamp"] if latest else None,
            "latest_receipt": latest["receipt_path"] if latest else None,
            "latest_pass_count": latest["pass_count"] if latest else 0,
            "consecutive_passes": _count_tail_passes(receipts),
        })
    return results


def _count_tail_passes(receipts: list[dict]) -> int:
    count = 0
    for r in reversed(receipts):
        if r["overall_status"] == "PASS" and r["pass_count"] == SCENARIOS_TOTAL:
            count += 1
        else:
            break
    return count


def print_matrix(results: list[dict]) -> None:
    bar = "=" * 72
    print(f"\n{bar}")
    print("CVF Provider Lane Readiness Matrix")
    print(bar)
    fmt = "  {:<12} {:<18} {:<15} {:>6}  {:>4}/{}"
    print(fmt.format("Provider", "Model", "Status", "Runs", "Tail", "3 needed"))
    print("-" * 72)
    for r in results:
        print(fmt.format(
            r["provider"],
            r["model"],
            r["status"],
            r["receipt_count"],
            r["consecutive_passes"],
            CERTIFICATION_WINDOW,
        ))
        if r["latest_receipt"]:
            print(f"    Last receipt : {r['latest_receipt']}")
            print(f"    Last run     : {r['last_run_at']}")
    print(bar)

    certified = [r for r in results if r["status"] == "CERTIFIED"]
    canary = [r for r in results if r["status"] == "CANARY_PASS"]
    print(f"\n  CERTIFIED : {len(certified)} lane(s)")
    print(f"  CANARY_PASS: {len(canary)} lane(s)")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF Provider Lane Certification Evaluator")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of table")
    args = parser.parse_args()

    results = evaluate_all()

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print_matrix(results)

    any_receipts = any(r["receipt_count"] > 0 for r in results)
    sys.exit(0 if any_receipts else 1)


if __name__ == "__main__":
    main()
