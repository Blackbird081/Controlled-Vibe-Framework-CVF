#!/usr/bin/env python3
"""
CVF Alibaba Live Canary Runner — W110-T1
Runs 6 locked front-door scenarios on the live Alibaba lane.
Optionally writes a structured evidence receipt.

Usage:
  python scripts/run_cvf_alibaba_live_canary.py
  python scripts/run_cvf_alibaba_live_canary.py --save-receipt

Exit codes: 0=all pass, 1=one or more fail, 2=API key absent (all skipped)
"""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
CVF_WEB = REPO_ROOT / "EXTENSIONS" / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web"
AUDITS_DIR = REPO_ROOT / "docs" / "audits" / "alibaba-canary"
INDEX_FILE = AUDITS_DIR / "INDEX.md"
TEST_PATTERN = "route.front-door-rewrite.alibaba.live.test.ts"

SCENARIOS = [
    ("S1", "app_builder_complete"),
    ("S2", "api_design"),
    ("S3", "code_review"),
    ("S4", "documentation"),
    ("S5", "web_ux_redesign_system"),
    ("S6", "data_analysis"),
]


def resolve_api_key() -> str | None:
    return os.environ.get("ALIBABA_API_KEY") or os.environ.get("DASHSCOPE_API_KEY")


def run_tests(api_key: str, json_out: Path) -> int:
    env = {**os.environ, "ALIBABA_API_KEY": api_key}
    cmd = [
        "npx", "vitest", "run", TEST_PATTERN,
        "--reporter=verbose",
        "--reporter=json",
        f"--outputFile={json_out}",
    ]
    result = subprocess.run(cmd, cwd=CVF_WEB, env=env)
    return result.returncode


def load_json(path: Path) -> dict:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def build_receipt(vitest: dict, api_key_present: bool) -> dict:
    now = datetime.now(timezone.utc)
    run_id = f"{now.strftime('%Y%m%d-%H%M%S')}-{hashlib.sha1(now.isoformat().encode()).hexdigest()[:6]}"

    assertions: list[dict] = []
    for suite in vitest.get("testResults", []):
        assertions.extend(suite.get("assertionResults", []))

    scenario_rows = []
    for sid, tid in SCENARIOS:
        matched = [
            a for a in assertions
            if tid in (a.get("fullName") or a.get("title") or "")
        ]
        if matched:
            ar = matched[0]
            status = "PASS" if ar.get("status") == "passed" else "FAIL"
            dur = int(ar.get("duration") or 0)
        else:
            status = "SKIP"
            dur = 0
        scenario_rows.append({"id": sid, "template_id": tid, "status": status, "duration_ms": dur})

    pass_n = sum(1 for r in scenario_rows if r["status"] == "PASS")
    fail_n = sum(1 for r in scenario_rows if r["status"] == "FAIL")
    skip_n = sum(1 for r in scenario_rows if r["status"] == "SKIP")
    overall = "SKIP" if skip_n == len(SCENARIOS) else ("FAIL" if fail_n else "PASS")

    return {
        "run_id": run_id,
        "timestamp": now.isoformat(),
        "provider": "alibaba",
        "model": "qwen-turbo",
        "triggered_by": "cli",
        "scenarios": scenario_rows,
        "overall_status": overall,
        "pass_count": pass_n,
        "fail_count": fail_n,
        "skip_count": skip_n,
    }


def render_md(r: dict) -> str:
    icons = {"PASS": "✓", "FAIL": "✗", "SKIP": "–"}
    rows = "\n".join(
        f"| {s['id']} | `{s['template_id']}` | {icons.get(s['status'], '?')} {s['status']} | {s['duration_ms']}ms |"
        for s in r["scenarios"]
    )
    return (
        f"# Alibaba Live Canary — Receipt {r['run_id']}\n\n"
        f"**Timestamp:** {r['timestamp']}  \n"
        f"**Provider:** {r['provider']} / {r['model']}  \n"
        f"**Overall:** {r['overall_status']}  \n\n"
        f"| # | Template | Status | Duration |\n"
        f"|---|---|---|---|\n"
        f"{rows}\n\n"
        f"Pass: {r['pass_count']} / Fail: {r['fail_count']} / Skip: {r['skip_count']}\n"
    )


def save_receipt(r: dict) -> None:
    AUDITS_DIR.mkdir(parents=True, exist_ok=True)
    rid = r["run_id"]
    (AUDITS_DIR / f"RECEIPT_{rid}.json").write_text(json.dumps(r, indent=2), encoding="utf-8")
    (AUDITS_DIR / f"RECEIPT_{rid}.md").write_text(render_md(r), encoding="utf-8")

    entry = f"- [{rid}](RECEIPT_{rid}.md) — {r['overall_status']} ({r['pass_count']}/6 pass)\n"
    if INDEX_FILE.exists():
        content = INDEX_FILE.read_text(encoding="utf-8")
        if "## Receipts" not in content:
            content += "\n## Receipts\n"
        INDEX_FILE.write_text(content + entry, encoding="utf-8")
    else:
        INDEX_FILE.write_text(
            "# Alibaba Live Canary — Receipt Index\n\n## Receipts\n" + entry,
            encoding="utf-8",
        )
    print(f"\nReceipt: docs/audits/alibaba-canary/RECEIPT_{rid}.json + .md")


def print_summary(r: dict) -> None:
    icons = {"PASS": "✓", "FAIL": "✗", "SKIP": "–"}
    bar = "=" * 62
    print(f"\n{bar}")
    print(f"CVF Alibaba Live Canary — {r['run_id']}")
    print(bar)
    for s in r["scenarios"]:
        icon = icons.get(s["status"], "?")
        print(f"  {icon} {s['id']}  {s['template_id']:<30} {s['duration_ms']}ms")
    print("-" * 62)
    print(f"  Overall: {r['overall_status']}  Pass={r['pass_count']}  Fail={r['fail_count']}  Skip={r['skip_count']}")
    print(bar)


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF Alibaba Live Canary Runner (W110-T1)")
    parser.add_argument("--save-receipt", action="store_true",
                        help="Write evidence receipt to docs/audits/alibaba-canary/")
    args = parser.parse_args()

    api_key = resolve_api_key()
    if not api_key:
        print("ERROR: ALIBABA_API_KEY not set — all scenarios will be skipped.")
        print("  export ALIBABA_API_KEY=<your-key> and retry.")
        sys.exit(2)

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        json_out = Path(tmp.name)

    try:
        run_tests(api_key, json_out)
        vitest_data = load_json(json_out)
    finally:
        json_out.unlink(missing_ok=True)

    receipt = build_receipt(vitest_data, api_key_present=True)
    print_summary(receipt)

    if args.save_receipt:
        save_receipt(receipt)

    sys.exit({"PASS": 0, "FAIL": 1, "SKIP": 2}.get(receipt["overall_status"], 1))


if __name__ == "__main__":
    main()
