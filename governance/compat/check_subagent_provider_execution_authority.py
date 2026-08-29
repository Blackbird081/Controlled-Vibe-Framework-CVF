#!/usr/bin/env python3
"""Fail closed when CVF provider execution is not orchestrator-granted."""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK_ORDER_MARKERS = ("WORK_ORDER", "DISPATCH")
EXECUTION_TERMS = ("provider", "api key", "credential", "live run", "live test")

INVARIANTS = {
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts": (
        "providerExecution: ProviderExecutionGrant;",
        'authorizedBy !== "ORCHESTRATOR"',
        "call budget exhausted",
    ),
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/test/provider-execution-guard.ts": (
        "CVF_PROVIDER_EXECUTION_DENIED",
        "evaluateProviderExecutionAuthority",
    ),
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/test/setup.ts": (
        "createProviderExecutionFetchGuard",
    ),
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/test/load-local-env.ts": (
        "CVF_PROVIDER_EXECUTION_GRANT_JSON",
        "ORCHESTRATOR_ONLY_KEYS",
    ),
    "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json": (
        '"test:live": "vitest list --mode live live.test --filesOnly"',
    ),
}


def changed_paths(base: str, head: str) -> set[str]:
    commands = (
        ["git", "diff", "--name-only", base, head],
        ["git", "diff", "--name-only"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    )
    paths: set[str] = set()
    for command in commands:
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, check=False)
        if result.returncode == 0:
            paths.update(line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip())
    return paths


def check_invariants() -> list[str]:
    issues: list[str] = []
    for relative, tokens in INVARIANTS.items():
        path = ROOT / relative
        text = path.read_text(encoding="utf-8") if path.exists() else ""
        for token in tokens:
            if token not in text:
                issues.append(f"{relative}: missing invariant token {token!r}")
    return issues


def check_dispatch(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    lowered = text.lower()
    if not any(term in lowered for term in EXECUTION_TERMS):
        return []
    if "providerExecutionAuthority: FORBIDDEN" in text:
        return []
    try:
        label = path.relative_to(ROOT).as_posix()
    except ValueError:
        label = path.name
    if "providerExecutionAuthority: ORCHESTRATOR_GRANT_REQUIRED" not in text:
        return [f"{label}: missing providerExecutionAuthority"]
    required = (
        "providerExecutionGrantOwner: ORCHESTRATOR",
        "providerExecutionGrantSubject:",
        "providerExecutionGrantDelegationId:",
        "providerExecutionGrantMaxCalls:",
        "providerExecutionGrantExpiresAt:",
    )
    return [
        f"{label}: missing {token}"
        for token in required
        if token not in text
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    issues = check_invariants()
    for relative in changed_paths(args.base, args.head):
        path = ROOT / relative
        if path.suffix.lower() != ".md" or not any(marker in path.name.upper() for marker in WORK_ORDER_MARKERS):
            continue
        issues.extend(check_dispatch(path))
    if issues:
        print("VIOLATION - subagent provider execution authority is not fail-closed.")
        for issue in issues:
            print(f"- {issue}")
        return 1 if args.enforce else 0
    print("COMPLIANT - subagent provider execution requires orchestrator authority.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
