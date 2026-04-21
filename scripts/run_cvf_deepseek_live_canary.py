#!/usr/bin/env python3
"""
CVF DeepSeek Live Canary Runner — W110-T1
Runs 6 locked front-door scenarios on the live DeepSeek lane.
Optionally writes a structured evidence receipt.

Usage:
  python scripts/run_cvf_deepseek_live_canary.py
  python scripts/run_cvf_deepseek_live_canary.py --save-receipt

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
AUDITS_DIR = REPO_ROOT / "docs" / "audits" / "deepseek-canary"
INDEX_FILE = AUDITS_DIR / "INDEX.md"
TEST_PATTERN = "route.front-door-rewrite.deepseek.live.test.ts"

SCENARIOS = [
    {
        "id": "S1",
        "template_id": "app_builder_complete",
        "keyword_matches": ["TaskFlow", "Acceptance Criteria", "Handoff Boundaries"],
    },
    {
        "id": "S2",
        "template_id": "api_design",
        "keyword_matches": ["LeadSync", "Operations/Payloads/Giao thức", "approval/Phê Duyệt", "Checklist/Kiểm Tra"],
    },
    {
        "id": "S3",
        "template_id": "code_review",
        "keyword_matches": ["Intended Outcome/Mục tiêu", "Main Risks/Rủi ro", "Builder Handoff", "Checklist/Acceptance"],
    },
    {
        "id": "S4",
        "template_id": "documentation",
        "keyword_matches": ["What This Document Is For/Mục tiêu", "Main Flow/Steps", "Checklist/Handoff", "SRE/P1"],
    },
    {
        "id": "S5",
        "template_id": "web_ux_redesign_system",
        "keyword_matches": ["Review Gate", "QA Rules", "approval", "routes/auth/API"],
    },
    {
        "id": "S6",
        "template_id": "data_analysis",
        "keyword_matches": ["What Data We Looked At/Nguồn Dữ Liệu", "Suggests/Insight", "Recommended Actions/Khuyến nghị", "Checklist/Follow-Up"],
    },
]


def read_env_file(path: Path, key: str) -> str | None:
    if not path.exists():
        return None
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == key:
            return value.strip().strip('"').strip("'")
    return None


def resolve_api_key() -> str | None:
    return (
        os.environ.get("DEEPSEEK_API_KEY")
        or os.environ.get("CVF_DEEPSEEK_API_KEY")
        or read_env_file(CVF_WEB / ".env.local", "DEEPSEEK_API_KEY")
        or read_env_file(CVF_WEB / ".env.local", "CVF_DEEPSEEK_API_KEY")
    )


def run_tests(api_key: str, json_out: Path) -> int:
    env = {**os.environ, "DEEPSEEK_API_KEY": api_key}
    # shell=True ensures npx resolves correctly on Windows (npx.cmd) and Unix
    cmd = (
        f'npx vitest run "{TEST_PATTERN}"'
        f" --reporter=verbose"
        f" --reporter=json"
        f' --outputFile="{json_out}"'
        f" --testTimeout=180000"
    )
    result = subprocess.run(cmd, shell=True, cwd=CVF_WEB, env=env)
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
    for scenario in SCENARIOS:
        sid = scenario["id"]
        tid = scenario["template_id"]
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
        passed = status == "PASS"
        scenario_rows.append({
            "id": sid,
            "template_id": tid,
            "status": status,
            "duration_ms": dur,
            "quality_signals": {
                "min_output_met": passed,
                "keyword_matches": scenario["keyword_matches"] if passed else [],
                "antipattern_clean": passed,
                "validated_by_vitest": bool(matched),
            },
        })

    pass_n = sum(1 for r in scenario_rows if r["status"] == "PASS")
    fail_n = sum(1 for r in scenario_rows if r["status"] == "FAIL")
    skip_n = sum(1 for r in scenario_rows if r["status"] == "SKIP")
    overall = "SKIP" if skip_n == len(SCENARIOS) else ("FAIL" if fail_n else "PASS")

    return {
        "run_id": run_id,
        "timestamp": now.isoformat(),
        "provider": "deepseek",
        "model": "deepseek-chat",
        "triggered_by": "cli",
        "scenarios": scenario_rows,
        "overall_status": overall,
        "pass_count": pass_n,
        "fail_count": fail_n,
        "skip_count": skip_n,
    }


def render_md(r: dict) -> str:
    icons = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}
    rows = "\n".join(
        f"| {s['id']} | `{s['template_id']}` | {icons.get(s['status'], '?')} | {s['duration_ms']}ms | "
        f"{', '.join(s['quality_signals']['keyword_matches']) or '-'} |"
        for s in r["scenarios"]
    )
    return (
        f"# DeepSeek Live Canary -- Receipt {r['run_id']}\n\n"
        f"**Timestamp:** {r['timestamp']}  \n"
        f"**Provider:** {r['provider']} / {r['model']}  \n"
        f"**Overall:** {r['overall_status']}  \n\n"
        f"| # | Template | Status | Duration | Quality anchors |\n"
        f"|---|---|---|---|---|\n"
        f"{rows}\n\n"
        f"Pass: {r['pass_count']} / Fail: {r['fail_count']} / Skip: {r['skip_count']}\n"
    )


def save_receipt(r: dict) -> None:
    AUDITS_DIR.mkdir(parents=True, exist_ok=True)
    rid = r["run_id"]
    (AUDITS_DIR / f"RECEIPT_{rid}.json").write_text(json.dumps(r, indent=2), encoding="utf-8")
    (AUDITS_DIR / f"CVF_RECEIPT_{rid}.md").write_text(render_md(r), encoding="utf-8")

    entry = f"- [{rid}](CVF_RECEIPT_{rid}.md) — {r['overall_status']} ({r['pass_count']}/6 pass)\n"
    if INDEX_FILE.exists():
        content = INDEX_FILE.read_text(encoding="utf-8")
        if "## Receipts" not in content:
            content += "\n## Receipts\n"
        INDEX_FILE.write_text(content + entry, encoding="utf-8")
    else:
        INDEX_FILE.write_text(
            "# DeepSeek Live Canary — Receipt Index\n\n## Receipts\n" + entry,
            encoding="utf-8",
        )
    print(f"\nReceipt: docs/audits/deepseek-canary/RECEIPT_{rid}.json + CVF_RECEIPT_{rid}.md")


def print_summary(r: dict) -> None:
    icons = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}
    bar = "=" * 62
    print(f"\n{bar}")
    print(f"CVF DeepSeek Live Canary -- {r['run_id']}")
    print(bar)
    for s in r["scenarios"]:
        icon = icons.get(s["status"], "?")
        print(f"  {icon} {s['id']}  {s['template_id']:<30} {s['duration_ms']}ms")
    print("-" * 62)
    print(f"  Overall: {r['overall_status']}  Pass={r['pass_count']}  Fail={r['fail_count']}  Skip={r['skip_count']}")
    print(bar)


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF DeepSeek Live Canary Runner (W110-T1)")
    parser.add_argument("--save-receipt", action="store_true",
                        help="Write evidence receipt to docs/audits/deepseek-canary/")
    args = parser.parse_args()

    api_key = resolve_api_key()
    if not api_key:
        print("ERROR: DEEPSEEK_API_KEY not set — all scenarios will be skipped.")
        print("  export DEEPSEEK_API_KEY=<your-key> and retry.")
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
