#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATH = "governance/toolkit/05_OPERATION/CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md"
SUMMARY_SURFACES = [
    "docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md",
    "docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md",
    "AGENT_HANDOFF.md",
    "docs/INDEX.md",
    "docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md",
]
FORBIDDEN_TOKENS = [
    "measurementId",
    "traceId",
    "reportId",
    "reportHash",
    "runId",
    "runHash",
    "resultHash",
    "batchHash",
    "summaryHash",
    "orchestrationHash",
    "gatewayHash",
]


def _read_text(rel_path: str) -> str:
    path = REPO_ROOT / rel_path
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _classify() -> dict:
    violations: list[dict[str, str]] = []
    token_patterns = {
        token: re.compile(rf"\b{re.escape(token)}\b\s*[:=]")
        for token in FORBIDDEN_TOKENS
    }

    for rel_path in SUMMARY_SURFACES:
        text = _read_text(rel_path)
        if not text:
            violations.append({
                "type": "missing_summary_surface",
                "path": rel_path,
                "message": f"{rel_path} is missing.",
            })
            continue
        for token, pattern in token_patterns.items():
            if pattern.search(text):
                violations.append({
                    "type": "summary_embeds_typed_evidence",
                    "path": rel_path,
                    "message": f"{rel_path} must not inline typed evidence token `{token}`.",
                })

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY_PATH,
        "summarySurfaceCount": len(SUMMARY_SURFACES),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict) -> None:
    print("=== CVF Canon Summary Evidence Separation Gate ===")
    print(f"Summary surfaces checked: {report['summarySurfaceCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\n❌ Violations:")
        for violation in report["violations"]:
            print(f"  - [{violation['type']}] {violation['message']}")
    else:
        print("\n✅ COMPLIANT — canonical summary docs stay separate from typed evidence payloads.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check canon summary vs evidence separation")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = _classify()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_report(report)

    if args.enforce and not report["compliant"]:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
