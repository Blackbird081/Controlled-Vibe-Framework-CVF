#!/usr/bin/env python3
"""CVF ASSF certified metadata admission checker.

The checker is read-only. It verifies that any ASSF registry entry admitted as
CERTIFIED has the bounded metadata needed before another surface may cite it as
certification evidence.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_COMPAT_DIR = Path(__file__).resolve().parent
if str(_COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(_COMPAT_DIR))

from generate_assf_skill_index import (  # noqa: E402
    ENTRIES_DIR,
    INDEX_PATH,
    REPO_ROOT,
    load_source_entries,
    validate_index_matches_sources,
)


CERTIFIED = "CERTIFIED"
PASSED = "PASSED"
ACTIVE = "ACTIVE"
IMPLEMENTED = "IMPLEMENTED"
PROHIBITED = "PROHIBITED"
ALLOWED_EXTERNAL_DISPOSITIONS = {
    "PROHIBITED",
    "DEFERRED_WITH_REASON",
    "IMPLEMENTED",
}


def _load_json_object(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path}: expected JSON object")
    return value


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _upper(value: Any) -> str:
    return _as_text(value).upper()


def _is_na_with_reason(value: Any) -> bool:
    return _as_text(value).lower().startswith("n/a with reason")


def _path_is_repo_relative(value: str) -> bool:
    normalized = value.replace("\\", "/")
    if not normalized or normalized.startswith("/") or normalized.startswith("../"):
        return False
    if "/../" in normalized or normalized.endswith("/.."):
        return False
    if ":" in normalized:
        return False
    return True


def _review_artifact_violations(
    skill_id: str,
    review_artifacts: Any,
    repo_root: Path,
) -> list[str]:
    violations: list[str] = []
    if not isinstance(review_artifacts, list) or not review_artifacts:
        return [f"{skill_id}: CERTIFIED entry must list reviewArtifacts"]

    for item in review_artifacts:
        rel = _as_text(item)
        if not _path_is_repo_relative(rel):
            violations.append(
                f"{skill_id}: reviewArtifact must be repo-relative: {rel!r}"
            )
            continue
        artifact_path = repo_root / rel
        if not artifact_path.is_file():
            violations.append(
                f"{skill_id}: reviewArtifact does not exist: {rel}"
            )
    return violations


def _check_certified_entry(
    entry: dict[str, Any],
    generated_entry: dict[str, Any] | None,
    repo_root: Path,
) -> list[str]:
    skill_id = _as_text(entry.get("skillId")) or "<missing skillId>"
    violations: list[str] = []

    if _upper(entry.get("uatState")) != PASSED:
        violations.append(
            f"{skill_id}: certificationState CERTIFIED requires uatState PASSED"
        )

    violations.extend(
        _review_artifact_violations(
            skill_id,
            entry.get("reviewArtifacts"),
            repo_root,
        )
    )

    if generated_entry is None:
        violations.append(f"{skill_id}: generated index is missing certified entry")
    else:
        for field in ("certificationState", "uatState", "reviewArtifacts"):
            if generated_entry.get(field) != entry.get(field):
                violations.append(
                    f"{skill_id}: generated index field {field} does not match source"
                )

    resolver_behavior = _as_text(entry.get("resolverBehavior")).lower()
    if "metadata-only" not in resolver_behavior:
        violations.append(
            f"{skill_id}: resolverBehavior must preserve metadata-only boundary"
        )

    loader_boundary = _as_text(entry.get("loaderBoundary")).lower()
    if "never grants" not in loader_boundary:
        violations.append(
            f"{skill_id}: loaderBoundary must state loading never grants authority"
        )

    external_disposition = _upper(entry.get("externalCliMcpDisposition"))
    if external_disposition not in ALLOWED_EXTERNAL_DISPOSITIONS:
        violations.append(
            f"{skill_id}: externalCliMcpDisposition is not an allowed value"
        )
    if external_disposition == IMPLEMENTED:
        if _is_na_with_reason(entry.get("adapterContract")):
            violations.append(
                f"{skill_id}: IMPLEMENTED external adapter requires adapterContract"
            )
        if _is_na_with_reason(entry.get("adapterEvidence")):
            violations.append(
                f"{skill_id}: IMPLEMENTED external adapter requires adapterEvidence"
            )
    if external_disposition != PROHIBITED and not _as_text(
        entry.get("externalMutationBoundary")
    ):
        violations.append(
            f"{skill_id}: non-PROHIBITED external disposition requires "
            "externalMutationBoundary"
        )

    if _upper(entry.get("status")) == ACTIVE:
        if _upper(entry.get("candidateState")) != ACTIVE:
            violations.append(
                f"{skill_id}: ACTIVE status requires candidateState ACTIVE"
            )
        if _upper(entry.get("internalAgentDisposition")) != IMPLEMENTED:
            violations.append(
                f"{skill_id}: ACTIVE status requires internalAgentDisposition IMPLEMENTED"
            )
        if external_disposition != IMPLEMENTED:
            violations.append(
                f"{skill_id}: ACTIVE status requires externalCliMcpDisposition IMPLEMENTED"
            )
        if _is_na_with_reason(entry.get("adapterContract")):
            violations.append(
                f"{skill_id}: ACTIVE status requires concrete adapterContract"
            )
        if _is_na_with_reason(entry.get("adapterEvidence")):
            violations.append(
                f"{skill_id}: ACTIVE status requires concrete adapterEvidence"
            )

    return violations


def check(
    index_path: Path = INDEX_PATH,
    entries_dir: Path = ENTRIES_DIR,
    *,
    repo_root: Path = REPO_ROOT,
    require_certified: bool = False,
) -> list[str]:
    """Return certified metadata admission violations."""
    violations: list[str] = []
    violations.extend(validate_index_matches_sources(index_path, entries_dir))

    try:
        entries = load_source_entries(entries_dir)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return [f"ASSF registry source load failed: {exc}"]

    if not entries_dir.exists():
        return violations

    try:
        generated_index = _load_json_object(index_path)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        return violations + [f"ASSF generated index load failed: {exc}"]

    generated_by_id: dict[str, dict[str, Any]] = {}
    for item in generated_index.get("skills", []):
        if isinstance(item, dict) and _as_text(item.get("skillId")):
            generated_by_id[_as_text(item.get("skillId"))] = item

    certified_count = 0
    seen_ids: set[str] = set()
    for entry in entries:
        skill_id = _as_text(entry.get("skillId"))
        if not skill_id:
            violations.append("ASSF registry entry missing skillId")
            continue
        if skill_id in seen_ids:
            violations.append(f"{skill_id}: duplicate skillId in ASSF registry")
        seen_ids.add(skill_id)

        if _upper(entry.get("certificationState")) != CERTIFIED:
            continue

        certified_count += 1
        violations.extend(
            _check_certified_entry(
                entry,
                generated_by_id.get(skill_id),
                repo_root,
            )
        )

    if require_certified and certified_count == 0:
        violations.append("no ASSF registry entry has certificationState CERTIFIED")

    return violations


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check bounded admission for CERTIFIED ASSF metadata"
    )
    parser.add_argument(
        "--require-certified",
        action="store_true",
        help="Fail when the registry contains no CERTIFIED entry",
    )
    args = parser.parse_args()

    print("=== CVF ASSF Certified Metadata Admission Check ===")
    violations = check(require_certified=args.require_certified)
    if violations:
        print("ADMISSION VIOLATIONS:")
        for violation in violations:
            print(f"  - {violation}")
        print("\nFAIL - ASSF certified metadata admission is not bounded.")
        return 1

    print("PASS - ASSF certified metadata admission is bounded and consistent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
