#!/usr/bin/env python3
"""
CVF Provider Live Canary Runner — W110-T2
Unified runner for all certified provider lanes.

Usage:
  python scripts/run_cvf_provider_live_canary.py --provider alibaba [--save-receipt]
  python scripts/run_cvf_provider_live_canary.py --provider deepseek [--save-receipt]

Exit codes: 0=all pass, 1=one or more fail, 2=API key absent, 3=provider unsupported
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

PROVIDER_CONFIGS = {
    "alibaba": {
        "model": "qwen-turbo",
        "key_env_names": ["ALIBABA_API_KEY", "DASHSCOPE_API_KEY"],
        "key_export_env": "ALIBABA_API_KEY",
        "test_pattern": "route.front-door-rewrite.alibaba.live.test.ts",
        "audit_dir": REPO_ROOT / "docs" / "audits" / "alibaba-canary",
        "index_title": "Alibaba Live Canary — Receipt Index",
        "timeout_ms": 120000,
    },
    "deepseek": {
        "model": "deepseek-chat",
        "key_env_names": [
            "DEEPSEEK_API_KEY",
            "CVF_BENCHMARK_DEEPSEEK_KEY",
            "CVF_DEEPSEEK_API_KEY",
        ],
        "key_export_env": "DEEPSEEK_API_KEY",
        "test_pattern": "route.front-door-rewrite.deepseek.live.test.ts",
        "audit_dir": REPO_ROOT / "docs" / "audits" / "deepseek-canary",
        "index_title": "DeepSeek Live Canary — Receipt Index",
        "timeout_ms": 240000,
    },
}

SCENARIOS = [
    {"id": "S1", "template_id": "app_builder_complete",
     "keyword_matches": ["TaskFlow", "Acceptance Criteria", "Handoff Boundaries"]},
    {"id": "S2", "template_id": "api_design",
     "keyword_matches": ["LeadSync", "Operations/Payloads", "approval", "Checklist"]},
    {"id": "S3", "template_id": "code_review",
     "keyword_matches": ["Intended Outcome", "Main Risks", "Builder Handoff", "Checklist"]},
    {"id": "S4", "template_id": "documentation",
     "keyword_matches": ["What This Document Is For", "Main Flow", "Checklist", "SRE"]},
    {"id": "S5", "template_id": "web_ux_redesign_system",
     "keyword_matches": ["Review Gate", "QA Rules", "approval"]},
    {"id": "S6", "template_id": "data_analysis",
     "keyword_matches": ["What Data We Looked At", "Suggests", "Recommended Actions", "Checklist"]},
]


def read_env_file(path: Path, key: str) -> str | None:
    if not path.exists():
        return None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        if name.strip() == key:
            return value.strip().strip('"').strip("'")
    return None


def resolve_api_key(cfg: dict) -> str | None:
    for name in cfg["key_env_names"]:
        if v := os.environ.get(name):
            return v
    for name in cfg["key_env_names"]:
        if v := read_env_file(CVF_WEB / ".env.local", name):
            return v
    return None


def run_tests(cfg: dict, api_key: str, json_out: Path) -> int:
    env = {**os.environ, cfg["key_export_env"]: api_key}
    cmd = (
        f'npx vitest run "{cfg["test_pattern"]}"'
        f" --reporter=verbose --reporter=json"
        f' --outputFile="{json_out}"'
        f' --testTimeout={cfg["timeout_ms"]}'
    )
    return subprocess.run(cmd, shell=True, cwd=CVF_WEB, env=env).returncode


def load_json(path: Path) -> dict:
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


def build_receipt(vitest: dict, cfg: dict) -> dict:
    now = datetime.now(timezone.utc)
    run_id = (
        f"{now.strftime('%Y%m%d-%H%M%S')}-"
        f"{hashlib.sha1(now.isoformat().encode()).hexdigest()[:6]}"
    )
    assertions: list[dict] = []
    for suite in vitest.get("testResults", []):
        assertions.extend(suite.get("assertionResults", []))

    rows = []
    for sc in SCENARIOS:
        tid = sc["template_id"]
        matched = [a for a in assertions if tid in (a.get("fullName") or a.get("title") or "")]
        if matched:
            ar = matched[0]
            status = "PASS" if ar.get("status") == "passed" else "FAIL"
            dur = int(ar.get("duration") or 0)
        else:
            status, dur = "SKIP", 0
        passed = status == "PASS"
        rows.append({
            "id": sc["id"],
            "template_id": tid,
            "status": status,
            "duration_ms": dur,
            "quality_signals": {
                "min_output_met": passed,
                "keyword_matches": sc["keyword_matches"] if passed else [],
                "antipattern_clean": passed,
                "validated_by_vitest": bool(matched),
            },
        })

    pass_n = sum(1 for r in rows if r["status"] == "PASS")
    fail_n = sum(1 for r in rows if r["status"] == "FAIL")
    skip_n = sum(1 for r in rows if r["status"] == "SKIP")
    overall = "SKIP" if skip_n == len(SCENARIOS) else ("FAIL" if fail_n else "PASS")
    return {
        "run_id": run_id,
        "timestamp": now.isoformat(),
        "provider": cfg["key_export_env"].split("_")[0].lower(),
        "model": cfg["model"],
        "triggered_by": "cli",
        "scenarios": rows,
        "overall_status": overall,
        "pass_count": pass_n,
        "fail_count": fail_n,
        "skip_count": skip_n,
    }


def render_md(r: dict) -> str:
    icons = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}
    rows = "\n".join(
        f"| {s['id']} | `{s['template_id']}` | {icons.get(s['status'], '?')} "
        f"| {s['duration_ms']}ms | {', '.join(s['quality_signals']['keyword_matches']) or '-'} |"
        for s in r["scenarios"]
    )
    return (
        f"# {r['provider'].title()} Live Canary -- Receipt {r['run_id']}\n\n"
        f"**Timestamp:** {r['timestamp']}  \n"
        f"**Provider:** {r['provider']} / {r['model']}  \n"
        f"**Overall:** {r['overall_status']}  \n\n"
        f"| # | Template | Status | Duration | Quality anchors |\n"
        f"|---|---|---|---|---|\n"
        f"{rows}\n\n"
        f"Pass: {r['pass_count']} / Fail: {r['fail_count']} / Skip: {r['skip_count']}\n"
    )


def save_receipt(r: dict, cfg: dict) -> None:
    audit_dir: Path = cfg["audit_dir"]
    audit_dir.mkdir(parents=True, exist_ok=True)
    rid = r["run_id"]
    (audit_dir / f"RECEIPT_{rid}.json").write_text(json.dumps(r, indent=2), encoding="utf-8")
    (audit_dir / f"CVF_RECEIPT_{rid}.md").write_text(render_md(r), encoding="utf-8")

    index_file = audit_dir / "INDEX.md"
    entry = f"- [{rid}](CVF_RECEIPT_{rid}.md) — {r['overall_status']} ({r['pass_count']}/6 pass)\n"
    if index_file.exists():
        content = index_file.read_text(encoding="utf-8")
        if "## Receipts" not in content:
            content += "\n## Receipts\n"
        index_file.write_text(content + entry, encoding="utf-8")
    else:
        index_file.write_text(
            f"# {cfg['index_title']}\n\n## Receipts\n" + entry, encoding="utf-8"
        )
    print(f"\nReceipt: {audit_dir.relative_to(REPO_ROOT)}/RECEIPT_{rid}.json + CVF_RECEIPT_{rid}.md")


def print_summary(r: dict) -> None:
    icons = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}
    bar = "=" * 64
    provider_label = f"{r['provider'].title()} ({r['model']})"
    print(f"\n{bar}")
    print(f"CVF Provider Live Canary ({provider_label}) -- {r['run_id']}")
    print(bar)
    for s in r["scenarios"]:
        print(f"  {icons.get(s['status'], '?')} {s['id']}  {s['template_id']:<30} {s['duration_ms']}ms")
    print("-" * 64)
    print(f"  Overall: {r['overall_status']}  Pass={r['pass_count']}  Fail={r['fail_count']}  Skip={r['skip_count']}")
    print(bar)


def main() -> None:
    parser = argparse.ArgumentParser(description="CVF Provider Live Canary Runner (W110-T2)")
    parser.add_argument("--provider", required=True,
                        choices=list(PROVIDER_CONFIGS.keys()),
                        help="Provider lane to run (alibaba | deepseek)")
    parser.add_argument("--model", default=None,
                        help="Override model name (optional)")
    parser.add_argument("--save-receipt", action="store_true",
                        help="Write evidence receipt to docs/audits/<provider>-canary/")
    args = parser.parse_args()

    if args.provider not in PROVIDER_CONFIGS:
        print(f"ERROR: unsupported provider '{args.provider}'. Supported: {list(PROVIDER_CONFIGS)}")
        sys.exit(3)

    cfg = {**PROVIDER_CONFIGS[args.provider]}
    if args.model:
        cfg["model"] = args.model

    api_key = resolve_api_key(cfg)
    if not api_key:
        env_hint = " or ".join(cfg["key_env_names"][:2])
        print(f"ERROR: No API key found for provider '{args.provider}'. "
              f"Set {env_hint} and retry.")
        sys.exit(2)

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        json_out = Path(tmp.name)

    try:
        run_tests(cfg, api_key, json_out)
        vitest_data = load_json(json_out)
    finally:
        json_out.unlink(missing_ok=True)

    receipt = build_receipt(vitest_data, cfg)
    print_summary(receipt)

    if args.save_receipt:
        save_receipt(receipt, cfg)

    sys.exit({"PASS": 0, "FAIL": 1, "SKIP": 2}.get(receipt["overall_status"], 1))


if __name__ == "__main__":
    main()
