#!/usr/bin/env python3
"""
CVF GC-051 Corpus Scan Registry Checker

Validates docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json for:
  1. Required fields on every entry
  2. Finding disposition completeness on SCANNED_WITH_FINDINGS entries
  3. Manifest hash format (must be 64-char hex SHA-256, not a path or description)
  4. Changed docs/audits/*.md AND docs/reviews/*.md coverage (corpus paths need registry entries)
  5. Status and disposition vocabulary (allowed enums only)
  6. Aggregate drift from per-entry source files

Standard: docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md
Guard:    governance/toolkit/05_OPERATION/CVF_GC051_CORPUS_SCAN_REGISTRY_GUARD.md

Hash standard: SHA-256 of sorted filesystem paths joined with newline + trailing newline.
hashAlgorithm: sha256 | hashInput: sorted-paths-newline-joined-with-trailing-newline
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

from generate_corpus_scan_registry import validate_aggregate_matches_sources

REPO_ROOT = Path(__file__).resolve().parents[2]
REGISTRY_PATH = REPO_ROOT / "docs" / "corpus-intelligence" / "CVF_CORPUS_SCAN_REGISTRY.json"
STANDARD_PATH = "docs/reference/CVF_CORPUS_SCAN_REGISTRY_STANDARD_2026-06-02.md"
GUARD_PATH = "governance/toolkit/05_OPERATION/CVF_GC051_CORPUS_SCAN_REGISTRY_GUARD.md"

REQUIRED_ENTRY_FIELDS = (
    "id",
    "corpusType",
    "displayName",
    "scopePaths",
    "status",
    "findings",
    "negativeSearchTerms",
    "nextScanRecommendation",
)

REQUIRED_FINDING_FIELDS = (
    "id",
    "summary",
    "disposition",
    "nextAction",
    "defectClass",
    "learningLane",
)

# Dispositions that require action evidence: a roadmap ref, work order ref, or f2gRef.
# Without at least one of these, the finding has no traceable follow-through path.
DISPOSITIONS_REQUIRING_ACTION_EVIDENCE = {
    "DEFER_WITH_ROADMAP",
    "DEFER_PHASED",
    "BLOCKED_PENDING_DECISION",
}

# Allowed values — aligned with Finding-To-Governance Learning Trigger Standard.
ALLOWED_DEFECT_CLASSES = {
    "WORKER_EXECUTION_ERROR",
    "ORCHESTRATOR_PACKET_GAP",
    "RULE_GAP",
    "MACHINE_GATE_GAP",
    "PHASE_GATE_PLACEMENT_GAP",
    "OPERATOR_SCOPE_CLARITY_GAP",
    "RUNTIME_SIGNAL_GAP",
    "UNVERIFIED_CLAIM",
    "DOCUMENTATION_GAP",
    "N/A",
}

ALLOWED_LEARNING_LANES = {
    "GOVERNANCE_CONTROL_PLANE",
    "RUNTIME_BEHAVIOR_LEARNING",
    "PROVIDER_OUTPUT_LEARNING",
    "COST_ECONOMICS_LEARNING",
    "DOCUMENTATION_ONLY_LEARNING",
    "N/A",
}

ALLOWED_CORPUS_TYPES = {
    "LEGACY_FOLDER",
    "PROJECT_SOURCE",
    "POLICY_DOCUMENT",
    "COMPANY_DOCS",
    "EXTERNAL_SOURCE",
    "CVF_EXTENSION",
    "TEST_CORPUS",
}

ALLOWED_STATUSES = {
    "NOT_STARTED",
    "PARTIALLY_SCANNED",
    "SCANNED",
    "SCANNED_WITH_FINDINGS",
    "DEEP_CLASSIFIED",
    "DEFERRED",
    "OUT_OF_SCOPE",
}

ALLOWED_FINDING_DISPOSITIONS = {
    "ACCEPT",
    "ACCEPT_NO_ACTION",
    "ACCEPT_WITH_BOUNDARY",
    "DEFER_WITH_ROADMAP",
    "DEFER_PHASED",
    "DEFER_DEMAND_GATED",
    "REJECT",
    "BLOCKED_PENDING_DECISION",
}

FINDINGS_REQUIRED_STATUSES = {"SCANNED_WITH_FINDINGS"}
MANIFEST_HASH_REQUIRED_VERDICT = "COMPLETE_VERIFIED"
MANIFEST_HASH_RE = re.compile(r"^[0-9a-f]{64}$")  # SHA-256 hex digest, lowercase
REQUIRED_HASH_ALGORITHM = "sha256"
ALLOWED_HASH_INPUTS = {
    "sorted-paths-newline-joined-with-trailing-newline",
    "manifest-internal-hash-from-script-output",
}
PENDING_REF_RE = re.compile(
    r"\b(PENDING|not yet opened|not yet dispatched|not yet created)\b",
    re.IGNORECASE,
)


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _get_changed_corpus_scan_files(base: str | None, head: str | None) -> list[str]:
    """Return changed docs/audits/*.md and docs/reviews/*.md file paths."""
    paths: list[str] = []
    if base and head and base != head:
        code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
        if code == 0 and out:
            paths.extend(out.splitlines())
    code, out, _ = _run_git(["diff", "--name-only", "--cached"])
    if code == 0 and out:
        paths.extend(out.splitlines())
    code, out, _ = _run_git(["diff", "--name-only"])
    if code == 0 and out:
        paths.extend(out.splitlines())
    return [
        p.strip().replace("\\", "/")
        for p in paths
        if (
            p.strip().startswith("docs/audits/") or p.strip().startswith("docs/reviews/")
        ) and p.strip().endswith(".md")
        and "/archive/" not in p.strip().replace("\\", "/")
    ]


def _extract_corpus_paths_from_text(text: str) -> list[str]:
    """Extract .private_reference/ and other corpus paths mentioned in a file."""
    patterns = [
        r"\.private_reference/legacy/[^\s`\"')\]]+",
        r"EXTENSIONS/[^\s`\"')\]]+",
    ]
    found = []
    for pat in patterns:
        found.extend(re.findall(pat, text))
    return list(set(found))


def _registry_covers_path(registry: dict, path: str) -> bool:
    """Check if any registry entry scopePaths covers the given path."""
    for entry in registry.get("corpora", []):
        for scope in entry.get("scopePaths", []):
            if path.startswith(scope.rstrip("/")) or scope.rstrip("/").startswith(path.rstrip("/")):
                return True
    return False


def _artifact_ref_exists(ref: str) -> bool:
    """Return true when a registry reference points to an existing repo file.

    References may include a markdown anchor after '#'. Only the path portion is
    checked here; semantic anchor validation remains reviewer work.
    """
    path_part = ref.split("#", 1)[0].strip().strip("`")
    if not path_part:
        return False
    return (REPO_ROOT / path_part).exists()


def _is_action_evidence_ref(ref: str) -> bool:
    """Reject parking placeholders as action evidence.

    A deferred finding can keep a pending roadmap/work-order note, but that note
    is not by itself traceable follow-through. Existing artifact refs are
    evidence; non-placeholder descriptions are allowed for demand-gated operator
    records.
    """
    value = (ref or "").strip()
    if not value or PENDING_REF_RE.search(value):
        return False
    if value.startswith("docs/") or value.startswith("governance/") or "#" in value:
        return _artifact_ref_exists(value)
    return True


def _validate_entry(entry: dict, idx: int) -> list[str]:
    violations: list[str] = []
    entry_id = entry.get("id", f"entry[{idx}]")

    # Required fields
    for field in REQUIRED_ENTRY_FIELDS:
        if field not in entry:
            violations.append(f"{entry_id}: missing required field `{field}`")

    # corpusType enum
    ct = entry.get("corpusType", "")
    if ct and ct not in ALLOWED_CORPUS_TYPES:
        violations.append(f"{entry_id}: invalid corpusType `{ct}` — must be one of {sorted(ALLOWED_CORPUS_TYPES)}")

    # status enum
    status = entry.get("status", "")
    if status and status not in ALLOWED_STATUSES:
        violations.append(f"{entry_id}: invalid status `{status}` — must be one of {sorted(ALLOWED_STATUSES)}")

    # scopePaths must be non-empty list
    scope = entry.get("scopePaths", [])
    if not isinstance(scope, list) or not scope:
        violations.append(f"{entry_id}: `scopePaths` must be a non-empty list")

    # SCANNED_WITH_FINDINGS must have at least one finding
    if status in FINDINGS_REQUIRED_STATUSES:
        findings = entry.get("findings", [])
        if not findings:
            violations.append(
                f"{entry_id}: status `{status}` requires at least one entry in `findings[]`"
            )

    # Validate finding records
    for fidx, finding in enumerate(entry.get("findings", [])):
        fid = finding.get("id", f"{entry_id}.finding[{fidx}]")
        for field in REQUIRED_FINDING_FIELDS:
            if field not in finding:
                violations.append(f"{fid}: missing required finding field `{field}`")
        disp = finding.get("disposition", "")
        if disp and disp not in ALLOWED_FINDING_DISPOSITIONS:
            violations.append(
                f"{fid}: invalid disposition `{disp}` — must be one of {sorted(ALLOWED_FINDING_DISPOSITIONS)}"
            )
        if not finding.get("nextAction", "").strip():
            violations.append(f"{fid}: `nextAction` must not be empty")

        # defectClass and learningLane enum validation
        dc = finding.get("defectClass", "")
        if dc and dc not in ALLOWED_DEFECT_CLASSES:
            violations.append(
                f"{fid}: invalid defectClass `{dc}` — must be one of {sorted(ALLOWED_DEFECT_CLASSES)}"
            )
        ll = finding.get("learningLane", "")
        if ll and ll not in ALLOWED_LEARNING_LANES:
            violations.append(
                f"{fid}: invalid learningLane `{ll}` — must be one of {sorted(ALLOWED_LEARNING_LANES)}"
            )

        # DEFER_WITH_ROADMAP / DEFER_PHASED / BLOCKED_PENDING_DECISION require action evidence:
        # at least one of roadmapRef, workOrderRef, or f2gRef must be a real,
        # non-placeholder artifact reference or non-pending action description.
        if disp in DISPOSITIONS_REQUIRING_ACTION_EVIDENCE:
            has_evidence = any(
                _is_action_evidence_ref(finding.get(k, ""))
                for k in ("roadmapRef", "workOrderRef", "f2gRef")
            )
            if not has_evidence:
                violations.append(
                    f"{fid}: disposition `{disp}` requires at least one of "
                    f"`roadmapRef`, `workOrderRef`, or `f2gRef` to point to "
                    f"real follow-through evidence; PENDING/not-yet placeholders "
                    f"do not count as action evidence"
                )

    # COMPLETE_VERIFIED gc047 must have a valid 64-hex SHA-256 manifestHash
    verdicts = entry.get("verdicts", {})
    if verdicts.get("gc047") == MANIFEST_HASH_REQUIRED_VERDICT:
        manifest_hash = entry.get("manifestHash") or ""
        if not manifest_hash:
            violations.append(
                f"{entry_id}: verdicts.gc047=COMPLETE_VERIFIED requires non-null `manifestHash`"
            )
        elif not MANIFEST_HASH_RE.match(manifest_hash.strip()):
            violations.append(
                f"{entry_id}: `manifestHash` must be a 64-character lowercase SHA-256 hex digest, "
                f"not a path or description (got: `{manifest_hash[:40]}{'...' if len(manifest_hash) > 40 else ''}`)"
            )

    # Any non-null manifest hash must declare reproducibility metadata.
    manifest_hash_value = entry.get("manifestHash")
    if manifest_hash_value:
        if entry.get("hashAlgorithm") != REQUIRED_HASH_ALGORITHM:
            violations.append(
                f"{entry_id}: non-null `manifestHash` requires "
                f"`hashAlgorithm={REQUIRED_HASH_ALGORITHM}`"
            )
        hash_input = entry.get("hashInput")
        if hash_input not in ALLOWED_HASH_INPUTS:
            violations.append(
                f"{entry_id}: non-null `manifestHash` requires `hashInput` "
                f"to be one of {sorted(ALLOWED_HASH_INPUTS)}"
            )

    return violations


def _check_audit_coverage(registry: dict, changed_audits: list[str]) -> list[str]:
    """Check that changed docs/audits/*.md files have registry coverage."""
    violations: list[str] = []
    for audit_path in changed_audits:
        full = REPO_ROOT / audit_path
        if not full.exists():
            continue
        try:
            text = full.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        corpus_paths = _extract_corpus_paths_from_text(text)
        for cp in corpus_paths:
            if not _registry_covers_path(registry, cp):
                violations.append(
                    f"{audit_path}: mentions corpus path `{cp}` but "
                    f"no registry entry covers it in CVF_CORPUS_SCAN_REGISTRY.json"
                )
    return violations


def main(enforce: bool = False, base: str | None = None, head: str | None = None) -> int:
    print("=== CVF Corpus Scan Registry Gate (GC-051) ===")
    print(f"Registry: {REGISTRY_PATH.relative_to(REPO_ROOT)}")

    if not REGISTRY_PATH.exists():
        print(f"\nMISSING — registry file not found: {REGISTRY_PATH}")
        if enforce:
            return 1
        return 0

    try:
        registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"\nINVALID JSON — {exc}")
        return 1 if enforce else 0

    violations: list[str] = []

    # If per-entry source files exist, the aggregate JSON must be generated from
    # those sources. This keeps agents from hand-editing the monolithic registry
    # and silently drifting from the reviewable source entries.
    violations.extend(validate_aggregate_matches_sources())

    # Validate schema version
    if "schemaVersion" not in registry:
        violations.append("registry missing `schemaVersion` field")

    # Validate corpora list
    corpora = registry.get("corpora", [])
    if not isinstance(corpora, list):
        violations.append("registry `corpora` must be a list")
    else:
        # Check for duplicate IDs
        seen_ids: set[str] = set()
        for idx, entry in enumerate(corpora):
            entry_id = entry.get("id", f"entry[{idx}]")
            if entry_id in seen_ids:
                violations.append(f"duplicate corpus id: `{entry_id}`")
            seen_ids.add(entry_id)
            violations.extend(_validate_entry(entry, idx))

    # Check audit + review file coverage (F4: expand beyond docs/audits/ only)
    changed_audits = _get_changed_corpus_scan_files(base, head)
    if changed_audits:
        print(f"Changed audit/review files checked: {len(changed_audits)}")
        violations.extend(_check_audit_coverage(registry, changed_audits))

    total = len(corpora) if isinstance(corpora, list) else 0
    print(f"Corpora registered: {total}")
    print(f"Violations: {len(violations)}")

    if violations:
        print("\nViolations:")
        for v in violations:
            print(f"  - {v}")
        print(f"\nVIOLATION — corpus scan registry is incomplete or invalid.")
        print(f"Standard: {STANDARD_PATH}")
        return 1 if enforce else 0

    print("\nCOMPLIANT — corpus scan registry is valid.")
    return 0


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="CVF GC-051 Corpus Scan Registry Checker")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on violation")
    parser.add_argument("--base", default=None, help="Base git ref for changed-file detection")
    parser.add_argument("--head", default=None, help="Head git ref for changed-file detection")
    args = parser.parse_args()

    sys.exit(main(enforce=args.enforce, base=args.base, head=args.head))
