#!/usr/bin/env python3
"""
DARA-T2 Architecture Readiness Admission - constants and schema-level helpers.

Extracted from check_work_order_dispatch_quality_source.py at DARA-T2-R1 to
satisfy the near-threshold rotation requirement (python_checker hard limit 1000).
All names are re-exported from check_work_order_dispatch_quality_source for
backward compatibility with all existing callers.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from check_work_order_dispatch_quality_tables import (
    _extract_section,
    _normalize_table_key,
    _parse_any_markdown_tables,
)

REPO_ROOT = Path(__file__).resolve().parents[2]


ARCHITECTURE_READINESS_MARKER = "Architecture-Readiness Admission:"
ARCHITECTURE_BINDING_MATRIX_HEADING = "Architecture Binding Matrix"
ARCHITECTURE_READINESS_REQUIRED = "REQUIRED"
ARCHITECTURE_READINESS_NOT_APPLICABLE_TOKENS = (
    "NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO",
    "NOT_APPLICABLE_INTERNAL_AGENT_WITH_REASON",
)
ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED = "BLOCKED_ARCHITECTURE_APPLICABILITY_UNCLASSIFIED"
ARCHITECTURE_READINESS_ALLOWED_DECLARATIONS = (
    ARCHITECTURE_READINESS_REQUIRED,
    *ARCHITECTURE_READINESS_NOT_APPLICABLE_TOKENS,
    ARCHITECTURE_READINESS_BLOCKED_UNCLASSIFIED,
)
ARCHITECTURE_MATRIX_SCHEMA = "cvf.dara.architectureBindingMatrix.v1"
ARCHITECTURE_MATRIX_ROW_COLUMNS = (
    "criterionId", "riskClass", "behaviorIdentity", "canonicalOwnerPath",
    "canonicalOwnerLocator", "implementationDisposition", "implementationPath",
    "implementationSymbol", "producerPath", "producerSymbol", "trustSource",
    "contextCarrierPath", "contextField", "exportPath", "exportSymbol",
    "registrationPath", "registrationSymbol", "compositionRootPath",
    "compositionRootSymbol", "runtimeConsumerPath", "runtimeConsumerSymbol",
    "positiveTestPath", "negativeTestPath", "bypassTestPath",
    "compositionTestPath", "compatibilityDisposition", "rollbackPaths",
    "evidenceOutputPath", "machineDisposition", "semanticAcceptance",
    "semanticReviewPath", "semanticReviewCommit",
)
ARCHITECTURE_MATRIX_DIGEST_PREIMAGE_COLUMNS = ARCHITECTURE_MATRIX_ROW_COLUMNS[
    : ARCHITECTURE_MATRIX_ROW_COLUMNS.index("evidenceOutputPath") + 1
]
ARCHITECTURE_MATRIX_DERIVED_COLUMNS = (
    "machineDisposition", "semanticAcceptance", "semanticReviewPath", "semanticReviewCommit",
)
ARCHITECTURE_RISK_CLASSES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
ARCHITECTURE_IMPLEMENTATION_DISPOSITIONS = {"EXTEND_EXISTING", "CREATE_NEW"}
ARCHITECTURE_MACHINE_PASS = "PASS_IDENTITY_AND_COVERAGE"
ARCHITECTURE_SEMANTIC_ACCEPTANCE_VALUES = {
    "PENDING_REVIEW", "ACCEPTED_BOUNDED", "REJECTED_WITH_REASON",
}
ARCHITECTURE_NONE_WITH_REASON_PREFIX = "NONE_WITH_REASON:"
ARCHITECTURE_NONE_CONTRACT_ONLY_PREFIX = "NONE_WITH_REASON:CONTRACT_ONLY_"
ARCHITECTURE_READINESS_LOW_RISK_PREFIX = "NOT_APPLICABLE_EXTERNAL_LOW_RISK_WITH_REASON:"
ARCHITECTURE_AUTHORITY_REJECT_PATH_RE = re.compile(
    r"(?:^|/)\.private_reference/|(?:^|/)archive/|(?:^|/)ECOSYSTEM/private/|"
    r"(?:^|/)\.claude/|(?:^|/)\.codex/|(?:^|/)\.cursor/|"
    r"\.\.|"
    r"^(?:[A-Za-z]:\\|/|\\\\)",
    re.IGNORECASE,
)
ARCHITECTURE_PLACEHOLDER_RE = re.compile(
    r"\bTBD\b|\bTODO\b|<[^>]+>|\bworker[- ]select|\bto be (?:selected|determined)\b",
    re.IGNORECASE,
)
ARCHITECTURE_MATRIX_SCALAR_FIELDS = (
    "architectureMatrixSchema", "architectureMatrixRowCount",
    "architectureMatrixCanonicalDigest", "architectureMatrixDigestRecipe",
    "architectureMachineDisposition", "architectureSemanticDisposition",
    "architectureSemanticReviewPath", "architectureSemanticReviewCommit",
    "architectureSemanticReviewFileSha256",
)
ARCHITECTURE_ECHO_FIELDS = (
    "architectureMatrixSchema", "architectureMatrixCanonicalDigest",
    "architectureSemanticReviewPath", "architectureSemanticReviewCommit",
    "architectureSemanticReviewFileSha256", "architectureBindingEchoDisposition",
)
ARCHITECTURE_ECHO_DISPOSITION_VALUES = {"EXACT_MATCH", "BLOCKED_IDENTITY_DRIFT"}


def _extract_scalar_field(text: str, field_name: str) -> str | None:
    """Return the value of a top-level `fieldName: value` scalar line, or
    None if the field is absent. Mirrors the plain `field: value` shape used
    throughout dispatch packets (not a markdown table cell)."""
    match = re.search(
        rf"(?m)^\s*(?:[-*]\s*)?{re.escape(field_name)}\s*:\s*(.+?)\s*$",
        text,
    )
    return match.group(1).strip().strip("`") if match else None


def _architecture_readiness_declaration(text: str) -> str | None:
    match = re.search(
        rf"(?m)^{re.escape(ARCHITECTURE_READINESS_MARKER)}\s*(\S+)\s*$",
        text,
    )
    return match.group(1).strip().strip("`") if match else None


def _architecture_matrix_rows(text: str) -> list[dict[str, str]]:
    section = _extract_section(text, ARCHITECTURE_BINDING_MATRIX_HEADING)
    if not section:
        return []
    tables = _parse_any_markdown_tables(section)
    rows: list[dict[str, str]] = []
    for table in tables:
        if table and all(column in table[0] for column in ARCHITECTURE_MATRIX_ROW_COLUMNS):
            rows.extend(table)
    return rows


def _architecture_digest_preimage_bytes(rows: list[dict[str, str]]) -> bytes:
    """Deterministic digest preimage: UTF-8 no BOM, LF row separation,
    forward-slash repo-relative paths, ordinal/code-point row order by
    criterionId, one trailing LF. Only immutable authoring columns
    (criterionId through evidenceOutputPath) are hashed."""
    ordered = sorted(rows, key=lambda row: row.get("criterionId", ""))
    lines = []
    for row in ordered:
        cells = [
            row.get(column, "").strip().replace("\\", "/")
            for column in ARCHITECTURE_MATRIX_DIGEST_PREIMAGE_COLUMNS
        ]
        lines.append("|".join(cells))
    body = "\n".join(lines)
    if body:
        body += "\n"
    return body.encode("utf-8")


def _architecture_matrix_canonical_digest(rows: list[dict[str, str]]) -> str:
    import hashlib
    return hashlib.sha256(_architecture_digest_preimage_bytes(rows)).hexdigest()


def _is_none_with_reason(value: str) -> bool:
    return value.strip().startswith(ARCHITECTURE_NONE_WITH_REASON_PREFIX) and len(
        value.strip()
    ) > len(ARCHITECTURE_NONE_WITH_REASON_PREFIX)


def _is_contract_only_none(value: str) -> bool:
    return value.strip().startswith(ARCHITECTURE_NONE_CONTRACT_ONLY_PREFIX) and len(
        value.strip()
    ) > len(ARCHITECTURE_NONE_CONTRACT_ONLY_PREFIX)


def _extract_writable_manifest_paths(text: str) -> set[str]:
    """Return repo-relative paths from the Planned Worker Fulfillment Manifest table."""
    section = _extract_section(text, "Planned Worker Fulfillment Manifest")
    if not section:
        return set()
    paths: set[str] = set()
    for table in _parse_any_markdown_tables(section):
        for row in table:
            for key, val in row.items():
                if _normalize_table_key(key) == "path" and val.strip().strip("`"):
                    paths.add(val.strip().strip("`").replace("\\", "/"))
    return paths


def _validate_immutable_review_identity_fields(
    review_path: str | None,
    review_commit: str | None,
    review_sha: str | None,
    digest: str | None,
    exists_rel_fn,
    criterion_ids: list[str] | None = None,
    context_label: str = "",
) -> list[str]:
    """Shared validator for ACCEPTED_BOUNDED and NOT_APPLICABLE_ACCEPTED_DESIGN_ECHO.

    Checks: digest present and attested by the committed review bytes, review
    path exists on disk, commit is 40-hex ancestor of HEAD, review-path
    committed-bytes SHA matches, every criterion ID found. All mandatory
    identity fields (digest, path, commit, sha) fail closed when absent, and
    the digest is verified against the immutable committed review bytes, not
    merely checked for non-emptiness. Identical inputs produce identical
    blocking results on both routes.
    """
    import hashlib
    issues: list[str] = []
    prefix = f"`{context_label}` " if context_label else ""
    if not digest:
        issues.append(f"{prefix}requires `architectureMatrixCanonicalDigest`")
    if not review_path or not exists_rel_fn(review_path):
        issues.append(f"{prefix}requires an existing `architectureSemanticReviewPath`")
    elif not review_commit:
        issues.append(f"{prefix}requires `architectureSemanticReviewCommit`")
    elif not review_sha:
        issues.append(f"{prefix}requires `architectureSemanticReviewFileSha256`")
    else:
        if not re.match(r"^[0-9a-f]{40}$", review_commit):
            issues.append("`architectureSemanticReviewCommit` must be exactly 40 lowercase hex characters")
        elif subprocess.run(["git", "-C", str(REPO_ROOT), "merge-base", "--is-ancestor",
                             review_commit, "HEAD"], capture_output=True).returncode != 0:
            issues.append("`architectureSemanticReviewCommit` is not an ancestor of HEAD")
        else:
            _b = subprocess.run(["git", "-C", str(REPO_ROOT), "show",
                                 f"{review_commit}:{review_path}"], capture_output=True)
            if _b.returncode != 0:
                issues.append(f"`architectureSemanticReviewPath` does not exist in commit `{review_commit}`")
            else:
                if hashlib.sha256(_b.stdout).hexdigest() != review_sha.lower():
                    issues.append(
                        "`architectureSemanticReviewFileSha256` does not match the committed "
                        "bytes; the reviewed file changed after acceptance")
                committed_text = _b.stdout.decode("utf-8", errors="replace")
                if digest and digest.lower() not in committed_text.lower():
                    issues.append(
                        f"{prefix}`architectureMatrixCanonicalDigest` `{digest}` is not attested "
                        "by the committed review bytes; the digest must be verified against the "
                        "immutable committed review evidence, not merely be a nonempty string")
                if criterion_ids:
                    missing = [c for c in criterion_ids if c and c not in committed_text]
                    if missing:
                        issues.append(
                            "`architectureSemanticReviewPath` does not mention every matrix "
                            f"`criterionId` in the committed bytes: {', '.join(missing)}")
    return issues
