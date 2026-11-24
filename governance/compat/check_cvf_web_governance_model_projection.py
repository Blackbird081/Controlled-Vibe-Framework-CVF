#!/usr/bin/env python3
"""Check the generated CVF Web governance model against its Local sources."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess


REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATOR = Path("EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/scripts/build-governance-model.js")


def check_projection(repo_root: Path) -> list[str]:
    root = repo_root.resolve()
    generator = root / GENERATOR
    if not generator.is_file():
        return [f"Missing Web projection generator: {GENERATOR.as_posix()}"]
    node = shutil.which("node")
    if node is None:
        return ["Node.js is required to check the CVF Web governance projection."]
    try:
        result = subprocess.run(
            [node, str(generator), "--check", "--repo-root", str(root)],
            cwd=root,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired) as error:
        return [f"Unable to check the CVF Web governance projection: {error}"]
    if result.returncode == 0:
        return []
    detail = result.stderr.strip() or result.stdout.strip()
    return [detail or f"Web projection generator exited with status {result.returncode}."]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPO_ROOT, help="Repository root. Defaults to this checkout.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()
    issues = check_projection(args.root)
    if args.json:
        print(json.dumps({"violationCount": len(issues), "violations": issues}))
    else:
        print("=== CVF Web Governance Model Projection ===")
        for issue in issues:
            print(f"- {issue}")
        if not issues:
            print("PASS: risk, phases, roles and authority match Local.")
    return int(args.enforce and bool(issues))


if __name__ == "__main__":
    raise SystemExit(main())
