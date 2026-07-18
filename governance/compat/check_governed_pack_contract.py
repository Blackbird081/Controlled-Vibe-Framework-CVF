#!/usr/bin/env python3
"""CVF governed pack contract guard.

Validates that every governed pack folder contains the required 3-file
contract and that each file satisfies its content invariants.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
POLICY = "governance/toolkit/05_OPERATION/CVF_GOVERNED_PACK_CONTRACT_GUARD.md"
DEFAULT_PACKS_ROOT = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs"
DEFAULT_TEMPLATES_ROOT = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates"
REQUIRED_PACK_FILES = ("workflow.spec.md", "execution.policy.json", "receipt.schema.json")
TEMPLATE_ID_RE = re.compile(r"\bid\s*:\s*['\"]([^'\"]+)['\"]")
NUMBERED_ITEM_RE = re.compile(r"^\s*\d+[\.)]\s+", re.MULTILINE)
SUPPORTED_SCHEMA_MARKERS = ("draft-07", "2019-09", "2020-12")


def _read_text(path: Path) -> str:
    if not path.exists() or path.is_dir():
        return ""
    return path.read_text(encoding="utf-8", errors="replace")


def _load_json(path: Path) -> tuple[Any | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except Exception as exc:
        return None, str(exc)


def _discover_template_ids(templates_root: Path) -> set[str]:
    ids: set[str] = set()
    if not templates_root.exists():
        return ids
    for path in templates_root.glob("*.ts"):
        ids.update(TEMPLATE_ID_RE.findall(_read_text(path)))
    return ids


def _workflow_section(text: str) -> str:
    match = re.search(r"^## Workflow\s*$", text, re.MULTILINE)
    if not match:
        return ""
    rest = text[match.end():]
    next_heading = re.search(r"^##\s+", rest, re.MULTILINE)
    return rest[: next_heading.start()] if next_heading else rest


def _contains_key(value: Any, key: str) -> bool:
    if isinstance(value, dict):
        return key in value or any(_contains_key(item, key) for item in value.values())
    if isinstance(value, list):
        return any(_contains_key(item, key) for item in value)
    return False


def _schema_draft_supported(schema: Any) -> bool:
    if not isinstance(schema, dict):
        return False
    marker = schema.get("$schema")
    return isinstance(marker, str) and any(item in marker for item in SUPPORTED_SCHEMA_MARKERS)


def _violation(rule: str, pack: str, path: str, issue: str) -> dict[str, str]:
    return {"rule": rule, "pack": pack, "path": path, "issue": issue}


def check_pack(pack_dir: Path, template_ids: set[str]) -> list[dict[str, str]]:
    pack_name = pack_dir.name
    violations: list[dict[str, str]] = []
    missing = [name for name in REQUIRED_PACK_FILES if not (pack_dir / name).exists()]
    for name in missing:
        violations.append(_violation("A", pack_name, str(pack_dir / name), "missing required pack file"))
    if missing:
        return violations

    policy_path = pack_dir / "execution.policy.json"
    policy, error = _load_json(policy_path)
    if error or not isinstance(policy, dict):
        violations.append(_violation("B", pack_name, str(policy_path), f"invalid execution.policy.json: {error}"))
    else:
        template_id = policy.get("templateId")
        if not isinstance(template_id, str) or not template_id:
            violations.append(_violation("B", pack_name, str(policy_path), "missing templateId"))
        elif template_id not in template_ids:
            violations.append(_violation("B", pack_name, str(policy_path), f"templateId not found in templates: {template_id}"))

    workflow_path = pack_dir / "workflow.spec.md"
    workflow = _workflow_section(_read_text(workflow_path))
    if not workflow:
        violations.append(_violation("C", pack_name, str(workflow_path), "missing ## Workflow section"))
    elif not NUMBERED_ITEM_RE.search(workflow):
        violations.append(_violation("C", pack_name, str(workflow_path), "## Workflow section has no numbered item"))

    receipt_path = pack_dir / "receipt.schema.json"
    schema, error = _load_json(receipt_path)
    if error:
        violations.append(_violation("D", pack_name, str(receipt_path), f"invalid receipt.schema.json: {error}"))
    else:
        if not _schema_draft_supported(schema):
            violations.append(_violation("D", pack_name, str(receipt_path), "receipt schema must declare draft-07 or later"))
        if not _contains_key(schema, "stepTraces"):
            violations.append(_violation("D", pack_name, str(receipt_path), "receipt schema missing stepTraces"))

    return violations


def run_check(packs_root: Path, templates_root: Path) -> dict[str, Any]:
    template_ids = _discover_template_ids(templates_root)
    pack_dirs = sorted(path for path in packs_root.iterdir() if path.is_dir()) if packs_root.exists() else []
    violations: list[dict[str, str]] = []
    if not packs_root.exists():
        violations.append(_violation("A", "(packs-root)", str(packs_root), "governed-packs directory missing"))
    for pack_dir in pack_dirs:
        violations.extend(check_pack(pack_dir, template_ids))
    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "policy": POLICY,
        "packsRoot": str(packs_root),
        "templatesRoot": str(templates_root),
        "packCount": len(pack_dirs),
        "templateIdCount": len(template_ids),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": len(violations) == 0,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Governed Pack Contract Guard ===")
    print(f"Policy: {report['policy']}")
    print(f"Packs: {report['packCount']}")
    print(f"Template IDs: {report['templateIdCount']}")
    print(f"Violations: {report['violationCount']}")
    if report["violations"]:
        print("\nViolations:")
        for violation in report["violations"]:
            print(f"  - Rule {violation['rule']} {violation['pack']}: {violation['issue']} ({violation['path']})")
    if report["compliant"]:
        print("\nCOMPLIANT - governed pack contracts are aligned.")
    else:
        print("\nVIOLATION - governed pack contract drift detected.")


def _resolve_path(path_value: str) -> Path:
    path = Path(path_value)
    return path if path.is_absolute() else REPO_ROOT / path


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Check governed pack contract invariants")
    parser.add_argument("--packs-root", default=DEFAULT_PACKS_ROOT)
    parser.add_argument("--templates-root", default=DEFAULT_TEMPLATES_ROOT)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args()

    report = run_check(_resolve_path(args.packs_root), _resolve_path(args.templates_root))
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)
    return 2 if args.enforce and not report["compliant"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
