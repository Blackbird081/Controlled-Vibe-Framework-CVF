#!/usr/bin/env python3
"""Enforce TPGR manifest activation and validate shadow routing receipts."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

try:
    from route_task_governance import load_registry, route_manifest
except ModuleNotFoundError:
    from governance.compat.route_task_governance import load_registry, route_manifest

REPO_ROOT = Path(__file__).resolve().parents[2]
STANDARD_PATH = "docs/reference/CVF_TASK_PROPORTIONAL_GOVERNANCE_ROUTING_STANDARD_2026-08-17.md"
ACTIVE_STATUSES = {"DISPATCH_READY", "READY", "ACTIVE", "APPROVED_FOR_EXECUTION"}
MANIFEST_HEADING = "## Task Governance Routing Manifest"
JSON_BLOCK = re.compile(r"## Task Governance Routing Manifest\s*```json\s*(\{.*?\})\s*```", re.DOTALL)
STATUS = re.compile(r"(?m)^Status:\s*([A-Z0-9_]+)\s*$")


def _run_git(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(["git", *args], cwd=REPO_ROOT, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def _changed_paths(base: str, head: str) -> list[str]:
    proc = _run_git("diff", "--name-only", f"{base}..{head}")
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or "git diff failed")
    paths = {line.strip().replace("\\", "/") for line in proc.stdout.splitlines() if line.strip()}
    if head == "HEAD":
        worktree = _run_git("diff", "--name-only")
        cached = _run_git("diff", "--cached", "--name-only")
        untracked = _run_git("ls-files", "--others", "--exclude-standard")
        for result in (worktree, cached, untracked):
            if result.returncode == 0:
                paths.update(line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip())
    return sorted(paths)


def _activated_at_base(base: str) -> bool:
    return _run_git("cat-file", "-e", f"{base}:{STANDARD_PATH}").returncode == 0


def _manifest_from_markdown(text: str) -> dict:
    match = JSON_BLOCK.search(text)
    if not match:
        raise ValueError("missing exact Task Governance Routing Manifest JSON block")
    payload = json.loads(match.group(1))
    if not isinstance(payload, dict):
        raise ValueError("routing manifest JSON must be an object")
    return payload


def _uncovered_paths(changed: list[str], carrier: str, families: list[str]) -> list[str]:
    return sorted(
        path for path in changed
        if path != carrier and not any(path == family or path.startswith(family.rstrip("/") + "/") for family in families)
    )


def evaluate(base: str, head: str) -> dict:
    registry = load_registry()
    changed = _changed_paths(base, head)
    activated = _activated_at_base(base)
    checked: list[dict] = []
    violations: list[str] = []
    for path in changed:
        if not path.startswith("docs/work_orders/") or not path.endswith(".md"):
            continue
        full = REPO_ROOT / path
        if not full.is_file():
            continue
        text = full.read_text(encoding="utf-8")
        status_match = STATUS.search(text)
        status = status_match.group(1) if status_match else "MISSING"
        if status not in ACTIVE_STATUSES:
            continue
        if not activated:
            checked.append({"path": path, "status": status, "routing": "SHADOW_ACTIVATION_COMMIT"})
            continue
        try:
            manifest = _manifest_from_markdown(text)
            receipt = route_manifest(manifest, registry)
            checked.append({"path": path, "status": status, "receipt": receipt})
            if receipt["receiptStatus"] != "ROUTED_SHADOW":
                violations.append(f"{path}: invalid route manifest: {'; '.join(receipt['validationErrors'])}")
            else:
                uncovered = _uncovered_paths(changed, path, manifest["pathFamilies"])
                if uncovered:
                    violations.append(f"{path}: changed paths not covered by pathFamilies: {', '.join(uncovered)}")
        except (ValueError, json.JSONDecodeError) as exc:
            violations.append(f"{path}: {exc}")
    return {
        "schemaVersion": "cvf.taskGovernanceRouteCheck.v1",
        "activation": "ACTIVE" if activated else "SHADOW_ACTIVATION_COMMIT",
        "selectiveExecutionAuthorized": False,
        "legacyGateDisposition": "RUN_FULL_LEGACY_BUNDLE",
        "changedPaths": changed,
        "workOrdersChecked": checked,
        "violations": violations,
        "status": "COMPLIANT" if not violations else "VIOLATION",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="HEAD")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--enforce", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)
    try:
        report = evaluate(args.base, args.head)
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as exc:
        report = {"status": "VIOLATION", "violations": [str(exc)], "selectiveExecutionAuthorized": False, "legacyGateDisposition": "RUN_FULL_LEGACY_BUNDLE"}
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("=== CVF Task-Proportional Governance Route Gate ===")
        print(f"Activation: {report.get('activation', 'ERROR')}")
        print("Selective execution authorized: false")
        print("Legacy gate disposition: RUN_FULL_LEGACY_BUNDLE")
        print(f"Active work orders checked: {len(report.get('workOrdersChecked', []))}")
        print(f"Violations: {len(report.get('violations', []))}")
        for violation in report.get("violations", []):
            print(f"  - {violation}")
        print(report["status"])
    return 1 if args.enforce and report["status"] != "COMPLIANT" else 0


if __name__ == "__main__":
    sys.exit(main())
