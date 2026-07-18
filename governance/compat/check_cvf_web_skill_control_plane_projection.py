#!/usr/bin/env python3
"""Validate CVF Web Skill Control Plane projection drift."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
INVENTORY_PATH = (
    REPO_ROOT
    / "docs/reference/agent_system_skills/control_plane/generated/skill-inventory.json"
)
WEB_ROOT = REPO_ROOT / "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web"
WEB_SKILL_INDEX_PATH = WEB_ROOT / "public/data/skills-index.json"
WEB_CONTROL_PLANE_PATH = WEB_ROOT / "public/data/assf-skill-control-plane.json"
WEB_CONTROL_PLANE_RELATIVE = "public/data/assf-skill-control-plane.json"


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _normalize_path(value: object) -> str:
    return str(value or "").replace("\\", "/")


def _skills_by_id(web_index: dict[str, Any]) -> dict[str, dict[str, Any]]:
    skills: dict[str, dict[str, Any]] = {}
    for category in web_index.get("categories", []):
        if not isinstance(category, dict):
            continue
        for skill in category.get("skills", []):
            if isinstance(skill, dict) and skill.get("id"):
                skills[str(skill["id"])] = skill
    return skills


def _runtime_inventory_records(inventory: dict[str, Any]) -> list[dict[str, Any]]:
    records = []
    for record in inventory.get("records", []):
        if isinstance(record, dict) and record.get("runtime", {}).get("eligible") is True:
            records.append(record)
    return records


def check_projection(
    *,
    inventory_path: Path = INVENTORY_PATH,
    web_index_path: Path = WEB_SKILL_INDEX_PATH,
    web_control_plane_path: Path = WEB_CONTROL_PLANE_PATH,
) -> list[str]:
    """Return projection drift violations."""
    violations: list[str] = []

    for label, path in (
        ("inventory", inventory_path),
        ("web skill index", web_index_path),
        ("web control plane projection", web_control_plane_path),
    ):
        if not path.exists():
            violations.append(f"{label} not found: {path.as_posix()}")
    if violations:
        return violations

    inventory = _load_json(inventory_path)
    web_index = _load_json(web_index_path)
    web_projection = _load_json(web_control_plane_path)

    runtime_records = _runtime_inventory_records(inventory)
    runtime_ids = {str(record.get("skillId")) for record in runtime_records if record.get("skillId")}
    projection_records = {
        str(record.get("skillId")): record
        for record in web_projection.get("runtimePackages", [])
        if isinstance(record, dict) and record.get("skillId")
    }
    web_skills = _skills_by_id(web_index)

    contract = str(web_projection.get("dashboardContract", "")).lower()
    for required in ("read-only", "not runtime authority", "activation authority", "provider authority"):
        if required not in contract:
            violations.append(f"dashboardContract missing boundary phrase: {required}")

    inventory_summary = inventory.get("summary", {})
    projection_summary = web_projection.get("summary", {})
    web_meta = web_index.get("meta", {})
    expected_runtime_count = len(runtime_ids)

    if projection_summary.get("runtimeEligiblePackages") != inventory_summary.get("runtimeEligiblePackages"):
        violations.append(
            "summary.runtimeEligiblePackages does not match Skill Control Plane inventory"
        )
    if projection_summary.get("projectedRuntimePackages") != expected_runtime_count:
        violations.append(
            "summary.projectedRuntimePackages does not match runtime eligible inventory records"
        )
    if web_meta.get("runtimePackageProjections") != expected_runtime_count:
        violations.append("skills-index meta.runtimePackageProjections does not match runtime package count")
    if _normalize_path(web_meta.get("skillControlPlaneProjection")) != WEB_CONTROL_PLANE_RELATIVE:
        violations.append("skills-index meta.skillControlPlaneProjection does not point to Web projection")

    missing_projection = sorted(runtime_ids.difference(projection_records))
    if missing_projection:
        violations.append(
            "runtime eligible packages missing from assf-skill-control-plane.json: "
            + ", ".join(missing_projection)
        )

    missing_web = sorted(
        skill_id
        for skill_id in runtime_ids
        if not (
            web_skills.get(skill_id, {}).get("runtimePackageProjection") is True
            and web_skills.get(skill_id, {}).get("assfProjectionClass") == "CERTIFIED_PACKAGE_PROJECTION"
        )
    )
    if missing_web:
        violations.append(
            "runtime eligible packages missing runtime Web projection flags: "
            + ", ".join(missing_web)
        )

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate CVF Web Skill Control Plane projection drift"
    )
    parser.add_argument("--inventory-path", type=Path, default=INVENTORY_PATH)
    parser.add_argument("--web-index-path", type=Path, default=WEB_SKILL_INDEX_PATH)
    parser.add_argument("--web-control-plane-path", type=Path, default=WEB_CONTROL_PLANE_PATH)
    parser.add_argument("--enforce", action="store_true")
    args = parser.parse_args(argv)

    print("=== CVF Web Skill Control Plane Projection Check ===")
    print(f"Inventory: {args.inventory_path.as_posix()}")
    print(f"Web index: {args.web_index_path.as_posix()}")
    print(f"Web projection: {args.web_control_plane_path.as_posix()}")
    violations = check_projection(
        inventory_path=args.inventory_path,
        web_index_path=args.web_index_path,
        web_control_plane_path=args.web_control_plane_path,
    )
    print(f"Violations: {len(violations)}")
    if violations:
        for violation in violations:
            print(f"  - {violation}")
        print("\nVIOLATION - CVF Web skill projection is not aligned.")
        return 1 if args.enforce else 0

    print("\nCOMPLIANT - CVF Web skill projection is aligned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
