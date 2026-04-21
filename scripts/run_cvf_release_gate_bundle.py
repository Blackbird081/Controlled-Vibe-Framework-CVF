#!/usr/bin/env python3
"""
CVF Release Gate Bundle — 2026-04-21
Runs all release-readiness checks in sequence. Makes no live API calls by default.

Usage:
  python scripts/run_cvf_release_gate_bundle.py
  python scripts/run_cvf_release_gate_bundle.py --mock
  python scripts/run_cvf_release_gate_bundle.py --dry-run
  python scripts/run_cvf_release_gate_bundle.py --json

Flags:
  --mock     Skip live API calls; use saved receipts only (default for CI)
  --dry-run  Print what would run without executing anything
  --json     Machine-readable output (implies --mock)

Exit codes:
  0  All checks PASS (warnings allowed)
  1  One or more checks FAIL
"""
import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
CVF_WEB = REPO_ROOT / "EXTENSIONS" / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web"
GUARD_CONTRACT = REPO_ROOT / "EXTENSIONS" / "CVF_GUARD_CONTRACT"
PROVIDER_READINESS = REPO_ROOT / "scripts" / "check_cvf_provider_release_readiness.py"

# Required docs for the docs governance check
REQUIRED_DOCS = [
    REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md",
    REPO_ROOT / "docs" / "reference" / "CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md",
    REPO_ROOT / "docs" / "guides" / "CVF_DEMO_SCRIPT_2026-04-21.md",
]

# Patterns that indicate a committed secret
SECRET_PATTERNS = [
    r"sk-[A-Za-z0-9]{20,}",                 # OpenAI / Anthropic-style keys
    r"DASHSCOPE_API_KEY\s*=\s*['\"][^'\"]+", # Alibaba DashScope inline value
    r"DEEPSEEK_API_KEY\s*=\s*['\"][^'\"]+",  # DeepSeek inline value
    r"api[_-]?key\s*=\s*['\"][A-Za-z0-9_\-]{16,}['\"]",  # generic api_key = "..."
    r"-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----",      # private keys
    r"ghp_[A-Za-z0-9]{36}",                 # GitHub personal access token
    r"ANTHROPIC_API_KEY\s*=\s*['\"][^'\"]+", # Anthropic inline value
]

# Files/dirs to skip in secrets scan
SCAN_SKIP = {
    ".git", "node_modules", "__pycache__", ".next", "dist", "build",
    "coverage", ".nyc_output", "docs/audits",  # receipts contain masked keys only
}

SCAN_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx", ".env", ".json", ".md", ".yaml", ".yml", ".sh"}


@dataclass
class CheckResult:
    name: str
    status: str          # PASS | WARN | FAIL | SKIP
    message: str
    detail: list[str] = field(default_factory=list)


def run_cmd(cmd: list[str], cwd: Path | None = None, timeout: int = 300) -> tuple[int, str, str]:
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as e:
        return 1, "", str(e)


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_web_build(dry_run: bool) -> CheckResult:
    name = "Web build (npm run build)"
    if dry_run:
        return CheckResult(name, "SKIP", "dry-run — would run: npm run build", [str(CVF_WEB)])
    if not CVF_WEB.exists():
        return CheckResult(name, "FAIL", "cvf-web directory not found", [str(CVF_WEB)])
    code, stdout, stderr = run_cmd(["npm", "run", "build"], cwd=CVF_WEB, timeout=300)
    if code == 0:
        return CheckResult(name, "PASS", "Build succeeded")
    lines = (stdout + stderr).splitlines()
    errors = [l for l in lines if "error" in l.lower() or "Error" in l][:10]
    return CheckResult(name, "FAIL", "Build failed", errors or lines[-10:])


def check_ts_typecheck(dry_run: bool) -> CheckResult:
    name = "TypeScript check (guard contract)"
    if dry_run:
        return CheckResult(name, "SKIP", "dry-run — would run: npm run check", [str(GUARD_CONTRACT)])
    if not GUARD_CONTRACT.exists():
        return CheckResult(name, "FAIL", "CVF_GUARD_CONTRACT directory not found")
    code, stdout, stderr = run_cmd(["npm", "run", "check"], cwd=GUARD_CONTRACT, timeout=120)
    if code == 0:
        return CheckResult(name, "PASS", "TypeScript check clean")
    lines = (stdout + stderr).splitlines()
    errors = [l for l in lines if "error" in l.lower()][:10]
    return CheckResult(name, "FAIL", "TypeScript errors found", errors or lines[-10:])


