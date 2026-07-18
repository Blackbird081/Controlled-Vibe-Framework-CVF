"""
CCLV-T2 Advisory checker for closure central facts packets and local reference blocks.

Validates:
  - Markdown central facts packets (## Central Facts Packet section with field table)
  - JSON central facts packets (schemaId: cvf.closureCentralFacts.v1)
  - Local reference blocks (Central Facts Reference: <path>)

Default mode: advisory - prints violations and exits 0.
--enforce mode: exits non-zero when violations exist.

Usage:
  python check_central_facts_reference.py --base <sha> --head <ref>
  python check_central_facts_reference.py --paths <file1> [<file2> ...]
  python check_central_facts_reference.py --base <sha> --head <ref> --enforce

EPISTEMIC_PROCESS_NA_WITH_REASON: advisory governance checker; not an evidence-heavy
analysis packet - no empirical prediction, provider call, or corpus claim is made.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, NamedTuple, Optional, Tuple


CENTRAL_FACTS_REQUIRED_FIELDS = (
    "batchId",
    "baseHead",
    "materialCommit",
    "sessionSyncCommit",
    "expectedChangedSet",
    "actualChangedSet",
    "roadmapStatus",
    "workOrderStatus",
    "completionReview",
    "publicExportDisposition",
    "findingRootCauseSummary",
    "claimBoundary",
)

LOCAL_REFERENCE_SUB_FIELDS = (
    "Local View Role",
    "Local Disposition",
    "Local Delta",
)

SCHEMA_ID = "cvf.closureCentralFacts.v1"

OPT_IN_MARKERS = (
    "## Central Facts Packet",
    '"schemaId": "cvf.closureCentralFacts.v1"',
    "schemaId: cvf.closureCentralFacts.v1",
    "fieldOrder",
    "templateInstance",
)

LOCAL_REF_MARKER = "Central Facts Reference:"


class Violation(NamedTuple):
    path: str
    check_id: str
    message: str


def _add(violations: List[Violation], path: str, check_id: str, message: str) -> None:
    violations.append(Violation(path=path, check_id=check_id, message=message))


def _changed_paths(base: str, head: str) -> List[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base}..{head}"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return []
    return [p.strip() for p in result.stdout.splitlines() if p.strip()]


def _repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode == 0 and result.stdout.strip():
        return Path(result.stdout.strip())
    return Path.cwd()


def _has_opt_in(text: str) -> bool:
    for marker in OPT_IN_MARKERS:
        if marker in text:
            return True
    return False


def _has_local_ref(text: str) -> bool:
    return LOCAL_REF_MARKER in text


def _validate_markdown_packet(path: str, text: str) -> List[Violation]:
    """Validate a Markdown file that contains ## Central Facts Packet."""
    violations: List[Violation] = []
    if "## Central Facts Packet" not in text:
        return violations

    missing = []
    for field in CENTRAL_FACTS_REQUIRED_FIELDS:
        pattern = rf"[|`]\s*`?{re.escape(field)}`?\s*[|`]"
        if not re.search(pattern, text):
            missing.append(field)

    if missing:
        _add(
            violations,
            path,
            "central_facts_packet_missing_fields",
            "## Central Facts Packet section is missing required fields: "
            + ", ".join(missing),
        )
    return violations


def _validate_json_packet(path: str, text: str) -> List[Violation]:
    """Validate a JSON file that carries the closureCentralFacts schema."""
    violations: List[Violation] = []
    if SCHEMA_ID not in text and '"fieldOrder"' not in text and '"templateInstance"' not in text:
        return violations

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        _add(
            violations,
            path,
            "central_facts_json_parse_error",
            f"JSON parse error in central facts file: {exc}",
        )
        return violations

    field_order = data.get("fieldOrder", [])
    if not isinstance(field_order, list):
        _add(
            violations,
            path,
            "central_facts_json_field_order_not_list",
            "fieldOrder must be a JSON array",
        )
        field_order = []

    missing_fo = [f for f in CENTRAL_FACTS_REQUIRED_FIELDS if f not in field_order]
    if missing_fo:
        _add(
            violations,
            path,
            "central_facts_json_field_order_incomplete",
            "fieldOrder is missing required fields: " + ", ".join(missing_fo),
        )

    template = data.get("templateInstance")
    if template is not None and isinstance(template, dict):
        missing_ti = [f for f in CENTRAL_FACTS_REQUIRED_FIELDS if f not in template]
        if missing_ti:
            _add(
                violations,
                path,
                "central_facts_json_template_instance_incomplete",
                "templateInstance is missing required keys: " + ", ".join(missing_ti),
            )

    return violations


