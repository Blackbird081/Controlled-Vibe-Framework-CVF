#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY_PATHS = [
    "governance/toolkit/05_OPERATION/CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md",
    "governance/toolkit/05_OPERATION/CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md",
]
BARREL_PATH = (
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts"
)
SMOKE_TEST_PATH = (
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts"
)
OWNERSHIP_REGISTRY_PATH = (
    "governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json"
)
MAX_BARREL_LINES = 40
MAX_SMOKE_LINES = 400
ALLOWED_BARREL_EXPORT = re.compile(r'^export \* from "\./[a-z0-9.\-]+barrel";$')
IMPORT_PATTERN = re.compile(r'from\s+"([^"]+)"')
ALLOWED_SMOKE_IMPORT_PREFIXES = ("vitest", "../src/index", "./helpers/")


def _read_text(rel_path: str) -> str:
    path = REPO_ROOT / rel_path
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _read_json(rel_path: str) -> dict:
    path = REPO_ROOT / rel_path
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _collect_forbidden_patterns(target_path: str) -> list[str]:
    payload = _read_json(OWNERSHIP_REGISTRY_PATH)
    forbidden: list[str] = []
    for partition in payload.get("partitions", []):
        if target_path in partition.get("forbiddenFiles", []):
            forbidden.extend(partition.get("forbiddenPatterns", []))
    return sorted(set(forbidden))


def _classify() -> dict:
    violations: list[dict[str, str]] = []

    barrel_text = _read_text(BARREL_PATH)
    smoke_text = _read_text(SMOKE_TEST_PATH)
    barrel_lines = barrel_text.splitlines()
    smoke_lines = smoke_text.splitlines()

    if not barrel_text:
      violations.append({"type": "missing_barrel", "path": BARREL_PATH, "message": "CPF public barrel is missing."})
    else:
        if len(barrel_lines) > MAX_BARREL_LINES:
            violations.append({
                "type": "barrel_too_large",
                "path": BARREL_PATH,
                "message": f"{BARREL_PATH} has {len(barrel_lines)} lines; limit is {MAX_BARREL_LINES}.",
            })
        for line_no, raw_line in enumerate(barrel_lines, start=1):
            line = raw_line.strip()
            if not line or line.startswith("//"):
                continue
            if not ALLOWED_BARREL_EXPORT.fullmatch(line):
                violations.append({
                    "type": "barrel_non_export_content",
                    "path": BARREL_PATH,
                    "message": f"{BARREL_PATH}:{line_no} must remain a pure re-export line.",
                })

    if not smoke_text:
        violations.append({"type": "missing_smoke_test", "path": SMOKE_TEST_PATH, "message": "CPF barrel smoke test is missing."})
    else:
        if len(smoke_lines) > MAX_SMOKE_LINES:
            violations.append({
                "type": "smoke_test_too_large",
                "path": SMOKE_TEST_PATH,
                "message": f"{SMOKE_TEST_PATH} has {len(smoke_lines)} lines; limit is {MAX_SMOKE_LINES}.",
            })

        for line_no, raw_line in enumerate(smoke_lines, start=1):
            for match in IMPORT_PATTERN.finditer(raw_line):
                source = match.group(1)
                if not source.startswith(ALLOWED_SMOKE_IMPORT_PREFIXES):
                    violations.append({
                        "type": "smoke_import_outside_barrel_boundary",
                        "path": SMOKE_TEST_PATH,
                        "message": f"{SMOKE_TEST_PATH}:{line_no} imports `{source}` outside approved barrel/helper paths.",
                    })

        for forbidden in _collect_forbidden_patterns(SMOKE_TEST_PATH):
            if forbidden in smoke_text:
                violations.append({
                    "type": "smoke_reintroduced_owned_surface",
                    "path": SMOKE_TEST_PATH,
                    "message": f"{SMOKE_TEST_PATH} reintroduces forbidden owned symbol `{forbidden}`.",
                })

    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policies": POLICY_PATHS,
        "barrelPath": BARREL_PATH,
        "smokeTestPath": SMOKE_TEST_PATH,
        "barrelLineCount": len(barrel_lines),
        "smokeLineCount": len(smoke_lines),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }


def _print_report(report: dict) -> None:
    print("=== CVF CPF Public Surface Maintainability Gate ===")
    print(f"Barrel: {report['barrelPath']} ({report['barrelLineCount']} lines)")
    print(f"Smoke:  {report['smokeTestPath']} ({report['smokeLineCount']} lines)")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\n❌ Violations:")
        for violation in report["violations"]:
            print(f"  - [{violation['type']}] {violation['message']}")
    else:
        print("\n✅ COMPLIANT — CPF public barrel and smoke ownership stay maintainable.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check CPF public surface maintainability")
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