def check_provider_readiness(dry_run: bool, mock: bool) -> CheckResult:
    name = "Provider readiness"
    if dry_run:
        return CheckResult(name, "SKIP", "dry-run — would run: check_cvf_provider_release_readiness.py --json")
    if not PROVIDER_READINESS.exists():
        return CheckResult(name, "FAIL", "Provider readiness script not found")
    code, stdout, stderr = run_cmd(
        [sys.executable, str(PROVIDER_READINESS), "--json"], timeout=30
    )
    if code != 0:
        return CheckResult(name, "FAIL", "Provider readiness evaluator failed", stderr.splitlines()[:5])
    try:
        data = json.loads(stdout)
        certified = data.get("certified_count", 0)
        canary = data.get("canary_pass_count", 0)
        status = data.get("status", "UNKNOWN")
        if certified > 0:
            return CheckResult(name, "PASS", f"CERTIFIED lanes: {certified} — status: {status}")
        elif canary > 0:
            return CheckResult(name, "WARN", f"No CERTIFIED lane; {canary} CANARY_PASS lane(s). Multi-provider operability proven.")
        else:
            return CheckResult(name, "FAIL", "No lane has passed a full canary")
    except json.JSONDecodeError:
        return CheckResult(name, "FAIL", "Provider readiness output is not valid JSON", stdout.splitlines()[:5])


def check_secrets(dry_run: bool) -> CheckResult:
    name = "Secrets scan"
    if dry_run:
        return CheckResult(name, "SKIP", f"dry-run — would scan {REPO_ROOT} for secret patterns")

    compiled = [re.compile(p) for p in SECRET_PATTERNS]
    hits: list[str] = []

    for path in REPO_ROOT.rglob("*"):
        # Skip irrelevant dirs
        if any(skip in path.parts for skip in SCAN_SKIP):
            continue
        if not path.is_file():
            continue
        if path.suffix not in SCAN_EXTENSIONS:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for line_no, line in enumerate(text.splitlines(), 1):
            for pat in compiled:
                if pat.search(line):
                    rel = path.relative_to(REPO_ROOT)
                    hits.append(f"{rel}:{line_no}")
                    break
        if len(hits) >= 20:
            break

    if hits:
        return CheckResult(name, "FAIL", f"Potential secrets found in {len(hits)} location(s)", hits)
    return CheckResult(name, "PASS", "No secret patterns detected")


def check_docs_governance() -> CheckResult:
    name = "Docs governance (RC docs present)"
    missing = [str(d.relative_to(REPO_ROOT)) for d in REQUIRED_DOCS if not d.exists()]
    if missing:
        return CheckResult(name, "FAIL", f"{len(missing)} required RC doc(s) missing", missing)
    return CheckResult(name, "PASS", f"All {len(REQUIRED_DOCS)} required RC docs present")


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

ICONS = {"PASS": "PASS", "WARN": "WARN", "FAIL": "FAIL", "SKIP": "SKIP"}
BAR = "=" * 68


def print_results(results: list[CheckResult], date: str) -> int:
    print(f"\n{BAR}")
    print(f"  CVF RELEASE GATE BUNDLE — {date}")
    print(BAR)

    for r in results:
        icon = ICONS[r.status]
        print(f"  [{icon:<4}] {r.name}")
        print(f"         {r.message}")
        for d in r.detail[:5]:
            print(f"           {d}")

    print(f"\n{'-' * 68}")
    passes = sum(1 for r in results if r.status == "PASS")
    warns = sum(1 for r in results if r.status == "WARN")
    fails = sum(1 for r in results if r.status == "FAIL")
    skips = sum(1 for r in results if r.status == "SKIP")
    print(f"  PASS: {passes}  WARN: {warns}  FAIL: {fails}  SKIP: {skips}")
    if fails:
        print(f"\n  GATE RESULT: FAIL ({fails} check(s) failed)")
    elif warns:
        print(f"\n  GATE RESULT: PASS ({warns} warning(s))")
    else:
        print(f"\n  GATE RESULT: PASS")
    print(BAR + "\n")
    return 1 if fails else 0


def json_output(results: list[CheckResult], date: str) -> int:
    fails = sum(1 for r in results if r.status == "FAIL")
    out = {
        "date": date,
        "gate_result": "FAIL" if fails else "PASS",
        "checks": [
            {"name": r.name, "status": r.status, "message": r.message, "detail": r.detail}
            for r in results
        ],
    }
    print(json.dumps(out, indent=2))
    return 1 if fails else 0


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="CVF Release Gate Bundle")
    parser.add_argument("--mock", action="store_true", help="Skip live API calls (uses saved receipts)")
    parser.add_argument("--dry-run", action="store_true", dest="dry_run", help="Print what would run without executing")
    parser.add_argument("--json", action="store_true", dest="json_out", help="Machine-readable JSON output (implies --mock)")
    args = parser.parse_args()

    if args.json_out:
        args.mock = True

    from datetime import date
    today = date.today().isoformat()

    if args.dry_run:
        print(f"\nCVF Release Gate Bundle — DRY RUN ({today})")
        print("The following checks would run:\n")

    results: list[CheckResult] = [
        check_web_build(args.dry_run),
        check_ts_typecheck(args.dry_run),
        check_provider_readiness(args.dry_run, args.mock),
        check_secrets(args.dry_run),
        check_docs_governance(),
    ]

    if args.json_out:
        sys.exit(json_output(results, today))
    else:
        sys.exit(print_results(results, today))


if __name__ == "__main__":
    main()