def _is_in_code_fence(lines: List[str], target_idx: int) -> bool:
    """Return True if the line at target_idx is inside a markdown code fence."""
    fence_count = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_count += 1
        if i == target_idx:
            break
    return (fence_count % 2) == 1


def _is_placeholder(ref_path: str) -> bool:
    """Return True if the path value is a template placeholder (not a real path)."""
    return "<" in ref_path or ">" in ref_path


def _validate_local_reference(
    path: str, text: str, repo_root: Path
) -> List[Violation]:
    """Validate local reference blocks containing 'Central Facts Reference:'."""
    violations: List[Violation] = []
    lines = text.splitlines()
    real_refs_found = False

    for line_no, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped.startswith(LOCAL_REF_MARKER):
            continue

        if _is_in_code_fence(lines, line_no - 1):
            continue

        ref_value = stripped[len(LOCAL_REF_MARKER):].strip()
        if not ref_value:
            _add(
                violations,
                path,
                "local_ref_empty_path",
                f"Line {line_no}: Central Facts Reference is empty; must point to a packet path.",
            )
            continue

        if _is_placeholder(ref_value):
            continue

        real_refs_found = True
        ref_path_part = ref_value.split("#")[0].strip()
        target = repo_root / ref_path_part
        if not target.exists():
            _add(
                violations,
                path,
                "local_ref_target_not_found",
                f"Line {line_no}: Central Facts Reference target does not exist: {ref_path_part}",
            )

    if real_refs_found:
        for sub_field in LOCAL_REFERENCE_SUB_FIELDS:
            if sub_field + ":" not in text:
                _add(
                    violations,
                    path,
                    "local_ref_missing_sub_field",
                    f"File contains Central Facts Reference but is missing sub-field: {sub_field}:",
                )

    return violations


def _validate_file(path: str, repo_root: Path) -> List[Violation]:
    violations: List[Violation] = []

    abs_path = repo_root / path if not os.path.isabs(path) else Path(path)
    if not abs_path.exists():
        return violations

    try:
        text = abs_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return violations

    lower_name = abs_path.name.lower()
    is_json = lower_name.endswith(".json")

    if not _has_opt_in(text) and not _has_local_ref(text):
        return violations

    if is_json:
        violations.extend(_validate_json_packet(path, text))
    else:
        violations.extend(_validate_markdown_packet(path, text))
        if _has_local_ref(text):
            violations.extend(_validate_local_reference(path, text, repo_root))

    return violations


def _run(paths: List[str], repo_root: Path) -> Tuple[int, List[Violation]]:
    all_violations: List[Violation] = []
    for p in paths:
        all_violations.extend(_validate_file(p, repo_root))
    return len(all_violations), all_violations


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="CCLV-T2 advisory checker for closure central facts packets and local references."
    )
    parser.add_argument("--base", help="Base git ref for changed-file discovery.")
    parser.add_argument("--head", default="HEAD", help="Head git ref (default: HEAD).")
    parser.add_argument(
        "--paths", nargs="+", help="Explicit repo-relative paths to validate."
    )
    parser.add_argument(
        "--enforce",
        action="store_true",
        help="Exit non-zero when violations are found (default: advisory, always exit 0).",
    )
    args = parser.parse_args(argv)

    repo_root = _repo_root()

    if args.paths:
        paths = args.paths
    elif args.base:
        paths = _changed_paths(args.base, args.head)
    else:
        parser.print_help()
        return 0

    if not paths:
        print("check_central_facts_reference: no paths to validate.")
        return 0

    count, violations = _run(paths, repo_root)

    if violations:
        print(
            f"check_central_facts_reference: {count} violation(s) found "
            f"across {len(paths)} path(s):"
        )
        for v in violations:
            print(f"  [{v.check_id}] {v.path}: {v.message}")
    else:
        print(
            f"check_central_facts_reference: COMPLIANT - {len(paths)} path(s) checked, 0 violations."
        )

    if args.enforce and violations:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
