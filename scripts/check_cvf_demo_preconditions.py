#!/usr/bin/env python3
"""
CVF Demo Preconditions Check — 2026-04-21
Verifies that all required conditions are met before running a live CVF demo.

Usage:
  python scripts/check_cvf_demo_preconditions.py

Output:
  DEMO READY
  DEMO READY (WARNINGS)
  DEMO NOT READY

Exit codes:
  0  DEMO READY or DEMO READY (WARNINGS)
  1  DEMO NOT READY (one or more FAIL conditions)
"""
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
CVF_WEB = REPO_ROOT / "EXTENSIONS" / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web"
PROVIDER_READINESS = REPO_ROOT / "scripts" / "check_cvf_provider_release_readiness.py"

REQUIRED_RC_DOCS = [
    REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md",
    REPO_ROOT / "docs" / "reference" / "CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md",
    REPO_ROOT / "docs" / "guides" / "CVF_DEMO_SCRIPT_2026-04-21.md",
]


@dataclass
class PreCondition:
    name: str
    level: str          # PASS | WARN | FAIL
    message: str
    detail: list[str] = field(default_factory=list)


def platform_cmd(cmd: list[str]) -> list[str]:
    if os.name != "nt" or not cmd:
        return cmd
    exe = shutil.which(cmd[0])
    if exe:
        return [exe, *cmd[1:]]
    cmd_exe = shutil.which(f"{cmd[0]}.cmd")
    if cmd_exe:
        return [cmd_exe, *cmd[1:]]
    return cmd


def run_cmd(cmd: list[str], cwd: Path | None = None, timeout: int = 30) -> tuple[int, str, str]:
    try:
        r = subprocess.run(
            platform_cmd(cmd),
            cwd=cwd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return 1, "", "Command timed out"
    except Exception as e:
        return 1, "", str(e)


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_node_modules() -> PreCondition:
    name = "node_modules installed"
    nm = CVF_WEB / "node_modules"
    if nm.exists() and nm.is_dir():
        return PreCondition(name, "PASS", "node_modules present")
    return PreCondition(
        name, "WARN",
        "node_modules not found — run: cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm ci",
        [str(nm)],
    )


def check_dashscope_key() -> PreCondition:
    name = "DASHSCOPE_API_KEY env var"
    key = os.environ.get("DASHSCOPE_API_KEY", "")
    if key and len(key) > 8:
        return PreCondition(name, "PASS", "DASHSCOPE_API_KEY is set (Alibaba live demo path enabled)")
    return PreCondition(
        name, "WARN",
        "DASHSCOPE_API_KEY not set — demo Path C (live Alibaba governance) will be limited",
    )


def check_provider_certified() -> PreCondition:
    name = "Alibaba provider lane CERTIFIED"
    if not PROVIDER_READINESS.exists():
        return PreCondition(
            name, "WARN",
            "Provider readiness script not found — skipping certification check",
            [str(PROVIDER_READINESS)],
        )
    code, stdout, stderr = run_cmd(
        [sys.executable, str(PROVIDER_READINESS), "--json"], timeout=15
    )
    if code != 0:
        return PreCondition(
            name, "WARN",
            "Provider readiness evaluator failed — cannot verify certification",
            stderr.splitlines()[:3],
        )
    try:
        data = json.loads(stdout)
        certified = data.get("certified_count", 0)
        status = data.get("status", "UNKNOWN")
        if certified > 0:
            return PreCondition(
                name, "PASS",
                f"CERTIFIED lanes: {certified} — status: {status}",
            )
        canary = data.get("canary_pass_count", 0)
        if canary > 0:
            return PreCondition(
                name, "WARN",
                f"No CERTIFIED lane yet; {canary} CANARY_PASS lane(s). Run 3 consecutive canaries to promote.",
            )
        return PreCondition(
            name, "FAIL",
            "No lane has CERTIFIED status — live governance demo requires at least one certified provider",
        )
    except json.JSONDecodeError:
        return PreCondition(
            name, "WARN",
            "Provider readiness output is not valid JSON — cannot verify certification",
            stdout.splitlines()[:3],
        )


def check_demo_script() -> PreCondition:
    name = "Demo script present"
    script = REPO_ROOT / "docs" / "guides" / "CVF_DEMO_SCRIPT_2026-04-21.md"
    if script.exists():
        return PreCondition(name, "PASS", f"Demo script found: {script.relative_to(REPO_ROOT)}")
    return PreCondition(
        name, "FAIL",
        "Demo script not found — cannot run a structured demo without it",
        [str(script.relative_to(REPO_ROOT))],
    )


def check_rc_docs() -> PreCondition:
    name = "RC documentation present"
    missing = [str(d.relative_to(REPO_ROOT)) for d in REQUIRED_RC_DOCS if not d.exists()]
    if not missing:
        return PreCondition(
            name, "PASS",
            f"All {len(REQUIRED_RC_DOCS)} RC docs present",
        )
    return PreCondition(
        name, "FAIL",
        f"{len(missing)} required RC doc(s) missing",
        missing,
    )


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

ICONS = {"PASS": "PASS", "WARN": "WARN", "FAIL": "FAIL"}
BAR = "=" * 68


def print_results(results: list[PreCondition]) -> int:
    print(f"\n{BAR}")
    print("  CVF DEMO PRECONDITIONS CHECK")
    print(BAR)

    for r in results:
        icon = ICONS[r.level]
        print(f"  [{icon:<4}] {r.name}")
        print(f"         {r.message}")
        for d in r.detail[:3]:
            print(f"           {d}")

    print(f"\n{'-' * 68}")
    passes = sum(1 for r in results if r.level == "PASS")
    warns = sum(1 for r in results if r.level == "WARN")
    fails = sum(1 for r in results if r.level == "FAIL")
    print(f"  PASS: {passes}  WARN: {warns}  FAIL: {fails}")

    if fails:
        print(f"\n  DEMO RESULT: DEMO NOT READY ({fails} blocking issue(s))")
        print(BAR + "\n")
        return 1
    elif warns:
        print(f"\n  DEMO RESULT: DEMO READY (WARNINGS) — {warns} non-blocking warning(s)")
        print(BAR + "\n")
        return 0
    else:
        print(f"\n  DEMO RESULT: DEMO READY")
        print(BAR + "\n")
        return 0


def main() -> None:
    results: list[PreCondition] = [
        check_node_modules(),
        check_dashscope_key(),
        check_provider_certified(),
        check_demo_script(),
        check_rc_docs(),
    ]
    sys.exit(print_results(results))


if __name__ == "__main__":
    main()
