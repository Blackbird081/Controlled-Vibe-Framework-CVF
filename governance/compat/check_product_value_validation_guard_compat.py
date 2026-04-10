#!/usr/bin/env python3
"""
CVF Product Value Validation Guard Compatibility Gate

Ensures that the canonical product-value validation chain stays aligned:
- guard exists
- roadmap exists
- corpus/rubric/run-manifest/assessment templates exist
- master policy references the control
- control matrix registers the control
- session bootstrap routes to the control
- docs index points to the canonical templates
- local hook chain and CI workflow run this gate
- changed product-value validation artifacts contain the required sections
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_CANDIDATES = ("origin/main", "origin/master", "main", "master")

GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md"
ROADMAP_PATH = "docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md"
NEXT_WAVE_ROADMAP_PATH = "docs/roadmaps/CVF_POST_W64_NEXT_CAPABILITY_WAVE_ROADMAP_2026-04-10.md"
CORPUS_TEMPLATE_PATH = "docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md"
RUBRIC_TEMPLATE_PATH = "docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md"
RUN_MANIFEST_TEMPLATE_PATH = "docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md"
ASSESSMENT_TEMPLATE_PATH = "docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md"
MASTER_POLICY_PATH = "governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md"
CONTROL_MATRIX_PATH = "docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md"
BOOTSTRAP_PATH = "docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md"
DOCS_INDEX_PATH = "docs/INDEX.md"
README_PATH = "docs/reference/README.md"
HOOK_CHAIN_PATH = "governance/compat/run_local_governance_hook_chain.py"
WORKFLOW_PATH = ".github/workflows/documentation-testing.yml"
THIS_SCRIPT_PATH = "governance/compat/check_product_value_validation_guard_compat.py"

REQUIRED_FILES = (
    GUARD_PATH,
    ROADMAP_PATH,
    NEXT_WAVE_ROADMAP_PATH,
    CORPUS_TEMPLATE_PATH,
    RUBRIC_TEMPLATE_PATH,
    RUN_MANIFEST_TEMPLATE_PATH,
    ASSESSMENT_TEMPLATE_PATH,
    MASTER_POLICY_PATH,
    CONTROL_MATRIX_PATH,
    BOOTSTRAP_PATH,
    DOCS_INDEX_PATH,
    README_PATH,
    HOOK_CHAIN_PATH,
    WORKFLOW_PATH,
)

REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    GUARD_PATH: (
        "Control ID:",
        "GC-042",
        "Docker sandbox",
        CORPUS_TEMPLATE_PATH,
        RUBRIC_TEMPLATE_PATH,
        RUN_MANIFEST_TEMPLATE_PATH,
        ASSESSMENT_TEMPLATE_PATH,
        THIS_SCRIPT_PATH,
    ),
    ROADMAP_PATH: (
        "Product Value Validation Wave",
        "Docker sandbox",
        "90",
        "540 runs",
        "catastrophic miss",
        "100% audit completeness",
        "PASS / PARTIAL / FAIL",
    ),
    NEXT_WAVE_ROADMAP_PATH: (
        "Product Value Validation Wave",
        "Docker sandbox",
        ROADMAP_PATH,
    ),
    CORPUS_TEMPLATE_PATH: (
        "## 1. Corpus Metadata",
        "## 5. Task Record Template",
        "## 6. Corpus Coverage Checks",
        "90",
    ),
    RUBRIC_TEMPLATE_PATH: (
        "## 3. Outcome Quality Scoring",
        "## 6. Failure Taxonomy",
        "## 8. Run-Level Verdict Template",
        "catastrophic",
    ),
    RUN_MANIFEST_TEMPLATE_PATH: (
        "## 1. Run Set Metadata",
        "## 4. Execution Rules",
        "## 6. Run Record Template",
        "evidence_complete",
    ),
    ASSESSMENT_TEMPLATE_PATH: (
        "## 4. Comparative Readout",
        "## 5. Hard Gate Results",
        "## 7. Verdict",
        "## 9. Docker Sandbox Decision",
    ),
    MASTER_POLICY_PATH: (
        "GC-042",
        GUARD_PATH,
        "product value",
    ),
    CONTROL_MATRIX_PATH: (
        "GC-042",
        GUARD_PATH,
        ROADMAP_PATH,
        CORPUS_TEMPLATE_PATH,
        RUBRIC_TEMPLATE_PATH,
        RUN_MANIFEST_TEMPLATE_PATH,
        ASSESSMENT_TEMPLATE_PATH,
        THIS_SCRIPT_PATH,
    ),
    BOOTSTRAP_PATH: (
        "GC-042",
        "product-value validation",
    ),
    DOCS_INDEX_PATH: (
        "reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md",
        "reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md",
        "reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md",
        "reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md",
    ),
    README_PATH: (
        "CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md",
        "CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md",
        "CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md",
        "CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md",
    ),
    HOOK_CHAIN_PATH: (
        THIS_SCRIPT_PATH,
    ),
    WORKFLOW_PATH: (
        THIS_SCRIPT_PATH,
        "Product Value Validation Guard",
        "product-value-validation-guard",
    ),
}

DOC_PATTERNS: dict[str, re.Pattern[str]] = {
    "corpus": re.compile(r"^docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_(?!TEMPLATE).+\.md$"),
    "rubric": re.compile(r"^docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_(?!TEMPLATE).+\.md$"),
    "run_manifest": re.compile(r"^docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_.+\.md$"),
    "assessment": re.compile(r"^docs/assessments/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_.+\.md$"),
}

DOC_REQUIRED_MARKERS: dict[str, tuple[str, ...]] = {
    "corpus": (
        "## 1. Corpus Metadata",
        "## 5. Task Record Template",
        "## 6. Corpus Coverage Checks",
    ),
    "rubric": (
        "## 3. Outcome Quality Scoring",
        "## 6. Failure Taxonomy",
        "## 8. Run-Level Verdict Template",
    ),
    "run_manifest": (
        "## 1. Run Set Metadata",
        "## 4. Execution Rules",
        "## 6. Run Record Template",
    ),
    "assessment": (
        "## 4. Comparative Readout",
        "## 5. Hard Gate Results",
        "## 7. Verdict",
        "## 9. Docker Sandbox Decision",
    ),
}


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _ref_exists(ref: str) -> bool:
    code, _, _ = _run_git(["rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}"])
    return code == 0


def _discover_default_base(head: str) -> tuple[str, str]:
    env_base = os.getenv("CVF_COMPAT_BASE")
    if env_base:
        return env_base, "env:CVF_COMPAT_BASE"

    for ref in DEFAULT_BASE_CANDIDATES:
        if not _ref_exists(ref):
            continue
        code, out, _ = _run_git(["merge-base", ref, head])
        if code == 0 and out:
            return out, f"merge-base({ref},{head})"

    return "HEAD~1", "fallback:HEAD~1"


def _resolve_range(base: str | None, head: str | None) -> tuple[str, str, str]:
    resolved_head = head or "HEAD"
    if base:
        return base, resolved_head, "explicit:--base"
    resolved_base, source = _discover_default_base(resolved_head)
    return resolved_base, resolved_head, source


def _parse_name_status_output(output: str) -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for raw_line in output.splitlines():
        if not raw_line.strip():
            continue
        parts = raw_line.split("\t")
        status = parts[0].strip()
        if status.startswith("R") or status.startswith("C"):
            if len(parts) < 3:
                continue
            path = parts[2]
        else:
            if len(parts) < 2:
                continue
            path = parts[1]
        normalized = path.replace("\\", "/").strip()
        changed.setdefault(normalized, set()).add(status)
    return changed


def _get_changed_name_status(base: str, head: str) -> dict[str, set[str]]:
    code, out, err = _run_git(["diff", "--name-status", f"{base}..{head}"])
    if code != 0:
        raise RuntimeError(f"git diff failed for range {base}..{head}: {err or out}")
    return _parse_name_status_output(out)


def _get_worktree_name_status() -> dict[str, set[str]]:
    changed: dict[str, set[str]] = {}
    for args in (["diff", "--name-status"], ["diff", "--name-status", "--cached"]):
        code, out, _ = _run_git(args)
        if code == 0 and out:
            for path, statuses in _parse_name_status_output(out).items():
                changed.setdefault(path, set()).update(statuses)

    code, out, _ = _run_git(["ls-files", "--others", "--exclude-standard"])
    if code == 0 and out:
        for raw_line in out.splitlines():
            normalized = raw_line.replace("\\", "/").strip()
            if normalized:
                changed.setdefault(normalized, set()).add("A")
    return changed


def _merge_changed_maps(*maps: dict[str, set[str]]) -> dict[str, list[str]]:
    merged: dict[str, set[str]] = {}
    for changed_map in maps:
        for path, statuses in changed_map.items():
            merged.setdefault(path, set()).update(statuses)
    return {path: sorted(statuses) for path, statuses in sorted(merged.items())}


def _resolve_changed_paths(base: str | None, head: str | None) -> tuple[dict[str, list[str]], str, str, str]:
    resolved_base, resolved_head, base_source = _resolve_range(base, head)
    range_changes = _get_changed_name_status(resolved_base, resolved_head)
    worktree_changes = _get_worktree_name_status()
    return _merge_changed_maps(range_changes, worktree_changes), resolved_base, resolved_head, base_source


def _read_text(path: str) -> str:
    return (REPO_ROOT / path).read_text(encoding="utf-8")


def _match_doc_kind(path: str) -> str | None:
    for kind, pattern in DOC_PATTERNS.items():
        if pattern.match(path):
            return kind
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the CVF product value validation guard chain.")
    parser.add_argument("--base", help="Base git ref/sha for changed-file detection.")
    parser.add_argument("--head", help="Head git ref/sha for changed-file detection.")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on violations.")
    args = parser.parse_args()

    changed_paths, resolved_base, resolved_head, base_source = _resolve_changed_paths(args.base, args.head)
    violations: list[dict[str, str]] = []

    for path in REQUIRED_FILES:
        if not (REPO_ROOT / path).exists():
            violations.append({"type": "missing_required_file", "path": path, "message": "Required file is missing."})
            continue
        text = _read_text(path)
        for marker in REQUIRED_MARKERS.get(path, ()):
            if marker not in text:
                violations.append(
                    {
                        "type": "missing_marker",
                        "path": path,
                        "message": f"Required marker not found: {marker}",
                    }
                )

    for path in changed_paths:
        kind = _match_doc_kind(path)
        if not kind:
            continue
        candidate = REPO_ROOT / path
        if not candidate.exists():
            continue
        text = candidate.read_text(encoding="utf-8")
        for marker in DOC_REQUIRED_MARKERS[kind]:
            if marker not in text:
                violations.append(
                    {
                        "type": "missing_doc_section",
                        "path": path,
                        "message": f"Changed {kind} document is missing required section/marker: {marker}",
                    }
                )

    payload: dict[str, Any] = {
        "timestamp": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "range": f"{resolved_base}..{resolved_head}",
        "baseSource": base_source,
        "requiredFilesChecked": len(REQUIRED_FILES),
        "relevantProductValueFilesChanged": sum(1 for p in changed_paths if _match_doc_kind(p)),
        "violationCount": len(violations),
        "violations": violations,
        "compliant": not violations,
    }
    print(json.dumps(payload, indent=2))

    if violations and args.enforce:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
